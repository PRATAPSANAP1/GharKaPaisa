import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { BRAND } from '../theme/colors';

// Lucide-style Sun SVG icon
const SunIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="2" x2="12" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="20" x2="12" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="4.93" y1="4.93" x2="6.34" y2="6.34" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="17.66" y1="17.66" x2="19.07" y2="19.07" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="2" y1="12" x2="4" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="20" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="4.93" y1="19.07" x2="6.34" y2="17.66" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="17.66" y1="6.34" x2="19.07" y2="4.93" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Lucide-style Moon SVG icon
const MoonIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#A8B7CA' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

interface ThemeToggleProps {
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ style, size = 'md' }) => {
  const { isDark, toggleTheme } = useTheme();

  // Animation for the thumb slide (0 for light, 1 for dark)
  const animValue = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();
  }, [isDark, animValue]);

  const isSmall = size === 'sm';
  const width = isSmall ? 56 : 68;
  const height = isSmall ? 28 : 32;
  const thumbSize = isSmall ? 22 : 24;
  const maxSlide = width - thumbSize - 8;

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxSlide],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleTheme}
      accessibilityRole="switch"
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius: height / 2,
          backgroundColor: isDark ? '#233D5B' : '#E2E8F0',
          borderColor: isDark ? '#34465D' : '#CBD5E1',
        },
        style,
      ]}
    >
      {/* Background Icons */}
      <View style={[styles.iconSlot, { left: 6 }]}>
        <SunIcon size={isSmall ? 13 : 15} color={isDark ? '#64748B' : '#1B74BB'} />
      </View>
      <View style={[styles.iconSlot, { right: 6 }]}>
        <MoonIcon size={isSmall ? 13 : 15} color={isDark ? '#9CD83D' : '#94A3B8'} />
      </View>

      {/* Sliding Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: isDark ? '#19283C' : '#FFFFFF',
            transform: [{ translateX }],
          },
        ]}
      >
        {isDark ? (
          <MoonIcon size={isSmall ? 12 : 14} color={BRAND.brandGreen} />
        ) : (
          <SunIcon size={isSmall ? 12 : 14} color={BRAND.primaryBlue} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default ThemeToggle;

const styles = StyleSheet.create({
  container: {
    padding: 3,
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  iconSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumb: {
    position: 'absolute',
    left: 3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

