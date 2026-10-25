import React from 'react';
import { Text, TextStyle } from 'react-native';

export type IconName =
  | 'check-circle'
  | 'alert-circle'
  | 'credit-card'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'chevron-up'
  | 'user-plus'
  | 'user-check'
  | 'user'
  | 'user-shield'
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
  | 'x'
  | 'circle'
  | 'lock'
  | 'calendar'
  | 'bell'
  | 'activity'
  | 'dollar-sign'
  | 'briefcase'
  | 'settings'
  | 'message-square'
  | 'merge'
  | 'plus'
  | 'git-branch'
  | 'edit-2'
  | 'id-card'
  | 'university'
  | 'eye'
  | 'search'
  | 'info'
  | 'file-upload'
  | 'user-times'
  | 'unlink'
  | 'chart-line'
  | 'trophy'
  | 'ellipsis-v'
  | 'redo'
  | 'ellipsis-h'
  | 'key'
  | 'ellipsis'
  | 'bolt'
  | 'trash'
  | 'exclamation-circle'
  | 'calendar-alt'
  | 'file-alt'
  | 'video'
  | 'building'
  | 'phone'
  | 'envelope'
  | 'user-circle'
  | 'cog'
  | 'camera';

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
      case 'chevron-left': return '‹';
      case 'chevron-down': return '⌄';
      case 'chevron-up': return '⌃';
      case 'user-plus': return '👤+';
      case 'user-check': return '👤✓';
      case 'user': return '👤';
      case 'user-shield': return '👤🛡️';
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
      case 'circle': return '○';
      case 'lock': return '�';
      case 'calendar': return '�';
      case 'camera': return '📷';
      case 'x-circle': return '❌';
      case 'shield-check': return '🛡️✓';
      case 'bell': return '🔔';
      case 'activity': return '⚡';
      case 'dollar-sign': return '💵';
      case 'briefcase': return '💼';
      case 'settings': return '⚙️';
      case 'message-square': return '💬';
      case 'merge': return '🔀';
      case 'plus': return '+';
      case 'git-branch': return '🌳';
      case 'edit-2': return '✏️';
      case 'id-card': return '🪪';
      case 'university': return '🏛️';
      case 'eye': return '👁️';
      case 'search': return '🔍';
      case 'info': return 'ℹ️';
      case 'file-upload': return '📤';
      case 'user-times': return '👤✕';
      case 'unlink': return '🔗✕';
      case 'chart-line': return '📈';
      case 'trophy': return '🏆';
      case 'ellipsis-v': return '⋮';
      case 'redo': return '↻';
      case 'ellipsis-h': return '⋯';
      case 'key': return '🔑';
      case 'ellipsis': return '…';
      case 'bolt': return '⚡';
      case 'trash': return '🗑️';
      case 'exclamation-circle': return '⚠️';
      case 'calendar-alt': return '📅';
      case 'file-alt': return '📄';
      case 'video': return '🎥';
      case 'building': return '🏢';
      case 'phone': return '📞';
      case 'envelope': return '✉️';
      case 'user-circle': return '👤';
      case 'cog': return '⚙️';
      default: return '•';
    }
  };

  return (
    <Text style={[{ fontSize: size, color, fontWeight: '700' }, style]}>
      {getSymbol()}
    </Text>
  );
};
