import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { Icon } from '../../components/Icon';
import {
  fetchEmployeeProfile,
  fetchEmployeeIncentives,
  fetchEmployeeApplications,
  fetchEmployeeVerificationStatus,
  fetchEmployeeOnboardingStatus,
  EmployeeProfileData,
  EmployeeIncentivesResponse,
  EmployeeApplicationItem,
  VerificationStatus,
  OnboardingChecklist,
} from '../../services/employee.service';

export default function EmployeeDashboardScreen() {
  const { user, userRole, userDesignation, reloadUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<EmployeeProfileData | null>(null);
  const [incentiveData, setIncentiveData] = useState<EmployeeIncentivesResponse | null>(null);
  const [applications, setApplications] = useState<EmployeeApplicationItem[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [onboardingChecklist, setOnboardingChecklist] = useState<OnboardingChecklist | null>(null);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [profileRes, incentiveRes, appsRes, verRes, onboardRes] = await Promise.allSettled([
        fetchEmployeeProfile(),
        fetchEmployeeIncentives(),
        fetchEmployeeApplications(),
        fetchEmployeeVerificationStatus(),
        fetchEmployeeOnboardingStatus(),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfileData(profileRes.value);
      }
      if (incentiveRes.status === 'fulfilled') {
        setIncentiveData(incentiveRes.value);
      }
      if (appsRes.status === 'fulfilled') {
        setApplications(appsRes.value);
      }
      if (verRes.status === 'fulfilled') {
        setVerificationStatus(verRes.value);
      }
      if (onboardRes.status === 'fulfilled') {
        setOnboardingChecklist(onboardRes.value);
      }
    } catch (err) {
      console.error('[EmployeeDashboard] Load error:', err);
      setError('Failed to load performance metrics. Please tap retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await reloadUser();
    await loadDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const totalApps = profileData?.total_applications ?? 0;
  const approvedApps = profileData?.approved_applications ?? 0;
  const pendingApps = Math.max(0, totalApps - approvedApps);
  const leadsCount = profileData?.leads_count ?? 0;
  const approvalRate = totalApps > 0 ? ((approvedApps / totalApps) * 100).toFixed(1) : '0.0';

  const totalPaidIncentive = incentiveData?.stats?.total_paid ?? profileData?.incentives_summary?.paid_incentives ?? 0;
  const pendingIncentive = incentiveData?.stats?.pending_incentive ?? profileData?.incentives_summary?.pending_incentives ?? 0;
  const totalIncentives = profileData?.incentives_summary?.total_incentives ?? (totalPaidIncentive + pendingIncentive);

  // Check if employee needs onboarding
  const isVerified = verificationStatus?.overall_status === 'VERIFIED';
  const missingItems = verificationStatus?.missing_items || [];
  const isVideoRejected = verificationStatus?.video_status?.toUpperCase() === 'REJECTED' ||
                          missingItems.some(i => (i.type === 'video' || i.type === 'terms_video') && String(i.status || '').toUpperCase() === 'REJECTED');
  const needsOnboarding = !isVerified || isVideoRejected;

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Personal Performance Workspace...</Text>
      </View>
    );
  }

  // Show onboarding checklist if verification is incomplete
  if (needsOnboarding) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.full_name || user?.email || 'E')[0].toUpperCase()}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.full_name || user?.name || user?.email}</Text>
            <View style={styles.roleContainer}>
              <StatusBadge status={userRole || 'EMPLOYEE'} />
            </View>
          </View>
        </View>

        <Card style={styles.onboardingCard}>
          <Text style={styles.onboardingTitle}>⚠️ Complete Your Onboarding</Text>
          <Text style={styles.onboardingSubtitle}>
            Please complete the following steps to activate your employee account.
          </Text>

          <View style={styles.checklistContainer}>
            {missingItems.length > 0 ? (
              missingItems.map((item, index) => (
                <View key={index} style={styles.checklistItem}>
                  <Icon
                    name={String(item.status || '').toUpperCase() === 'COMPLETED' ? 'check-circle' : 'circle'}
                    size={20}
                    color={String(item.status || '').toUpperCase() === 'COMPLETED' ? colors.success : colors.textLight}
                  />
                  <Text style={styles.checklistText}>{item.description || item.type}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.checklistText}>No missing items. Verification in progress.</Text>
            )}
          </View>

          <Button
            title="Go to Profile"
            onPress={() => router.push('/(app)/profile')}
            style={styles.onboardingButton}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.full_name || user?.email || 'E')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.full_name || user?.name || user?.email}</Text>
          <View style={styles.roleContainer}>
            <StatusBadge status={userRole || 'EMPLOYEE'} />
            {profileData?.employee?.employee_id ? (
              <Text style={styles.designationText}> • ID: {profileData.employee.employee_id}</Text>
            ) : null}
            {userDesignation ? <Text style={styles.designationText}> • {userDesignation}</Text> : null}
          </View>
        </View>
      </View>

      {/* Error Alert with Retry */}
      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry Loading" onPress={loadDashboardData} variant="outline" style={{ marginTop: spacing.xs }} />
        </Card>
      ) : null}

      {/* Applications Performance Grid */}
      <Text style={styles.sectionTitle}>Application Metrics</Text>
      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, { borderLeftColor: colors.primary }]}>
          <Text style={styles.statLabel}>Total Submitted</Text>
          <Text style={styles.statValue}>{totalApps}</Text>
          <Text style={styles.statSub}>Applications logged</Text>
        </Card>

        <Card style={[styles.statCard, { borderLeftColor: colors.success }]}>
          <Text style={styles.statLabel}>Approved</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>{approvedApps}</Text>
          <Text style={styles.statSub}>Approved & Disbursed</Text>
        </Card>

        <Card style={[styles.statCard, { borderLeftColor: colors.warning }]}>
          <Text style={styles.statLabel}>Pending / Review</Text>
          <Text style={[styles.statValue, { color: colors.warning }]}>{pendingApps}</Text>
          <Text style={styles.statSub}>In processing queue</Text>
        </Card>

        <Card style={[styles.statCard, { borderLeftColor: colors.teal }]}>
          <Text style={styles.statLabel}>Leads Captured</Text>
          <Text style={[styles.statValue, { color: colors.teal }]}>{leadsCount}</Text>
          <Text style={styles.statSub}>Customer leads</Text>
        </Card>
      </View>

      {/* Performance Conversion Summary */}
      <Card style={styles.performanceCard}>
        <Text style={styles.cardHeader}>Conversion Performance</Text>
        <View style={styles.perfRow}>
          <View style={styles.perfItem}>
            <Text style={styles.perfValue}>{approvalRate}%</Text>
            <Text style={styles.perfLabel}>Approval Rate</Text>
          </View>
          <View style={styles.perfDivider} />
          <View style={styles.perfItem}>
            <Text style={styles.perfValue}>{approvedApps} / {totalApps}</Text>
            <Text style={styles.perfLabel}>Conversions</Text>
          </View>
        </View>
      </Card>

      {/* Incentives Summary Card */}
      <Text style={styles.sectionTitle}>Incentive Earnings</Text>
      <Card style={styles.incentiveCard}>
        <View style={styles.incentiveHeader}>
          <Text style={styles.incentiveTitle}>Employee Incentive Wallet</Text>
          <Text style={styles.incentiveTotal}>₹{totalIncentives.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.incentiveGrid}>
          <View style={styles.incBox}>
            <Text style={styles.incBoxLabel}>Paid / Released</Text>
            <Text style={[styles.incBoxValue, { color: colors.success }]}>₹{totalPaidIncentive.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.incBox}>
            <Text style={styles.incBoxLabel}>Pending Payout</Text>
            <Text style={[styles.incBoxValue, { color: colors.warning }]}>₹{pendingIncentive.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </Card>

      {/* Quick Launch Action Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <Card style={styles.actionCard}>
        <View style={styles.actionGrid}>
          <Button
            title="Add New Lead"
            onPress={() => router.push('/(app)/add-lead')}
            style={styles.actionBtn}
          />
          <Button
            title="My Applications"
            onPress={() => router.push('/(app)/applications')}
            variant="secondary"
            style={styles.actionBtn}
          />
          <Button
            title="My Team & Hierarchy"
            onPress={() => router.push('/(app)/employee-team')}
            variant="secondary"
            style={styles.actionBtn}
          />
          <Button
            title="My Referrals & Links"
            onPress={() => router.push('/(app)/employee-referrals')}
            variant="secondary"
            style={styles.actionBtn}
          />
          <Button
            title="Customers & Leads"
            onPress={() => router.push('/(app)/leads')}
            variant="secondary"
            style={styles.actionBtn}
          />
          <Button
            title="WhatsApp Business"
            onPress={() => router.push('/(app)/whatsapp')}
            variant="outline"
            style={styles.actionBtn}
          />
          <Button
            title="Finance Buddy"
            onPress={() => router.push('/(app)/finance-buddy')}
            variant="outline"
            style={styles.actionBtn}
          />
          <Button
            title="Notifications"
            onPress={() => router.push('/(app)/notifications')}
            variant="outline"
            style={styles.actionBtn}
          />
        </View>
      </Card>

      {/* Recent Submissions List */}
      <Text style={styles.sectionTitle}>Recent Application Submissions</Text>
      {applications.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No applications submitted yet.</Text>
          <Button
            title="Punch First Application"
            onPress={() => router.push('/(app)/add-lead')}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : (
        applications.slice(0, 5).map((app) => (
          <TouchableOpacity
            key={app.id}
            onPress={() => router.push(`/(app)/application-details?id=${app.id}` as any)}
            activeOpacity={0.7}
          >
            <Card style={styles.appItemCard}>
              <View style={styles.appHeader}>
                <Text style={styles.appNumber}>{app.app_number}</Text>
                <StatusBadge status={app.status} />
              </View>
              <Text style={styles.appCustomer}>{app.customer_name} ({app.customer_mobile})</Text>
              <Text style={styles.appProduct}>{app.product_name} {app.bank_name ? `• ${app.bank_name}` : ''}</Text>
            </Card>
          </TouchableOpacity>
        ))
      )}
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
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textMid,
    fontSize: typography.sizes.sm,
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
    flexWrap: 'wrap',
  },
  designationText: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
  },
  errorCard: {
    borderColor: colors.danger,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    borderLeftWidth: 4,
    padding: spacing.sm,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginVertical: 2,
  },
  statSub: {
    fontSize: typography.sizes.xs - 2,
    color: colors.textMid,
  },
  performanceCard: {
    marginTop: spacing.xs,
  },
  cardHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xs,
  },
  perfItem: {
    alignItems: 'center',
  },
  perfValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  perfLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  perfDivider: {
    width: 1,
    height: 35,
    backgroundColor: colors.border,
  },
  incentiveCard: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
  },
  incentiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  incentiveTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  incentiveTotal: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  incentiveGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  incBox: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  incBoxLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
  },
  incBoxValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  actionCard: {
    marginTop: spacing.xs,
  },
  actionGrid: {
    gap: spacing.xs,
  },
  actionBtn: {
    marginTop: spacing.xs,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.md,
  },
  emptyText: {
    color: colors.textMid,
    fontSize: typography.sizes.xs,
  },
  appItemCard: {
    marginBottom: spacing.xs,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appNumber: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  appCustomer: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  appProduct: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
    marginTop: 2,
  },
  onboardingCard: {
    alignItems: 'center',
    padding: spacing.lg,
    borderColor: colors.warning,
    borderWidth: 2,
  },
  onboardingTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  onboardingSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  checklistContainer: {
    width: '100%',
    marginTop: spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  checklistText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  onboardingButton: {
    marginTop: spacing.md,
  },
});
