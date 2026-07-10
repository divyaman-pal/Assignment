import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from '../components/SafeIcon';
import { useRoute, useNavigation } from '@react-navigation/native';
import { UI_CONFIG } from '../constants';
import DatabaseService from '../services/database/DatabaseService';
import MatchingService from '../services/ml/MatchingService';
import { formatTimestamp } from '../utils/timing';
import type { Worker, FaceTemplate, AttendanceLog } from '../types';

export default function WorkerDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { workerId } = route.params;

  const [worker, setWorker] = useState<Worker | null>(null);
  const [templates, setTemplates] = useState<FaceTemplate[]>([]);
  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const w = await DatabaseService.getWorkerById(workerId);
      setWorker(w);

      if (w) {
        const t = await DatabaseService.getTemplatesForWorker(w.id);
        setTemplates(t);

        const allLogs = await DatabaseService.getAttendanceLogs(500);
        setRecentLogs(allLogs.filter(l => l.workerId === w.id).slice(0, 20));
      }
    } catch (err) {
      console.error('[WorkerDetail] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteTemplate = useCallback(
    async (templateId: string) => {
      Alert.alert(
        'Delete Template',
        'Are you sure you want to delete this face template?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await DatabaseService.deleteTemplate(templateId, workerId);
              MatchingService.invalidateCache();
              loadData();
            },
          },
        ],
      );
    },
    [workerId, loadData],
  );

  const handleDeleteWorker = useCallback(() => {
    if (!worker) return;
    Alert.alert(
      'Delete Worker',
      `Delete ${worker.name} and all their templates? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await DatabaseService.deleteWorker(worker.id);
            MatchingService.invalidateCache();
            navigation.goBack();
          },
        },
      ],
    );
  }, [worker, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UI_CONFIG.COLORS.primary} />
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="account-off" size={48} color={UI_CONFIG.COLORS.disabled} />
        <Text style={styles.notFoundText}>Worker not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Worker Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {worker.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.workerName}>{worker.name}</Text>
        <Text style={styles.workerIdText}>{worker.workerId}</Text>

        <View style={styles.detailGrid}>
          <DetailRow label="Department" value={worker.department} />
          <DetailRow label="Role" value={worker.role} />
          <DetailRow label="Enrolled" value={formatTimestamp(worker.enrolledAt)} />
          <DetailRow label="Templates" value={String(worker.templateCount)} />
          <DetailRow label="Status" value={worker.isActive ? 'Active' : 'Inactive'} />
        </View>
      </View>

      {/* Face Templates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Face Templates ({templates.length})
        </Text>
        {templates.map((template, idx) => (
          <View key={template.id} style={styles.templateRow}>
            <View style={styles.templateIcon}>
              <Icon name="face-recognition" size={20} color={UI_CONFIG.COLORS.primary} />
            </View>
            <View style={styles.templateInfo}>
              <Text style={styles.templateLabel}>Template #{idx + 1}</Text>
              <Text style={styles.templateMeta}>
                Quality: {(template.quality * 100).toFixed(0)}% •{' '}
                {formatTimestamp(template.capturedAt)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteTemplate(template.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="delete-outline" size={20} color={UI_CONFIG.COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Recent Attendance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Recent Attendance ({recentLogs.length})
        </Text>
        {recentLogs.length === 0 ? (
          <Text style={styles.emptyText}>No attendance records yet</Text>
        ) : (
          recentLogs.map(log => (
            <View key={log.id} style={styles.logRow}>
              <View style={styles.logLeft}>
                <Text style={styles.logTime}>
                  {formatTimestamp(log.timestamp)}
                </Text>
              </View>
              <View style={styles.logRight}>
                <Text style={styles.logConfidence}>
                  {(log.confidence * 100).toFixed(0)}% match
                </Text>
                <Text style={styles.logLiveness}>
                  Liveness: {log.livenessMethod}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteWorker}>
          <Icon name="delete" size={18} color={UI_CONFIG.COLORS.error} />
          <Text style={styles.deleteButtonText}>Delete Worker & All Templates</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.background,
  },
  content: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UI_CONFIG.COLORS.background,
  },
  notFoundText: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 12,
  },
  profileCard: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: UI_CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.primary,
  },
  workerName: {
    fontSize: 22,
    fontWeight: '800',
    color: UI_CONFIG.COLORS.text,
  },
  workerIdText: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 2,
  },
  detailGrid: {
    width: '100%',
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: UI_CONFIG.COLORS.border,
  },
  detailLabel: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.text,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.text,
    marginBottom: 12,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  templateIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UI_CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.text,
  },
  templateMeta: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 2,
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
    flex: 1,
  },
  logTime: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.text,
    fontWeight: '500',
  },
  logRight: {
    alignItems: 'flex-end',
  },
  logConfidence: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.success,
    fontWeight: '600',
  },
  logLiveness: {
    fontSize: 10,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.disabled,
    textAlign: 'center',
    paddingVertical: 20,
  },
  dangerZone: {
    padding: 16,
    marginTop: 8,
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.error,
    marginBottom: 10,
  },
  deleteButton: {
    borderWidth: 1.5,
    borderColor: UI_CONFIG.COLORS.error,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteButtonText: {
    color: UI_CONFIG.COLORS.error,
    fontSize: 13,
    fontWeight: '700',
  },
});
