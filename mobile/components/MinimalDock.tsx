import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../theme/spacing';

export interface DockItem {
  id?: string;
  label: string;
  icon?: string;
  active?: boolean;
  badgeCount?: number;
  onPress: () => void;
}

interface MinimalDockProps {
  items: DockItem[];
}

// iOS SF-Symbols style bespoke vector icons
const HomeGlyph: React.FC<{ size?: number; color: string; focused?: boolean }> = ({ size = 20, color, focused }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.7L12 3L21 9.7V20C21 20.5523 20.5523 21 20 21H15C14.4477 21 14 20.5523 14 20V15C14 14.4477 13.5523 14 13 14H11C10.4477 14 10 14.4477 10 15V20C10 20.5523 9.55228 21 9 21H4C3.44772 21 3 20.5523 3 20V9.7Z"
      stroke={color}
      strokeWidth={focused ? "2.2" : "1.8"}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? `${color}20` : "none"}
    />
  </Svg>
);

const CardsGlyph: React.FC<{ size?: number; color: string; focused?: boolean }> = ({ size = 20, color, focused }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="2.5"
      y="5.5"
      width="19"
      height="13"
      rx="3"
      stroke={color}
      strokeWidth={focused ? "2.2" : "1.8"}
      fill={focused ? `${color}20` : "none"}
    />
    <Line x1="2.5" y1="10" x2="21.5" y2="10" stroke={color} strokeWidth={focused ? "2.2" : "1.8"} />
    <Line x1="6" y1="14.5" x2="9.5" y2="14.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const CustomersGlyph: React.FC<{ size?: number; color: string; focused?: boolean }> = ({ size = 20, color, focused }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 20V18.5C16 16.8431 14.6569 15.5 13 15.5H7C5.34315 15.5 4 16.8431 4 18.5V20"
      stroke={color}
      strokeWidth={focused ? "2.2" : "1.8"}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="10"
      cy="8"
      r="4"
      stroke={color}
      strokeWidth={focused ? "2.2" : "1.8"}
      fill={focused ? `${color}20` : "none"}
    />
    <Path
      d="M19 20V18.7C19 17.5 18.3 16.4 17.2 15.8"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <Path
      d="M15.5 4.3C16.8 5 17.5 6.3 17.5 7.8C17.5 9.3 16.8 10.6 15.5 11.3"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </Svg>
);

const ChatGlyph: React.FC<{ size?: number; color: string; focused?: boolean }> = ({ size = 20, color, focused }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5C21 15.6421 17.1944 19 12.5 19C11.1 19 9.78 18.7 8.6 18.15L3.5 19.5L4.9 15.2C4.33 14.1 4 12.84 4 11.5C4 7.35786 7.80558 4 12.5 4C17.1944 4 21 7.35786 21 11.5Z"
      stroke={color}
      strokeWidth={focused ? "2.2" : "1.8"}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? `${color}20` : "none"}
    />
  </Svg>
);

const MoreGlyph: React.FC<{ size?: number; color: string; focused?: boolean }> = ({ size = 20, color, focused }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="5" cy="12" r={focused ? 2.2 : 1.9} fill={color} />
    <Circle cx="12" cy="12" r={focused ? 2.2 : 1.9} fill={color} />
    <Circle cx="19" cy="12" r={focused ? 2.2 : 1.9} fill={color} />
  </Svg>
);

const renderGlyph = (item: DockItem, color: string, focused: boolean) => {
  const key = (item.id || item.label || '').toLowerCase();
  if (key.includes('home') || key.includes('dash')) {
    return <HomeGlyph color={color} focused={focused} />;
  }
  if (key.includes('card') || key.includes('app')) {
    return <CardsGlyph color={color} focused={focused} />;
  }
  if (key.includes('cust') || key.includes('lead') || key.includes('team')) {
    return <CustomersGlyph color={color} focused={focused} />;
  }
  if (key.includes('chat') || key.includes('mess')) {
    return <ChatGlyph color={color} focused={focused} />;
  }
  if (key.includes('more') || key.includes('menu')) {
    return <MoreGlyph color={color} focused={focused} />;
  }

  // Fallback to text icon / emoji if passed
  return (
    <Text style={[styles.fallbackIcon, { color }]}>
      {item.icon || '•'}
    </Text>
  );
};

export const MinimalDock: React.FC<MinimalDockProps> = ({ items }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const activeColor = isDark ? '#2DD4BF' : '#0D5CAB';
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.42)';

  // Calculate bottom offset for iPhone home indicator or Android navigation bar
  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 10);

  return (
    <View pointerEvents="box-none" style={styles.outerContainer}>
      <View
        style={[
          styles.dockPill,
          {
            bottom: bottomOffset,
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            shadowColor: isDark ? '#000000' : '#07152B',
            shadowOpacity: isDark ? 0.45 : 0.12,
          }
        ]}
      >
        {/* Subtle iOS specular rim highlight */}
        <View
          style={[
            styles.specularLine,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.90)',
            }
          ]}
        />

        <View style={styles.itemsRow}>
          {items.map((item, index) => {
            const focused = !!item.active;
            const itemColor = focused ? activeColor : inactiveColor;

            return (
              <TouchableOpacity
                key={item.id || index}
                style={styles.dockItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                {/* Active Capsule Glow */}
                <View
                  style={[
                    styles.iconCapsule,
                    focused && {
                      backgroundColor: isDark ? 'rgba(45, 212, 191, 0.14)' : 'rgba(13, 92, 171, 0.10)',
                    }
                  ]}
                >
                  {renderGlyph(item, itemColor, focused)}

                  {/* Real-time unread badge */}
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <View
                      style={[
                        styles.badge,
                        {
                          borderColor: isDark ? '#0F172A' : '#FFFFFF',
                        }
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {item.badgeCount > 99 ? '99+' : item.badgeCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Minimal Luxury Label */}
                <Text
                  style={[
                    styles.label,
                    {
                      color: itemColor,
                      fontWeight: focused ? '700' : '500',
                    }
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>

                {/* Micro Indicator Dot */}
                <View
                  style={[
                    styles.indicatorDot,
                    {
                      backgroundColor: focused ? activeColor : 'transparent',
                    }
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  dockPill: {
    position: 'absolute',
    width: '92%',
    maxWidth: 420,
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 14,
  },
  specularLine: {
    height: 1,
    width: '100%',
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconCapsule: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fallbackIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#FF3B30', // Apple system red
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  label: {
    fontSize: 10,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
