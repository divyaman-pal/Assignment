import { DB_CONFIG } from '../../constants';
import { CREATE_TABLES_SQL } from './schema';
import { createId } from '../../utils/id';
import type {
  Worker,
  FaceTemplate,
  AttendanceLog,
  SyncQueueItem,
  DashboardStats,
} from '../../types';

type SQLiteDB = {
  executeSql: (sql: string, params?: any[]) => Promise<any>;
  transaction: (fn: (tx: any) => void) => Promise<void>;
};

let db: SQLiteDB | null = null;

function encodeEmbedding(embedding: Float32Array): string {
  const bytes = new Uint8Array(
    embedding.buffer as ArrayBuffer,
    embedding.byteOffset,
    embedding.byteLength,
  );
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeEmbedding(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Float32Array(bytes.buffer as ArrayBuffer);
}

export class DatabaseService {
  private static instance: DatabaseService;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const { open } = require('react-native-quick-sqlite');
      const connection = open({ name: DB_CONFIG.DATABASE_NAME });
      db = {
        executeSql: async (sql: string, params?: any[]) => {
          return connection.executeAsync(sql, params);
        },
        transaction: async (fn: (tx: any) => void) => {
          await connection.transaction(fn);
        },
      };
      await this.createTables();
      console.log('[DB] Database initialized successfully');
    } catch (error) {
      console.error('[DB] Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    const statements = CREATE_TABLES_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    for (const sql of statements) {
      await db.executeSql(sql + ';');
    }
  }

  // ─── Worker CRUD ─────────────────────────────────────────────

  async enrollWorker(
    name: string,
    workerId: string,
    department: string,
    role: string,
  ): Promise<Worker> {
    if (!db) throw new Error('Database not initialized');
    const id = createId('worker');
    const now = new Date().toISOString();
    await db.executeSql(
      `INSERT INTO enrolled_workers (id, worker_id, name, department, role, enrolled_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, workerId, name, department, role, now, now],
    );
    await this.addToSyncQueue('enrolled_workers', id, 'INSERT', {
      id, worker_id: workerId, name, department, role, enrolled_at: now,
    });
    return {
      id, workerId, name, department, role,
      enrolledAt: now, updatedAt: now, templateCount: 0, isActive: true,
    };
  }

  async getWorkers(): Promise<Worker[]> {
    if (!db) throw new Error('Database not initialized');
    const result = await db.executeSql(
      'SELECT * FROM enrolled_workers WHERE is_active = 1 ORDER BY name ASC',
    );
    return this.mapRows<Worker>(result, row => ({
      id: row.id,
      workerId: row.worker_id,
      name: row.name,
      department: row.department,
      role: row.role,
      enrolledAt: row.enrolled_at,
      updatedAt: row.updated_at,
      templateCount: row.template_count,
      isActive: Boolean(row.is_active),
    }));
  }

  async getWorkerById(id: string): Promise<Worker | null> {
    if (!db) throw new Error('Database not initialized');
    const result = await db.executeSql(
      'SELECT * FROM enrolled_workers WHERE id = ?',
      [id],
    );
    const rows = this.mapRows<Worker>(result, row => ({
      id: row.id,
      workerId: row.worker_id,
      name: row.name,
      department: row.department,
      role: row.role,
      enrolledAt: row.enrolled_at,
      updatedAt: row.updated_at,
      templateCount: row.template_count,
      isActive: Boolean(row.is_active),
    }));
    return rows.length > 0 ? rows[0] : null;
  }

  async deleteWorker(id: string): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    await db.executeSql('DELETE FROM face_templates WHERE worker_id = ?', [id]);
    await db.executeSql('DELETE FROM enrolled_workers WHERE id = ?', [id]);
    await this.addToSyncQueue('enrolled_workers', id, 'DELETE', { id });
  }

  async updateWorkerTemplateCount(workerId: string): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    await db.executeSql(
      `UPDATE enrolled_workers
       SET template_count = (SELECT COUNT(*) FROM face_templates WHERE worker_id = ?),
           updated_at = datetime('now')
       WHERE id = ?`,
      [workerId, workerId],
    );
  }

  // ─── Face Template CRUD ──────────────────────────────────────

  async saveFaceTemplate(
    workerId: string,
    embedding: Float32Array,
    quality: number,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    if (!db) throw new Error('Database not initialized');
    const id = createId('template');
    const now = new Date().toISOString();
    const embeddingBase64 = encodeEmbedding(embedding);

    await db.executeSql(
      `INSERT INTO face_templates (id, worker_id, embedding, quality, captured_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, workerId, embeddingBase64, quality, now, JSON.stringify(metadata)],
    );
    await this.updateWorkerTemplateCount(workerId);
    return id;
  }

  async getTemplatesForWorker(workerId: string): Promise<FaceTemplate[]> {
    if (!db) throw new Error('Database not initialized');
    const result = await db.executeSql(
      'SELECT * FROM face_templates WHERE worker_id = ? ORDER BY quality DESC',
      [workerId],
    );
    return this.mapRows<FaceTemplate>(result, row => ({
      id: row.id,
      workerId: row.worker_id,
      embedding: decodeEmbedding(row.embedding),
      embeddingBlob: decodeEmbedding(row.embedding).buffer as ArrayBuffer,
      quality: row.quality,
      capturedAt: row.captured_at,
      metadata: row.metadata,
    }));
  }

  async getAllTemplates(): Promise<
    { workerId: string; workerName: string; templates: FaceTemplate[] }[]
  > {
    if (!db) throw new Error('Database not initialized');

    const workersResult = await db.executeSql(
      `SELECT w.id, w.name FROM enrolled_workers w
       WHERE w.is_active = 1 AND w.template_count > 0`,
    );
    const workers = this.mapRows<{ id: string; name: string }>(workersResult, r => ({
      id: r.id, name: r.name,
    }));

    const all: { workerId: string; workerName: string; templates: FaceTemplate[] }[] = [];
    for (const w of workers) {
      const templates = await this.getTemplatesForWorker(w.id);
      if (templates.length > 0) {
        all.push({ workerId: w.id, workerName: w.name, templates });
      }
    }
    return all;
  }

  async deleteTemplate(templateId: string, workerId: string): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    await db.executeSql('DELETE FROM face_templates WHERE id = ?', [templateId]);
    await this.updateWorkerTemplateCount(workerId);
  }

  // ─── Attendance CRUD ─────────────────────────────────────────

  async logAttendance(
    workerId: string,
    workerName: string,
    confidence: number,
    livenessScore: number,
    livenessMethod: string,
    matchMargin: number,
    verificationTimeMs: number,
  ): Promise<AttendanceLog> {
    if (!db) throw new Error('Database not initialized');
    const id = createId('attendance');
    const now = new Date().toISOString();

    await db.executeSql(
      `INSERT INTO attendance_logs
       (id, worker_id, worker_name, timestamp, confidence, liveness_score,
        liveness_method, match_margin, verification_time_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, workerId, workerName, now, confidence, livenessScore,
       livenessMethod, matchMargin, verificationTimeMs],
    );

    const log: AttendanceLog = {
      id, workerId, workerName, timestamp: now,
      confidence, livenessScore, livenessMethod,
      matchMargin, verificationTimeMs,
      synced: false, syncedAt: null,
    };
    await this.addToSyncQueue('attendance_logs', id, 'INSERT', log);
    return log;
  }

  async getAttendanceLogs(limit = 100): Promise<AttendanceLog[]> {
    if (!db) throw new Error('Database not initialized');
    const result = await db.executeSql(
      `SELECT * FROM attendance_logs ORDER BY timestamp DESC LIMIT ?`,
      [limit],
    );
    return this.mapRows<AttendanceLog>(result, row => ({
      id: row.id,
      workerId: row.worker_id,
      workerName: row.worker_name,
      timestamp: row.timestamp,
      confidence: row.confidence,
      livenessScore: row.liveness_score,
      livenessMethod: row.liveness_method,
      matchMargin: row.match_margin,
      verificationTimeMs: row.verification_time_ms,
      synced: Boolean(row.synced),
      syncedAt: row.synced_at,
    }));
  }

  async getTodayAttendanceCount(): Promise<number> {
    if (!db) throw new Error('Database not initialized');
    const result = await db.executeSql(
      `SELECT COUNT(*) as count FROM attendance_logs
       WHERE date(timestamp) = date('now')`,
    );
    const rows = this.extractRows(result);
    return rows.length > 0 ? rows[0].count : 0;
  }

  async getWeekAttendanceCount(): Promise<number> {
    if (!db) throw new Error('Database not initialized');
    const result = await db.executeSql(
      `SELECT COUNT(*) as count FROM attendance_logs
       WHERE timestamp >= datetime('now', '-7 days')`,
    );
    const rows = this.extractRows(result);
    return rows.length > 0 ? rows[0].count : 0;
  }

  // ─── Sync Queue ──────────────────────────────────────────────

  async addToSyncQueue(
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payload: Record<string, any>,
  ): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    const id = createId('sync');
    await db.executeSql(
      `INSERT INTO sync_queue (id, table_name, record_id, operation, payload)
       VALUES (?, ?, ?, ?, ?)`,
      [id, tableName, recordId, operation, JSON.stringify(payload)],
    );
  }

  async getPendingSyncItems(limit = 50): Promise<SyncQueueItem[]> {
    if (!db) throw new Error('Database not initialized');
    const result = await db.executeSql(
      `SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC LIMIT ?`,
      [limit],
    );
    return this.mapRows<SyncQueueItem>(result, row => ({
      id: row.id,
      tableName: row.table_name,
      recordId: row.record_id,
      operation: row.operation,
      payload: row.payload,
      createdAt: row.created_at,
      synced: Boolean(row.synced),
      syncedAt: row.synced_at,
      retryCount: row.retry_count,
    }));
  }

  async getPendingSyncCount(): Promise<number> {
    if (!db) throw new Error('Database not initialized');
    const result = await db.executeSql(
      'SELECT COUNT(*) as count FROM sync_queue WHERE synced = 0',
    );
    const rows = this.extractRows(result);
    return rows.length > 0 ? rows[0].count : 0;
  }

  async markSynced(syncItemIds: string[]): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    if (syncItemIds.length === 0) return;
    const placeholders = syncItemIds.map(() => '?').join(',');
    const now = new Date().toISOString();
    await db.executeSql(
      `UPDATE sync_queue SET synced = 1, synced_at = ? WHERE id IN (${placeholders})`,
      [now, ...syncItemIds],
    );
  }

  async purgeCompletedSync(): Promise<number> {
    if (!db) throw new Error('Database not initialized');
    const result = await db.executeSql(
      'DELETE FROM sync_queue WHERE synced = 1',
    );
    const countResult = await db.executeSql(
      'SELECT changes() as deleted',
    );
    const rows = this.extractRows(countResult);
    return rows.length > 0 ? rows[0].deleted : 0;
  }

  async markAttendanceSynced(attendanceIds: string[]): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    if (attendanceIds.length === 0) return;
    const placeholders = attendanceIds.map(() => '?').join(',');
    const now = new Date().toISOString();
    await db.executeSql(
      `UPDATE attendance_logs SET synced = 1, synced_at = ?
       WHERE id IN (${placeholders})`,
      [now, ...attendanceIds],
    );
  }

  // ─── Dashboard Stats ────────────────────────────────────────

  async getDashboardStats(): Promise<DashboardStats> {
    if (!db) throw new Error('Database not initialized');

    const [workersR, templatesR, todayR, weekR, pendingR, avgR] = await Promise.all([
      db.executeSql('SELECT COUNT(*) as c FROM enrolled_workers WHERE is_active = 1'),
      db.executeSql('SELECT COUNT(*) as c FROM face_templates'),
      db.executeSql(
        "SELECT COUNT(*) as c FROM attendance_logs WHERE date(timestamp) = date('now')",
      ),
      db.executeSql(
        "SELECT COUNT(*) as c FROM attendance_logs WHERE timestamp >= datetime('now', '-7 days')",
      ),
      db.executeSql('SELECT COUNT(*) as c FROM sync_queue WHERE synced = 0'),
      db.executeSql('SELECT AVG(verification_time_ms) as avg FROM attendance_logs'),
    ]);

    const extract = (r: any) => {
      const rows = this.extractRows(r);
      return rows.length > 0 ? rows[0] : { c: 0, avg: 0 };
    };

    return {
      totalWorkers: extract(workersR).c,
      totalTemplates: extract(templatesR).c,
      todayAttendance: extract(todayR).c,
      weekAttendance: extract(weekR).c,
      pendingSync: extract(pendingR).c,
      avgVerificationMs: extract(avgR).avg || 0,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private extractRows(result: any): any[] {
    if (!result) return [];
    if (Array.isArray(result.rows)) return result.rows;
    if (result.rows?._array) return result.rows._array;
    if (result.rows?.length !== undefined) {
      const arr: any[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        arr.push(result.rows.item(i));
      }
      return arr;
    }
    return [];
  }

  private mapRows<T>(result: any, mapper: (row: any) => T): T[] {
    return this.extractRows(result).map(mapper);
  }
}

export default DatabaseService.getInstance();
