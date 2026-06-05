export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS enrolled_workers (
    id TEXT PRIMARY KEY,
    worker_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    template_count INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS face_templates (
    id TEXT PRIMARY KEY,
    worker_id TEXT NOT NULL,
    embedding BLOB NOT NULL,
    quality REAL NOT NULL DEFAULT 0.0,
    captured_at TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT DEFAULT '{}',
    FOREIGN KEY (worker_id) REFERENCES enrolled_workers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance_logs (
    id TEXT PRIMARY KEY,
    worker_id TEXT NOT NULL,
    worker_name TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    confidence REAL NOT NULL,
    liveness_score REAL NOT NULL,
    liveness_method TEXT NOT NULL DEFAULT 'unknown',
    match_margin REAL NOT NULL DEFAULT 0.0,
    verification_time_ms REAL NOT NULL DEFAULT 0.0,
    synced INTEGER NOT NULL DEFAULT 0,
    synced_at TEXT,
    FOREIGN KEY (worker_id) REFERENCES enrolled_workers(id)
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK(operation IN ('INSERT', 'UPDATE', 'DELETE')),
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced INTEGER NOT NULL DEFAULT 0,
    synced_at TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_face_templates_worker ON face_templates(worker_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_worker ON attendance_logs(worker_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_attendance_synced ON attendance_logs(synced);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);
`;

export const DROP_TABLES_SQL = `
  DROP TABLE IF EXISTS sync_queue;
  DROP TABLE IF EXISTS attendance_logs;
  DROP TABLE IF EXISTS face_templates;
  DROP TABLE IF EXISTS enrolled_workers;
  DROP TABLE IF EXISTS app_config;
`;
