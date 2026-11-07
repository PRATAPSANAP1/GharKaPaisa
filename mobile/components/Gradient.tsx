import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

interface GradientProps {
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  children?: React.ReactNode;
}

export const Gradient: React.FC<GradientProps> = ({
  colors: gradientColors = colors.gradientPrimary,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  borderRadius = 0,
  children,
}) => {
  return (
    <View style={[{ borderRadius, overflow: 'hidden' }, style]}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="grad" x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
            {gradientColors.map((c, i) => (
              <Stop key={i} offset={gradientColors.length === 1 ? 0 : i / (gradientColors.length - 1)} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
      </Svg>
      {children}
    </View>
  );
};
