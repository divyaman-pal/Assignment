import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from '../components/SafeIcon';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { UI_CONFIG } from '../constants';
import { useWorkers, useAttendanceLogs, useDashboardStats } from '../hooks/useDatabase';
import { useMLStatus } from '../hooks/useMLStatus';
import SyncService from '../services/sync/SyncService';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ConfidenceBar from '../components/ConfidenceBar';
import { formatTimestamp, formatMs, formatDate, groupByDate } from '../utils/timing';
import type { Worker, AttendanceLog, SyncStatus } from '../types';

type Tab = 'overview' | 'workers' | 'attendance' | 'diagnostics';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  const { stats, loading: statsLoading, refresh: refreshStats } = useDashboardStats();
  const { workers, loading: workersLoading, refresh: refreshWorkers } = useWorkers();
  const { logs, loading: logsLoading, refresh: refreshLogs } = useAttendanceLogs(200);
  const { status: mlStatus } = useMLStatus();

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, []),
  );

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([refreshStats(), refreshWorkers(), refreshLogs()]);
    try {
      const status = await SyncService.getStatus();
      setSyncStatus(status);
    } catch {}
    setRefreshing(false);
  };

  const handleSync = async () => {
    const result = await SyncService.syncPending();
    Alert.alert(
      'Sync Complete',
      `Synced: ${result.synced}\nFailed: ${result.failed}\nPurged: ${result.purged}`,
    );
    refreshAll();
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {([
          { key: 'overview', label: 'Overview', icon: 'chart-box' },
          { key: 'workers', label: 'Workers', icon: 'account-group' },
          { key: 'attendance', label: 'Logs', icon: 'clipboard-list' },
          { key: 'diagnostics', label: 'System', icon: 'tune' },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}>
            <Icon
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? UI_CONFIG.COLORS.primary : UI_CONFIG.COLORS.textSecondary}
            />
            <Text
              style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
        }>
        {activeTab === 'overview' && stats && (
          <OverviewTab
            stats={stats}
            syncStatus={syncStatus}
            onSync={handleSync}
          />
        )}
        {activeTab === 'workers' && (
          <WorkersTab
            workers={workers}
            onWorkerPress={(w) => navigation.navigate('WorkerDetail', { workerId: w.id })}
          />
        )}
        {activeTab === 'attendance' && <AttendanceTab logs={logs} />}
        {activeTab === 'diagnostics' && (
          <DiagnosticsTab mlStatus={mlStatus} stats={stats} />
        )}
      </ScrollView>
    </View>
  );
}

