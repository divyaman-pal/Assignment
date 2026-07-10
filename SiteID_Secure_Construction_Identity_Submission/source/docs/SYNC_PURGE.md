# Sync & Purge Mechanism

## Design Principles

1. **Offline-first**: All data is written locally first, always.
2. **Privacy-preserving**: Biometric embeddings never leave the device.
3. **Idempotent sync**: Server operations can be safely retried.
4. **Eventual consistency**: Local and server data converge when online.

## Data Flow

```
User Action (Enrollment/Attendance)
        │
        ▼
  ┌─────────────┐     ┌──────────────┐
  │ Local SQLite │────▶│  sync_queue   │
  │ (immediate)  │     │ (INSERT row)  │
  └─────────────┘     └──────────────┘
                              │
                    [Network Available]
                              │
                              ▼
                     ┌────────────────┐
                     │  SyncService   │
                     │  Batch POST    │
                     └────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  AWS Backend   │
                     │  API Gateway   │
                     │  + Lambda      │
                     └────────────────┘
                              │
                         200 OK
                              │
                              ▼
                     ┌────────────────┐
                     │  Mark synced   │
                     │  in sync_queue │
                     └────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  Purge synced  │
                     │  queue items   │
                     └────────────────┘
```

## sync_queue Schema

```sql
CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,       -- 'enrolled_workers' or 'attendance_logs'
    record_id TEXT NOT NULL,        -- ID of the source record
    operation TEXT NOT NULL,        -- 'INSERT', 'UPDATE', or 'DELETE'
    payload TEXT NOT NULL,          -- JSON of the record data
    created_at TEXT NOT NULL,
    synced INTEGER DEFAULT 0,       -- 0 = pending, 1 = synced
    synced_at TEXT,
    retry_count INTEGER DEFAULT 0
);
```

## What Gets Synced

| Data | Synced? | Reason |
|------|---------|--------|
| Worker metadata (name, ID, dept) | Yes | Backend needs to know who is enrolled |
| Attendance logs | Yes | Core business data |
| Face embeddings | **No** | Privacy — biometric data stays local |
| Face template quality scores | Yes (in metadata) | Useful for analytics |
| Sync queue items | N/A | Internal bookkeeping |

## Sync Triggers

1. **Auto-sync interval**: Every 60 seconds, check connectivity and sync
2. **Network state change**: When device goes from offline to online
3. **Manual sync**: User presses "Sync Now" in dashboard

## Batch Processing

- Items are synced in batches of 50 (configurable)
- Grouped by table name for efficient API calls
- Each batch is a single HTTP POST

## Retry Logic

- Max 5 retries per item
- On HTTP error: increment retry_count, keep in queue
- On network error: don't increment, wait for next sync cycle
- Items exceeding max retries stay in queue for manual resolution

## Purge Behavior

After successful sync acknowledgement:
1. `sync_queue` items marked `synced = 1` with timestamp
2. Corresponding `attendance_logs` marked `synced = 1`
3. Purge operation: `DELETE FROM sync_queue WHERE synced = 1`
4. Attendance records are **kept locally** (only queue entries are purged)

## API Contract

```http
POST /v1/sync/{table_name}
Content-Type: application/json
X-Device-Id: {uuid}

{
  "table": "attendance_logs",
  "records": [
    {
      "operation": "INSERT",
      "recordId": "uuid",
      "data": { ... },
      "clientTimestamp": "2026-06-03T10:30:00Z"
    }
  ]
}

Response: 200 OK
{ "acknowledged": true, "count": 1 }
```

## Security Considerations

- Device ID header for audit trail
- All sync payloads are JSON (no binary/biometric data)
- HTTPS for transport encryption
- Backend should validate and deduplicate by record_id
