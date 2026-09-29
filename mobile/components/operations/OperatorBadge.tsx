import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OperatorBadgeProps {
  name?: string;
  code?: string;
  designation?: string;
  size?: 'small' | 'medium' | 'large';
}

const OperatorBadge: React.FC<OperatorBadgeProps> = ({
  name,
  code,
  designation,
  size = 'medium',
}) => {
  const sizeStyles = {
    small: {
      container: { paddingHorizontal: 8, paddingVertical: 4 },
      name: { fontSize: 11 },
      code: { fontSize: 10 },
    },
    medium: {
      container: { paddingHorizontal: 12, paddingVertical: 6 },
      name: { fontSize: 12 },
      code: { fontSize: 11 },
    },
    large: {
      container: { paddingHorizontal: 16, paddingVertical: 8 },
      name: { fontSize: 13 },
      code: { fontSize: 12 },
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.container]}>
      {name && (
        <Text style={[styles.name, currentSize.name]} numberOfLines={1}>
          {name}
        </Text>
      )}
      {code && (
        <Text style={[styles.code, currentSize.code]} numberOfLines={1}>
          {code}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  name: {
    color: '#166534',
    fontWeight: '600',
  },
  code: {
    color: '#15803D',
    marginTop: 2,
  },
});

export default OperatorBadge;