function OverviewTab({
  stats,
  syncStatus,
  onSync,
}: {
  stats: any;
  syncStatus: SyncStatus | null;
  onSync: () => void;
}) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <StatCard title="Workers" value={stats.totalWorkers} icon="account-group" color={UI_CONFIG.COLORS.primary} />
        <StatCard title="Templates" value={stats.totalTemplates} icon="face-recognition" color="#7C4DFF" />
      </View>
      <View style={[styles.statsRow, { marginTop: 8 }]}>
        <StatCard title="Today" value={stats.todayAttendance} icon="calendar-today" color={UI_CONFIG.COLORS.success} />
        <StatCard title="This Week" value={stats.weekAttendance} icon="calendar-week" color={UI_CONFIG.COLORS.accent} />
      </View>

      {/* Sync Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="cloud-sync" size={20} color={UI_CONFIG.COLORS.primary} />
          <Text style={styles.cardTitle}>Sync Queue</Text>
        </View>
        <View style={styles.syncInfo}>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Pending Items</Text>
            <Text style={styles.syncValue}>{stats.pendingSync}</Text>
          </View>
          {syncStatus?.lastSyncAt && (
            <View style={styles.syncRow}>
              <Text style={styles.syncLabel}>Last Sync</Text>
              <Text style={styles.syncValue}>{formatTimestamp(syncStatus.lastSyncAt)}</Text>
            </View>
          )}
          {syncStatus?.lastError && (
            <Text style={styles.syncError}>{syncStatus.lastError}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.syncButton} onPress={onSync}>
          <Icon name="sync" size={16} color="#FFF" />
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      </View>

      {/* Performance */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="speedometer" size={20} color={UI_CONFIG.COLORS.accent} />
          <Text style={styles.cardTitle}>Performance</Text>
        </View>
        <View style={styles.syncRow}>
          <Text style={styles.syncLabel}>Avg Verification</Text>
          <Text style={styles.syncValue}>
            {stats.avgVerificationMs ? formatMs(stats.avgVerificationMs) : 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function WorkersTab({
  workers,
  onWorkerPress,
}: {
  workers: Worker[];
  onWorkerPress: (w: Worker) => void;
}) {
  if (workers.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon name="account-off" size={48} color={UI_CONFIG.COLORS.disabled} />
        <Text style={styles.emptyText}>No workers enrolled yet</Text>
        <Text style={styles.emptyHint}>Go to Enroll tab to register workers</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.listHeader}>{workers.length} Enrolled Workers</Text>
      {workers.map(worker => (
        <TouchableOpacity
          key={worker.id}
          style={styles.workerRow}
          onPress={() => onWorkerPress(worker)}>
          <View style={styles.workerAvatar}>
            <Text style={styles.workerInitial}>
              {worker.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{worker.name}</Text>
            <Text style={styles.workerMeta}>
              {worker.workerId} • {worker.department}
            </Text>
          </View>
          <View style={styles.workerRight}>
            <Text style={styles.templateCount}>{worker.templateCount} templates</Text>
            <Icon name="chevron-right" size={20} color={UI_CONFIG.COLORS.disabled} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AttendanceTab({ logs }: { logs: AttendanceLog[] }) {
  if (logs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon name="clipboard-text-off" size={48} color={UI_CONFIG.COLORS.disabled} />
        <Text style={styles.emptyText}>No attendance records yet</Text>
        <Text style={styles.emptyHint}>Verify workers to create records</Text>
      </View>
    );
  }

  const grouped = groupByDate(logs);
  const dateKeys = Array.from(grouped.keys()).sort().reverse();

  return (
    <View style={styles.tabContent}>
      <Text style={styles.listHeader}>{logs.length} Records</Text>
      {dateKeys.map(dateKey => (
        <View key={dateKey}>
          <Text style={styles.dateHeader}>{formatDate(dateKey + 'T00:00:00')}</Text>
          {grouped.get(dateKey)!.map(log => (
            <View key={log.id} style={styles.logRow}>
              <View style={styles.logLeft}>
                <Text style={styles.logName}>{log.workerName}</Text>
                <Text style={styles.logTime}>
                  {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit', hour12: true,
                  })}
                </Text>
              </View>
              <View style={styles.logRight}>
                <ConfidenceBar value={log.confidence} showPercentage height={4} />
                <View style={styles.logMeta}>
                  <Text style={styles.logMetaText}>
                    {formatMs(log.verificationTimeMs)}
                  </Text>
                  <StatusBadge
                    status={log.synced ? 'synced' : 'pending'}
                    size="small"
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function DiagnosticsTab({ mlStatus, stats }: { mlStatus: any; stats: any }) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="chip" size={20} color={UI_CONFIG.COLORS.primary} />
          <Text style={styles.cardTitle}>Model Status</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Face Detector (ML Kit)</Text>
          <StatusBadge status={mlStatus.faceDetector} size="small" />
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Embedding (MobileFaceNet)</Text>
          <StatusBadge status={mlStatus.embeddingModel} size="small" />
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Liveness Engine</Text>
          <StatusBadge status={mlStatus.livenessModel} size="small" />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="database" size={20} color="#7C4DFF" />
          <Text style={styles.cardTitle}>Database</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Workers</Text>
          <Text style={styles.diagValue}>{stats?.totalWorkers ?? 0}</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Templates</Text>
          <Text style={styles.diagValue}>{stats?.totalTemplates ?? 0}</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Attendance Records</Text>
          <Text style={styles.diagValue}>{(stats?.todayAttendance ?? 0) + (stats?.weekAttendance ?? 0)}</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Pending Sync</Text>
          <Text style={styles.diagValue}>{stats?.pendingSync ?? 0}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="information" size={20} color={UI_CONFIG.COLORS.textSecondary} />
          <Text style={styles.cardTitle}>System Info</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Model Architecture</Text>
          <Text style={styles.diagValue}>MobileFaceNet</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Embedding Size</Text>
          <Text style={styles.diagValue}>128-d</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Model Size</Text>
          <Text style={styles.diagValue}>~4.7 MB</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Matching Algorithm</Text>
          <Text style={styles.diagValue}>Cosine Similarity</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Liveness Method</Text>
          <Text style={styles.diagValue}>Multi-signal Fusion</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Database</Text>
          <Text style={styles.diagValue}>SQLite (Local)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: UI_CONFIG.COLORS.primary,
  },
  tabLabel: {
    fontSize: 10,
    color: UI_CONFIG.COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: UI_CONFIG.COLORS.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.lg,
    padding: 16,
    marginTop: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.text,
  },
  syncInfo: {},
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  syncLabel: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.textSecondary,
  },
  syncValue: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.text,
    fontWeight: '600',
  },
  syncError: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.error,
    marginTop: 4,
  },
  syncButton: {
    backgroundColor: UI_CONFIG.COLORS.primary,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.textSecondary,
    marginBottom: 10,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  workerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UI_CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.primary,
  },
  workerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  workerName: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.text,
  },
  workerMeta: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 2,
  },
  workerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateCount: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.textSecondary,
    fontWeight: '500',
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.text,
    marginTop: 12,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.border,
  },
  logRow: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    padding: 12,
    marginBottom: 6,
    elevation: 1,
  },
  logLeft: {
    width: 120,
  },
  logName: {
    fontSize: 13,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.text,
  },
  logTime: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 2,
  },
  logRight: {
    flex: 1,
    marginLeft: 12,
  },
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  logMetaText: {
    fontSize: 10,
    color: UI_CONFIG.COLORS.textSecondary,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: UI_CONFIG.COLORS.border,
  },
  diagLabel: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.textSecondary,
    flex: 1,
  },
  diagValue: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.text,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.disabled,
    marginTop: 4,
  },
});
