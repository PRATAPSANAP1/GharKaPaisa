import React, { useState, useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Text, View, StyleSheet, AppState } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState } from '../../components/LoadingState';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getUnreadCount } from '../../services/messenger.service';
import { getMessengerSocket } from '../../services/messengerSocket';

const TabIcon = ({ label, focused, badgeCount }: { label: string; focused: boolean; badgeCount?: number }) => {
  const getSymbol = () => {
    switch (label) {
      case 'Dashboard': return '🏠';
      case 'Applications': return '📄';
      case 'Customers': return '👥';
      case 'Messenger': return '💬';
      case 'More': return '•••';
      default: return '📱';
    }
  };

  return (
    <View style={styles.tabItem}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{getSymbol()}</Text>
      {label === 'Messenger' && badgeCount !== undefined && badgeCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
    </View>
  );
};

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    let isMounted = true;
    let socketInstance: any = null;

    const fetchUnread = async () => {
      const count = await getUnreadCount();
      if (isMounted) {
        setUnreadCount(count);
      }
    };

    // Initial fetch
    fetchUnread();

    // Subscribe to Socket.IO real-time updates (no polling loop)
    const initSocketListener = async () => {
      const socket = await getMessengerSocket();
      if (!socket || !isMounted) return;
      socketInstance = socket;

      const handleRealtimeUpdate = () => {
        fetchUnread();
      };

      socket.on('message:new', handleRealtimeUpdate);
      socket.on('message:read', handleRealtimeUpdate);
      socket.on('conversation:update', handleRealtimeUpdate);
      socket.on('connect', handleRealtimeUpdate);

      const appStateSub = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          fetchUnread();
          if (!socket.connected) {
            socket.connect();
          }
        }
      });

      return () => {
        appStateSub.remove();
        socket.off('message:new', handleRealtimeUpdate);
        socket.off('message:read', handleRealtimeUpdate);
        socket.off('conversation:update', handleRealtimeUpdate);
        socket.off('connect', handleRealtimeUpdate);
      };
    };

    let cleanupFn: (() => void) | undefined;
    initSocketListener().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      isMounted = false;
      if (cleanupFn) cleanupFn();
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingState message="Loading authenticated workspace..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.bold,
        },
      }}
    >
      {/* 1. Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} />,
        }}
      />

      {/* 2. Applications */}
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ focused }) => <TabIcon label="Applications" focused={focused} />,
        }}
      />

      {/* 3. Customers */}
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ focused }) => <TabIcon label="Customers" focused={focused} />,
        }}
      />

      {/* 4. Messenger with Real Unread Badge */}
      <Tabs.Screen
        name="messenger"
        options={{
          title: 'Messenger',
          tabBarIcon: ({ focused }) => <TabIcon label="Messenger" focused={focused} badgeCount={unreadCount} />,
        }}
      />

      {/* 5. More (Priority List) */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => <TabIcon label="More" focused={focused} />,
        }}
      />

      {/* Hidden Auxiliary Screens */}
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="application-details" options={{ href: null }} />
      <Tabs.Screen name="leads" options={{ href: null }} />
      <Tabs.Screen name="lead-details" options={{ href: null }} />
      <Tabs.Screen name="customer-details" options={{ href: null }} />
      <Tabs.Screen name="op-queue" options={{ href: null }} />
      <Tabs.Screen name="partner-dashboard" options={{ href: null }} />
      <Tabs.Screen name="team-dashboard" options={{ href: null }} />
      <Tabs.Screen name="add-lead" options={{ href: null }} />
      <Tabs.Screen name="products" options={{ href: null }} />
      <Tabs.Screen name="team" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="finance-buddy" options={{ href: null }} />
      <Tabs.Screen name="whatsapp" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="security" options={{ href: null }} />
      <Tabs.Screen name="employee-team" options={{ href: null }} />
      <Tabs.Screen name="employee-referrals" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    fontSize: 18,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
