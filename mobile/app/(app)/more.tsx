import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  badge?: string;
  roles?: string[];
}

export default function MoreScreen() {
  const { userRole, userDesignation, logout } = useAuth();

  const coreOperations: MenuItem[] = [
    {
      id: 'op-queue',
      title: 'Operational Queue Desk',
      subtitle: 'Review & process assigned applications queue',
      icon: '💼',
      route: '/(app)/op-queue'
    },
    {
      id: 'leads',
      title: 'Leads & CRM',
      subtitle: 'Manage card, loan, & insurance direct leads',
      icon: '📈',
      route: '/(app)/leads'
    },
    {
      id: 'team',
      title: 'Team & Staff',
      subtitle: 'Overview of team members & active assignments',
      icon: '👥',
      route: '/(app)/team'
    }
  ];

  const financialEarnings: MenuItem[] = [
    {
      id: 'products',
      title: 'Products Portfolio',
      subtitle: 'Explore credit cards, loans, insurance & bank products',
      icon: '💳',
      route: '/(app)/products'
    },
    {
      id: 'wallet',
      title: 'Wallet & Payouts',
      subtitle: 'View earnings balance, commissions, & settlement history',
      icon: '💰',
      route: '/(app)/wallet'
    },
    {
      id: 'incentives',
      title: 'Incentives & Rewards',
      subtitle: 'Personal performance target & incentive tracker',
      icon: '🎁',
      route: '/(app)/finance-buddy'
    },
    {
      id: 'reports',
      title: 'Operational Reports',
      subtitle: 'Analytical summaries & daily performance breakdown',
      icon: '📊',
      route: '/(app)/reports'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Business',
      subtitle: 'Dispatch official reports & user updates via WhatsApp',
      icon: '💬',
      route: '/(app)/whatsapp'
    }
  ];

  const accountSupport: MenuItem[] = [
    {
      id: 'support',
      title: 'Support Tickets',
      subtitle: 'Connect to support desk & manage open tickets',
      icon: '🎧',
      route: '/(app)/support'
    },
    {
      id: 'settings',
      title: 'App Settings',
      subtitle: 'Customize notification preferences & theme',
      icon: '⚙️',
      route: '/(app)/settings'
    },
    {
      id: 'profile',
      title: 'User Profile',
      subtitle: 'View personal details & designation info',
      icon: '👤',
      route: '/(app)/profile'
    },
    {
      id: 'security',
      title: 'Security & Password',
      subtitle: 'Manage password, PIN & account security',
      icon: '🔒',
      route: '/(app)/security'
    }
  ];

  const renderSection = (title: string, items: MenuItem[]) => (
    <View style={styles.sectionContainer} key={title}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.cardGroup}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuRow, idx === items.length - 1 && styles.noBorder]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>{item.icon}</Text>
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Screen Title Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workspace Features</Text>
          <Text style={styles.headerSubtitle}>
            Priority-ordered menu ({userRole || 'User'} {userDesignation ? `• ${userDesignation}` : ''})
          </Text>
        </View>

        {/* Priority 1: Core Operations */}
        {renderSection('Priority 1: Core Operations', coreOperations)}

        {/* Priority 2: Financials & Products */}
        {renderSection('Priority 2: Financials & Earnings', financialEarnings)}

        {/* Priority 3: Account & Support */}
        {renderSection('Priority 3: Support & Settings', accountSupport)}

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  header: {
    marginBottom: spacing.md
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2
  },
  sectionContainer: {
    marginBottom: spacing.md
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4
  },
  cardGroup: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  noBorder: {
    borderBottomWidth: 0
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  iconText: {
    fontSize: 18
  },
  menuInfo: {
    flex: 1
  },
  menuTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  menuSubtitle: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2
  },
  chevron: {
    fontSize: 20,
    color: colors.textLight,
    marginLeft: spacing.sm
  },
  logoutBtn: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center'
  },
  logoutText: {
    color: colors.error,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm
  }
});
