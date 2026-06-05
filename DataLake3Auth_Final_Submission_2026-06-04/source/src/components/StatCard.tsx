import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './SafeIcon';
import { UI_CONFIG } from '../constants';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color = UI_CONFIG.COLORS.primary,
  subtitle,
}: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.lg,
    padding: UI_CONFIG.SPACING.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: UI_CONFIG.COLORS.text,
  },
  title: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 1,
  },
});
