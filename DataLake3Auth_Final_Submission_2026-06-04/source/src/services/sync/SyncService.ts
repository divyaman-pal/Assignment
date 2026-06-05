import { SYNC_CONFIG } from '../../constants';
import DatabaseService from '../database/DatabaseService';
import { createId } from '../../utils/id';
import type { SyncQueueItem, SyncStatus } from '../../types';

/**
 * Offline-first sync service for AWS-compatible backend.
 *
 * Flow:
 *   1. All mutations (enrollment, attendance) are written to local DB immediately.
 *   2. Each mutation also writes a sync_queue entry.
 *   3. When connectivity returns, SyncService batches pending items and POSTs to backend.
 *   4. On successful server acknowledgement, items are marked synced.
 *   5. Purge operation removes synced queue entries and marks attendance as synced.
 *
 * Biometric templates (face embeddings) are NOT synced by default — they stay local.
 * Only metadata (worker info, attendance logs) is synced.
 */
export class SyncService {
  private static instance: SyncService;
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private lastError: string | null = null;
  private lastSyncAt: string | null = null;
  private netInfoUnsubscribe: (() => void) | null = null;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Start automatic sync monitoring.
   * Checks connectivity periodically and syncs when online.
   */
  startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      const isConnected = await this.checkConnectivity();
      if (isConnected && !this.isSyncing) {
        await this.syncPending();
      }
    }, SYNC_CONFIG.SYNC_INTERVAL_MS);

    this.setupNetworkListener();
    console.log('[Sync] Auto-sync started');
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
    console.log('[Sync] Auto-sync stopped');
  }

  /**
   * Manually trigger a sync of all pending records.
   */
  async syncPending(): Promise<{ synced: number; failed: number; purged: number }> {
    if (this.isSyncing) {
      return { synced: 0, failed: 0, purged: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;
    let purged = 0;

    try {
      const db = DatabaseService;
      const pending = await db.getPendingSyncItems(SYNC_CONFIG.BATCH_SIZE);

      if (pending.length === 0) {
        console.log('[Sync] No pending items');
        return { synced: 0, failed: 0, purged: 0 };
      }

      console.log(`[Sync] Processing ${pending.length} pending items`);

      const grouped = this.groupByTable(pending);

      for (const [tableName, items] of Object.entries(grouped)) {
        try {
          const success = await this.sendBatch(tableName, items);
          if (success) {
            const ids = items.map(i => i.id);
            await db.markSynced(ids);

            if (tableName === 'attendance_logs') {
              const attendanceIds = items.map(i => i.recordId);
              await db.markAttendanceSynced(attendanceIds);
            }

            synced += items.length;
          } else {
            failed += items.length;
          }
        } catch (error) {
          console.error(`[Sync] Failed to sync ${tableName}:`, error);
          failed += items.length;
          this.lastError = String(error);
        }
      }

      if (synced > 0) {
        purged = await db.purgeCompletedSync();
        this.lastSyncAt = new Date().toISOString();
        this.lastError = null;
      }

      console.log(
        `[Sync] Complete: ${synced} synced, ${failed} failed, ${purged} purged`,
      );
    } catch (error) {
      console.error('[Sync] Sync failed:', error);
      this.lastError = String(error);
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed, purged };
  }

  async getStatus(): Promise<SyncStatus> {
    const pendingCount = await DatabaseService.getPendingSyncCount();
    return {
      pendingCount,
      lastSyncAt: this.lastSyncAt,
      isSyncing: this.isSyncing,
      lastError: this.lastError,
    };
  }

  /**
   * Force purge all synced records from the sync queue.
   */
  async forcePurge(): Promise<number> {
    return DatabaseService.purgeCompletedSync();
  }

  // ─── Internal ────────────────────────────────────────────────

  private groupByTable(items: SyncQueueItem[]): Record<string, SyncQueueItem[]> {
    const grouped: Record<string, SyncQueueItem[]> = {};
    for (const item of items) {
      if (!grouped[item.tableName]) {
        grouped[item.tableName] = [];
      }
      grouped[item.tableName].push(item);
    }
    return grouped;
  }

  /**
   * Send a batch of records to the backend.
   *
   * In production, replace this with actual AWS API Gateway / Lambda calls.
   * The payload structure is designed for easy mapping to DynamoDB or RDS.
   */
  private async sendBatch(
    tableName: string,
    items: SyncQueueItem[],
  ): Promise<boolean> {
    try {
      const payload = {
        table: tableName,
        records: items.map(item => ({
          operation: item.operation,
          recordId: item.recordId,
          data: JSON.parse(item.payload),
          clientTimestamp: item.createdAt,
        })),
      };

      const response = await fetch(`${SYNC_CONFIG.BASE_URL}/sync/${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': await this.getDeviceId(),
        },
        body: JSON.stringify(payload),
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 30000);
          return controller.signal;
        })(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      if (error instanceof TypeError && String(error).includes('Network')) {
        console.warn('[Sync] Network unavailable, will retry later');
        return false;
      }
      console.error(`[Sync] sendBatch failed for ${tableName}:`, error);
      return false;
    }
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      const NetInfo = require('@react-native-community/netinfo');
      const state = await NetInfo.fetch();
      return state.isConnected === true;
    } catch {
      return false;
    }
  }

  private setupNetworkListener(): void {
    try {
      const NetInfo = require('@react-native-community/netinfo');
      this.netInfoUnsubscribe = NetInfo.addEventListener((state: any) => {
        if (state.isConnected && !this.isSyncing) {
          console.log('[Sync] Network restored, triggering sync');
          this.syncPending().catch(console.error);
        }
      });
    } catch (error) {
      console.warn('[Sync] NetInfo not available:', error);
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = createId('device');
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch {
      return 'unknown-device';
    }
  }
}

export default SyncService.getInstance();
