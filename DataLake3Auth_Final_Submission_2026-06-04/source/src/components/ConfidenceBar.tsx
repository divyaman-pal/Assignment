import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UI_CONFIG } from '../constants';

interface ConfidenceBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  height?: number;
}

function getColor(value: number): string {
  if (value >= 0.8) return UI_CONFIG.COLORS.success;
  if (value >= 0.6) return UI_CONFIG.COLORS.warning;
  return UI_CONFIG.COLORS.error;
}

export default function ConfidenceBar({
  value,
  label,
  showPercentage = true,
  height = 6,
}: ConfidenceBarProps) {
  const color = getColor(value);
  const percentage = Math.round(value * 100);
  const width = `${Math.min(percentage, 100)}%` as any;

  return (
    <View style={styles.container}>
      {(label || showPercentage) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && (
            <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width, backgroundColor: color, height }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.textSecondary,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    width: '100%',
    backgroundColor: UI_CONFIG.COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 3,
  },
});
