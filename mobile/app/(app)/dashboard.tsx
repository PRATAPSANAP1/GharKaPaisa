import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import PartnerDashboardScreen from './partner-dashboard';
import TeamDashboardScreen from './team-dashboard';
import EmployeeDashboardScreen from './employee-dashboard';

export default function DashboardScreen() {
  const { user, userRole, userDesignation, reloadUser } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reloadUser();
    setRefreshing(false);
  };

  // If PARTNER role, render full Partner Workspace
  if (userRole === 'PARTNER') {
    return <PartnerDashboardScreen />;
  }

  // If EMPLOYEE without operational designation, render Employee Personal Dashboard
  if (userRole === 'EMPLOYEE' && !userDesignation) {
    return <EmployeeDashboardScreen />;
  }

  // If TEAM_MEMBER without operational designation, render Team Workspace
  if (userRole === 'TEAM_MEMBER' && !userDesignation) {
    return <TeamDashboardScreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* User Greeting & Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.full_name || user?.email || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.full_name || user?.name || user?.email}</Text>
          <View style={styles.roleContainer}>
            <StatusBadge status={userRole} />
            {userDesignation ? <Text style={styles.designationText}> • {userDesignation}</Text> : null}
          </View>
        </View>
      </View>

      {/* Role-Specific Overview Banner */}
      <Card style={styles.bannerCard}>
        <Text style={styles.bannerTitle}>GharKaPaisa Operational Hub</Text>
        <Text style={styles.bannerText}>
          {userRole === 'EMPLOYEE' && `Department: ${user?.department || 'Operations'}`}
          {['ADMIN', 'SUPER_ADMIN'].includes(userRole as string) && 'System Administrative & Queue Manager'}
        </Text>
      </Card>

      {/* Designation-Based Queue Box */}
      {userDesignation ? (
        <Card style={styles.queueCard}>
          <Text style={styles.queueTitle}>Assigned Operational Queue</Text>
          <Text style={styles.queueDesc}>Active Workspace Queue: {userDesignation}</Text>
          <Button
            title="Open Operational Queue"
            onPress={() => router.push('/(app)/op-queue')}
            variant="outline"
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : null}

      {/* Action Quick Launch */}
      <Card>
        <Text style={styles.cardHeader}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {userDesignation ? (
            <Button
              title="Operational Queue Desk"
              onPress={() => router.push('/(app)/op-queue')}
              style={styles.actionBtn}
            />
          ) : null}
          <Button
            title="All Applications"
            onPress={() => router.push('/(app)/applications')}
            variant={userDesignation ? 'secondary' : 'primary'}
            style={styles.actionBtn}
          />
          <Button
            title="Leads & Customers"
            onPress={() => router.push('/(app)/leads')}
            variant="secondary"
            style={styles.actionBtn}
          />
          <Button
            title="Notifications"
            onPress={() => router.push('/(app)/notifications')}
            variant="secondary"
            style={styles.actionBtn}
          />
          <Button
            title="My Profile"
            onPress={() => router.push('/(app)/profile')}
            variant="outline"
            style={styles.actionBtn}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#FFF',
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  userName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  designationText: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
  },
  bannerCard: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primary,
  },
  bannerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#FFF',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: typography.sizes.xs,
    color: '#93C5FD',
  },
  cardHeader: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  queueCard: {
    borderColor: colors.warning,
  },
  queueTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.warning,
  },
  queueDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
    marginTop: 2,
  },
  actionGrid: {
    gap: spacing.xs,
  },
  actionBtn: {
    marginTop: spacing.xs,
  },
});
