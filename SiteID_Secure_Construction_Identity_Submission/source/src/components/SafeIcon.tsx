import React from 'react';
import { Text } from 'react-native';

const ICON_MAP: Record<string, string> = {
  'shield-lock': '🛡️',
  'shield-check': '🛡️',
  'shield-alert': '⚠️',
  'account-plus': '👤',
  'account-group': '👥',
  'account-check': '✅',
  'account-off': '🚫',
  'face-recognition': '🔍',
  'view-dashboard': '📊',
  'camera': '📷',
  'camera-iris': '📸',
  'cog': '⚙️',
  'check-circle': '✅',
  'close-circle': '❌',
  'help-circle': '❓',
  'alert-circle': '⚠️',
  'alert': '⚠️',
  'arrow-right': '→',
  'arrow-left': '←',
  'chevron-right': '›',
  'refresh': '🔄',
  'sync': '🔄',
  'cloud-sync': '☁️',
  'cloud-upload': '☁️',
  'database': '💾',
  'delete': '🗑️',
  'delete-outline': '🗑️',
  'delete-sweep': '🗑️',
  'calendar-check': '📅',
  'calendar-today': '📅',
  'calendar-week': '📅',
  'chart-box': '📈',
  'clipboard-list': '📋',
  'clipboard-text-off': '📋',
  'chip': '🔧',
  'speedometer': '⚡',
  'tune': '🔧',
  'information': 'ℹ️',
  'circle-outline': '○',
};

interface SafeIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export default function SafeIcon({ name, size = 20, color }: SafeIconProps) {
  const emoji = ICON_MAP[name] || '•';
  return (
    <Text style={{ fontSize: Math.max(size * 0.65, 12), color, textAlign: 'center' }}>
      {emoji}
    </Text>
  );
}
