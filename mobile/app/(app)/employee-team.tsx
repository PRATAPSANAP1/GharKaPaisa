import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../../components/Icon';
import {
  fetchEmployeeProfile,
  fetchEmployeeTeam,
  EmployeeProfileData,
  EmployeeTeamMember,
} from '../../services/employee.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function EmployeeTeamScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<EmployeeProfileData | null>(null);
  const [teamMembers, setTeamMembers] = useState<EmployeeTeamMember[]>([]);
  const [userDesignation, setUserDesignation] = useState<string>('');

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [profileRes, teamRes] = await Promise.all([
        fetchEmployeeProfile(),
        fetchEmployeeTeam(),
      ]);

      if (profileRes) {
        setProfileData(profileRes);
      }

      if (teamRes) {
        setTeamMembers(teamRes.team || []);
        setUserDesignation(teamRes.designation || profileRes?.employee?.designation || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load team and hierarchy data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Team & Hierarchy...</Text>
      </View>
    );
  }

  const emp: any = profileData?.employee || user || {};
  const hierarchyInfo = (profileData as any)?.hierarchy || {};
  const managerName = hierarchyInfo.manager_name || emp.reporting_manager || null;
  const teamLeaderName = hierarchyInfo.team_leader_name || null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerSubtitle}>ORGANIZATION & HIERARCHY</Text>
          <Text style={styles.headerTitle}>My Team Desk</Text>
          <Text style={styles.designationText}>
            Designation: {userDesignation || emp.designation || 'Employee'}
          </Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Icon name="alert-circle" size={18} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Reporting Hierarchy Section */}
      <Text style={styles.sectionTitle}>Reporting Manager</Text>
      <View style={styles.managerCard}>
        <View style={styles.managerAvatar}>
          <Icon name="user-check" size={24} color="#0F766E" />
        </View>
        <View style={styles.managerInfo}>
          <Text style={styles.managerName}>{managerName || teamLeaderName || 'Direct Manager Assigned'}</Text>
          <Text style={styles.managerRole}>
            {managerName ? 'Reporting Manager' : teamLeaderName ? 'Team Leader' : 'Organization Leader'}
          </Text>
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>ACTIVE</Text>
        </View>
      </View>

      {/* Hierarchy Tree View */}
      <Text style={styles.sectionTitle}>Hierarchy Tree</Text>
      <View style={styles.treeCard}>
        {managerName ? (
          <View style={styles.treeNode}>
            <View style={styles.treeBadgeManager}>
              <Icon name="award" size={14} color="#0369A1" />
              <Text style={styles.treeTextManager}>{managerName} (Manager)</Text>
            </View>
            <View style={styles.treeConnector} />
          </View>
        ) : null}

        {teamLeaderName ? (
          <View style={styles.treeNode}>
            <View style={styles.treeBadgeTL}>
              <Icon name="users" size={14} color="#6D28D9" />
              <Text style={styles.treeTextTL}>{teamLeaderName} (Team Leader)</Text>
            </View>
            <View style={styles.treeConnector} />
          </View>
        ) : null}

        <View style={styles.treeNode}>
          <View style={styles.treeBadgeSelf}>
            <Icon name="user" size={14} color="#0F766E" />
            <Text style={styles.treeTextSelf}>{emp.full_name || 'You'} (You)</Text>
          </View>
        </View>

        {teamMembers.length > 0 ? (
          <View style={styles.downlineBranch}>
            <View style={styles.treeConnector} />
            <Text style={styles.downlineLabel}>{teamMembers.length} Direct Report(s)</Text>
          </View>
        ) : null}
      </View>

      {/* Direct Team Members Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Team Members ({teamMembers.length})</Text>
      </View>

      {teamMembers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="users" size={36} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Direct Reports Assigned</Text>
          <Text style={styles.emptyDesc}>
            You currently have no team members assigned directly under your designation code ({emp.employee_id || 'EMP'}).
          </Text>
        </View>
      ) : (
        teamMembers.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberAvatar}>
              <Text style={styles.avatarText}>{member.full_name?.[0]?.toUpperCase() || 'E'}</Text>
            </View>

            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>{member.full_name}</Text>
              <Text style={styles.memberCode}>ID: {member.employee_id || 'N/A'}</Text>
              <Text style={styles.memberRole}>{member.designation || 'Team Member'}</Text>
            </View>

            <View style={styles.statusCol}>
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>ACTIVE</Text>
              </View>
              {member.mobile_number ? (
                <Text style={styles.mobileText}>{member.mobile_number.slice(-4).padStart(10, '*')}</Text>
              ) : null}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: '#64748B',
  },
  headerCard: {
    backgroundColor: '#0F766E',
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#99F6E4',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  designationText: {
    fontSize: 12,
    color: '#CCFBF1',
    marginTop: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  managerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  managerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  managerRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  treeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  treeNode: {
    alignItems: 'flex-start',
  },
  treeBadgeManager: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  treeTextManager: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  treeBadgeTL: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  treeTextTL: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6D28D9',
  },
  treeBadgeSelf: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  treeTextSelf: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  treeConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#CBD5E1',
    marginLeft: 18,
    marginVertical: 2,
  },
  downlineBranch: {
    marginTop: 4,
  },
  downlineLabel: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 28,
    fontStyle: 'italic',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: spacing.sm,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberCode: {
    fontSize: 11,
    color: '#64748B',
  },
  memberRole: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  memberBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  mobileText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
});
