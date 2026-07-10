import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from '../components/SafeIcon';
import { useNavigation } from '@react-navigation/native';
import { UI_CONFIG } from '../constants';
import { useDashboardStats } from '../hooks/useDatabase';
import { useMLStatus } from '../hooks/useMLStatus';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { stats, loading: statsLoading, refresh: refreshStats } = useDashboardStats();
  const { status: mlStatus, initializing, initModels } = useMLStatus();

  useEffect(() => {
    initModels();
  }, [initModels]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name="shield-lock" size={48} color={UI_CONFIG.COLORS.primary} />
        </View>
        <Text style={styles.heroTitle}>SiteID</Text>
        <Text style={styles.heroSubtitle}>
          Offline Facial Recognition & Liveness Detection
        </Text>
        <Text style={styles.heroDescription}>
          Secure field personnel authentication without internet connectivity
        </Text>
      </View>

      {/* Model Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Face Detector</Text>
            <StatusBadge status={mlStatus.faceDetector} />
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Embedding Model</Text>
            <StatusBadge status={mlStatus.embeddingModel} />
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Liveness Engine</Text>
            <StatusBadge status={mlStatus.livenessModel} />
          </View>
        </View>
        {initializing && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={UI_CONFIG.COLORS.primary} />
            <Text style={styles.loadingText}>Loading ML models...</Text>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsRow}>
            <StatCard
              title="Workers"
              value={stats.totalWorkers}
              icon="account-group"
              color={UI_CONFIG.COLORS.primary}
            />
            <StatCard
              title="Today"
              value={stats.todayAttendance}
              icon="calendar-check"
              color={UI_CONFIG.COLORS.success}
            />
            <StatCard
              title="Pending Sync"
              value={stats.pendingSync}
              icon="cloud-upload"
              color={stats.pendingSync > 0 ? UI_CONFIG.COLORS.accent : UI_CONFIG.COLORS.success}
            />
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: UI_CONFIG.COLORS.primary }]}
            onPress={() => navigation.navigate('Enroll')}>
            <Icon name="account-plus" size={32} color={UI_CONFIG.COLORS.primary} />
            <Text style={styles.actionTitle}>New Enrollment</Text>
            <Text style={styles.actionDesc}>Register a new worker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: UI_CONFIG.COLORS.success }]}
            onPress={() => navigation.navigate('Verify')}>
            <Icon name="face-recognition" size={32} color={UI_CONFIG.COLORS.success} />
            <Text style={styles.actionTitle}>Mark Attendance</Text>
            <Text style={styles.actionDesc}>Verify & record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: UI_CONFIG.COLORS.accent }]}
            onPress={() => navigation.navigate('Dashboard')}>
            <Icon name="view-dashboard" size={32} color={UI_CONFIG.COLORS.accent} />
            <Text style={styles.actionTitle}>Dashboard</Text>
            <Text style={styles.actionDesc}>View records & stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: UI_CONFIG.COLORS.textSecondary }]}
            onPress={() => navigation.navigate('Settings')}>
            <Icon name="cog" size={32} color={UI_CONFIG.COLORS.textSecondary} />
            <Text style={styles.actionTitle}>Settings</Text>
            <Text style={styles.actionDesc}>Configure thresholds</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Hackathon 7.0 • SiteID Construction Identity
        </Text>
        <Text style={styles.footerVersion}>v1.0.0 • Offline-First Architecture</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.background,
  },
  content: {
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.border,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: UI_CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: UI_CONFIG.COLORS.text,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 280,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.text,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  statusRow: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.lg,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statusLabel: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.text,
    fontWeight: '500',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: UI_CONFIG.COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.lg,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  actionDesc: {
    fontSize: 10,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.textSecondary,
    fontWeight: '600',
  },
  footerVersion: {
    fontSize: 10,
    color: UI_CONFIG.COLORS.disabled,
    marginTop: 2,
  },
});
