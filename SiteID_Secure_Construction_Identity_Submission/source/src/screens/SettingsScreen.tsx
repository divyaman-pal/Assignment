import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from '../components/SafeIcon';
import { UI_CONFIG, ML_CONFIG, SYNC_CONFIG } from '../constants';
import SyncService from '../services/sync/SyncService';

export default function SettingsScreen() {
  const [autoSync, setAutoSync] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const handleToggleAutoSync = (value: boolean) => {
    setAutoSync(value);
    if (value) {
      SyncService.startAutoSync();
    } else {
      SyncService.stopAutoSync();
    }
  };

  const handleForcePurge = () => {
    Alert.alert(
      'Purge Synced Records',
      'Remove all successfully synced records from the local queue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge',
          style: 'destructive',
          onPress: async () => {
            const count = await SyncService.forcePurge();
            Alert.alert('Purged', `${count} synced records removed from queue.`);
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ML Thresholds */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recognition Thresholds</Text>
        <View style={styles.card}>
          <SettingRow
            label="Similarity Threshold"
            value={String(ML_CONFIG.SIMILARITY_THRESHOLD)}
            description="Minimum cosine similarity for a match"
          />
          <SettingRow
            label="Match Margin"
            value={String(ML_CONFIG.MATCH_MARGIN_THRESHOLD)}
            description="Min gap between best and 2nd-best match"
          />
          <SettingRow
            label="Embedding Size"
            value={`${ML_CONFIG.EMBEDDING_SIZE}-d`}
            description="Dimensionality of face embeddings"
          />
          <SettingRow
            label="Max Templates/Worker"
            value={String(ML_CONFIG.MAX_TEMPLATES_PER_WORKER)}
            description="Maximum face templates per enrolled worker"
          />
          <SettingRow
            label="Min Enrollment Samples"
            value={String(ML_CONFIG.MIN_ENROLLMENT_SAMPLES)}
            description="Required samples for enrollment"
          />
        </View>
      </View>

      {/* Liveness Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Liveness Detection</Text>
        <View style={styles.card}>
          <SettingRow
            label="Blink Threshold"
            value={String(ML_CONFIG.LIVENESS_BLINK_THRESHOLD)}
            description="Eye-open probability below this = blink"
          />
          <SettingRow
            label="Smile Threshold"
            value={String(ML_CONFIG.LIVENESS_SMILE_THRESHOLD)}
            description="Smile probability above this = smile"
          />
          <SettingRow
            label="Head Rotation"
            value={`${ML_CONFIG.LIVENESS_HEAD_ROTATION_THRESHOLD}°`}
            description="Min head rotation for movement detection"
          />
        </View>
      </View>

      {/* Sync Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync & Connectivity</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.settingLabel}>Auto-Sync</Text>
              <Text style={styles.settingDesc}>
                Automatically sync when network is available
              </Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={handleToggleAutoSync}
              trackColor={{
                false: UI_CONFIG.COLORS.disabled,
                true: UI_CONFIG.COLORS.primaryLight,
              }}
              thumbColor={autoSync ? UI_CONFIG.COLORS.primary : '#f4f3f4'}
            />
          </View>
          <SettingRow
            label="Sync Interval"
            value={`${SYNC_CONFIG.SYNC_INTERVAL_MS / 1000}s`}
            description="Time between auto-sync attempts"
          />
          <SettingRow
            label="Batch Size"
            value={String(SYNC_CONFIG.BATCH_SIZE)}
            description="Records sent per sync batch"
          />
          <SettingRow
            label="Max Retries"
            value={String(SYNC_CONFIG.MAX_RETRY_COUNT)}
            description="Retry attempts before skipping"
          />

          <TouchableOpacity style={styles.actionButton} onPress={handleForcePurge}>
            <Icon name="delete-sweep" size={18} color={UI_CONFIG.COLORS.error} />
            <Text style={styles.actionButtonText}>Purge Synced Queue Items</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Debug */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.settingLabel}>Debug Mode</Text>
              <Text style={styles.settingDesc}>
                Show extra timing logs and debug info
              </Text>
            </View>
            <Switch
              value={debugMode}
              onValueChange={setDebugMode}
              trackColor={{
                false: UI_CONFIG.COLORS.disabled,
                true: UI_CONFIG.COLORS.primaryLight,
              }}
              thumbColor={debugMode ? UI_CONFIG.COLORS.primary : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.about}>
        <Text style={styles.aboutTitle}>SiteID v1.0.0</Text>
        <Text style={styles.aboutText}>
          Hackathon 7.0 — Offline Facial Recognition & Liveness Detection
        </Text>
        <Text style={styles.aboutText}>
          Built for SiteID Construction Identity
        </Text>
      </View>
    </ScrollView>
  );
}

function SettingRow({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Text style={styles.settingValue}>{value}</Text>
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
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.lg,
    padding: 4,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: UI_CONFIG.COLORS.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.text,
  },
  settingDesc: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 1,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: UI_CONFIG.COLORS.border,
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.error,
    fontWeight: '600',
  },
  about: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  aboutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.text,
  },
  aboutText: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
