import React from 'react';
import { Text, TextStyle } from 'react-native';

export type IconName =
  | 'check-circle'
  | 'alert-circle'
  | 'credit-card'
  | 'chevron-right'
  | 'user-plus'
  | 'user-check'
  | 'user'
  | 'award'
  | 'copy'
  | 'link-2'
  | 'users'
  | 'list'
  | 'file-text'
  | 'grid'
  | 'arrow-left'
  | 'check'
  | 'shield'
  | 'share-2'
  | 'inbox'
  | 'download'
  | 'clock'
  | 'arrow-down-left'
  | 'arrow-up-right'
  | 'device'
  | 'x';

interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: TextStyle;
}

export const Icon: React.FC<IconProps> = ({ name, size = 16, color = '#000', style }) => {
  const getSymbol = (): string => {
    switch (name) {
      case 'check-circle': return '✓';
      case 'alert-circle': return '⚠️';
      case 'credit-card': return '💳';
      case 'chevron-right': return '›';
      case 'user-plus': return '👤+';
      case 'user-check': return '👤✓';
      case 'user': return '👤';
      case 'award': return '🎗️';
      case 'copy': return '📋';
      case 'link-2': return '🔗';
      case 'users': return '👥';
      case 'list': return '📋';
      case 'file-text': return '📄';
      case 'grid': return '▦';
      case 'arrow-left': return '←';
      case 'check': return '✓';
      case 'shield': return '🛡️';
      case 'share-2': return '🔗';
      case 'inbox': return '📥';
      case 'download': return '⬇️';
      case 'clock': return '🕒';
      case 'arrow-down-left': return '↙';
      case 'arrow-up-right': return '↗';
      case 'device': return '📱';
      case 'x': return '✕';
      case 'lock': return '🔒';
      case 'calendar': return '📅';
      case 'camera': return '📷';
      case 'x-circle': return '❌';
      default: return '•';
    }
  };

  return (
    <Text style={[{ fontSize: size, color, fontWeight: '700' }, style]}>
      {getSymbol()}
    </Text>
  );
};
