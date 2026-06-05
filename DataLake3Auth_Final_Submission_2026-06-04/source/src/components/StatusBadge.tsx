import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UI_CONFIG } from '../constants';

interface StatusBadgeProps {
  status: 'ready' | 'loading' | 'error' | 'not_loaded' | 'synced' | 'pending';
  label?: string;
  size?: 'small' | 'medium';
}

const STATUS_COLORS: Record<string, string> = {
  ready: UI_CONFIG.COLORS.success,
  loading: UI_CONFIG.COLORS.warning,
  error: UI_CONFIG.COLORS.error,
  not_loaded: UI_CONFIG.COLORS.disabled,
  synced: UI_CONFIG.COLORS.success,
  pending: UI_CONFIG.COLORS.accent,
};

const STATUS_LABELS: Record<string, string> = {
  ready: 'Ready',
  loading: 'Loading...',
  error: 'Error',
  not_loaded: 'Not Loaded',
  synced: 'Synced',
  pending: 'Pending',
};

export default function StatusBadge({ status, label, size = 'medium' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || UI_CONFIG.COLORS.disabled;
  const text = label || STATUS_LABELS[status] || status;
  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }, isSmall && styles.badgeSmall]}>
      <View style={[styles.dot, { backgroundColor: color }, isSmall && styles.dotSmall]} />
      <Text style={[styles.text, { color }, isSmall && styles.textSmall]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 10,
  },
});
