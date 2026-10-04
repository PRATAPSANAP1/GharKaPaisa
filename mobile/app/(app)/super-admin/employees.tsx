import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Card } from '../../../components/Card';
import { Icon } from '../../../components/Icon';
import { Button } from '../../../components/Button';
import {
  fetchEmployeesList,
  fetchEmployeeStats,
  activateEmployee,
  fetchCandidatesList,
  convertCandidateToEmployee,
  rejectCandidate,
} from '../../../services/super-admin.service';

export default function SuperAdminEmployeesScreen() {
  const [activeTab, setActiveTab] = useState<'employees' | 'candidates'>('employees');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('ALL');

  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);

  // Convert Modal State
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [offeredDesignation, setOfferedDesignation] = useState('TC');
  const [offeredSalary, setOfferedSalary] = useState('18000');
  const [converting, setConverting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, empRes, candRes] = await Promise.all([
        fetchEmployeeStats().catch(() => null),
        fetchEmployeesList({
          search: searchQuery || undefined,
          designation: selectedDesignation !== 'ALL' ? selectedDesignation : undefined,
        }).catch(() => ({ data: [] })),
        fetchCandidatesList({
          search: searchQuery || undefined,
        }).catch(() => ({ data: [] })),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (empRes?.data) setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      if (candRes?.data) setCandidates(Array.isArray(candRes.data) ? candRes.data : []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load employees data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedDesignation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleActivate = async (id: string, name: string) => {
    Alert.alert(
      'Activate Employee',
      `Are you sure you want to approve and activate ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'default',
          onPress: async () => {
            try {
              await activateEmployee(id);
              Alert.alert('Success', 'Employee has been activated successfully');
              loadData();
            } catch (err: any) {
              Alert.alert('Failed', err.message || 'Failed to activate employee');
            }
          },
        },
      ]
    );
  };

  const handleConvertCandidate = async () => {
    if (!selectedCandidate) return;
    try {
      setConverting(true);
      await convertCandidateToEmployee(selectedCandidate.id, {
        offered_designation: offeredDesignation,
        offered_salary: Number(offeredSalary) || 20000,
        offered_department: 'Sales & Distribution',
        designation: offeredDesignation,
        offeredSalary: Number(offeredSalary) || 20000,
      });
      setConvertModalVisible(false);
      Alert.alert('Candidate Converted', `${selectedCandidate.full_name} is now converted to an Employee.`);
      loadData();
    } catch (err: any) {
      Alert.alert('Conversion Failed', err.message || 'Could not convert candidate');
    } finally {
      setConverting(false);
    }
  };

  const handleRejectCandidate = (id: string, name: string) => {
    Alert.prompt
      ? Alert.prompt(
          'Reject Candidate',
          `Enter rejection reason for ${name}:`,
          async (reason) => {
            if (!reason) return;
            try {
              await rejectCandidate(id, reason);
              Alert.alert('Success', 'Candidate rejected');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reject candidate');
            }
          }
        )
      : Alert.alert(
          'Reject Candidate',
          `Reject ${name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reject',
              style: 'destructive',
              onPress: async () => {
                try {
                  await rejectCandidate(id, 'Qualifications did not match profile');
                  Alert.alert('Success', 'Candidate rejected');
                  loadData();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to reject candidate');
                }
              },
            },
          ]
        );
  };

  const designations = ['ALL', 'Branch Head', 'Senior Manager', 'Manager', 'Team Leader', 'TC'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>SUPER ADMIN</Text>
          <Text style={styles.headerTitle}>Staff & Talent Pipeline</Text>
        </View>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNumber}>{stats?.total_employees || employees.length}</Text>
          <Text style={styles.kpiLabel}>Total Staff</Text>
        </View>
        <View style={[styles.kpiCard, { borderColor: '#10B981' }]}>
          <Text style={[styles.kpiNumber, { color: '#10B981' }]}>
            {stats?.active_employees || 0}
          </Text>
          <Text style={styles.kpiLabel}>Active</Text>
        </View>
        <View style={[styles.kpiCard, { borderColor: '#F59E0B' }]}>
          <Text style={[styles.kpiNumber, { color: '#F59E0B' }]}>
            {stats?.onboarding_employees || 0}
          </Text>
          <Text style={styles.kpiLabel}>Onboarding</Text>
        </View>
        <View style={[styles.kpiCard, { borderColor: '#3B82F6' }]}>
          <Text style={[styles.kpiNumber, { color: '#3B82F6' }]}>{candidates.length}</Text>
          <Text style={styles.kpiLabel}>Candidates</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'employees' && styles.activeTabBtn]}
          onPress={() => setActiveTab('employees')}
        >
          <Icon
            name="users"
            size={16}
            color={activeTab === 'employees' ? colors.primary : colors.textLight}
          />
          <Text style={[styles.tabText, activeTab === 'employees' && styles.activeTabText]}>
            Employees ({employees.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'candidates' && styles.activeTabBtn]}
          onPress={() => setActiveTab('candidates')}
        >
          <Icon
            name="file-text"
            size={16}
            color={activeTab === 'candidates' ? colors.primary : colors.textLight}
          />
          <Text style={[styles.tabText, activeTab === 'candidates' && styles.activeTabText]}>
            Candidates ({candidates.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID, mobile, or email..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="x" size={16} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Designation Pills (Only for Employees Tab) */}
      {activeTab === 'employees' && (
        <View style={styles.pillsScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
            {designations.map((desg) => (
              <TouchableOpacity
                key={desg}
                style={[styles.pill, selectedDesignation === desg && styles.activePill]}
                onPress={() => setSelectedDesignation(desg)}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedDesignation === desg && styles.activePillText,
                  ]}
                >
                  {desg}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main Content List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching staff records...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {activeTab === 'employees' ? (
            employees.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="users" size={48} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No Employees Found</Text>
                <Text style={styles.emptyDesc}>Try adjusting your search query or filter.</Text>
              </View>
            ) : (
              employees.map((emp) => {
                const isActive = (emp.employee_status || '').toLowerCase() === 'active' || (emp.activation_status || '').toLowerCase() === 'approved';
                return (
                  <Card key={emp.id} style={styles.recordCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                          {(emp.full_name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={styles.recordName}>{emp.full_name}</Text>
                        <Text style={styles.recordSub}>
                          {emp.employee_id} • {emp.designation || 'Staff'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isActive ? '#DCFCE7' : '#FEF3C7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: isActive ? '#15803D' : '#B45309',
                            },
                          ]}
                        >
                          {isActive ? 'ACTIVE' : (emp.activation_status || emp.employee_status || 'PENDING').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue}>{emp.mobile_number || 'N/A'}</Text>
                      </View>
                      <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Department</Text>
                        <Text style={styles.infoValue}>{emp.department || 'Sales & Support'}</Text>
                      </View>
                      <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Salary</Text>
                        <Text style={styles.infoValue}>₹{(emp.offered_salary || 0).toLocaleString('en-IN')}</Text>
                      </View>
                    </View>

                    {!isActive && (
                      <View style={styles.cardFooter}>
                        <TouchableOpacity
                          style={[styles.smallBtn, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                          onPress={() => handleActivate(emp.id, emp.full_name)}
                        >
                          <Icon name="check" size={14} color="#fff" />
                          <Text style={[styles.smallBtnText, { color: '#fff', fontWeight: '700' }]}>
                            Activate Employee
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Card>
                );
              })
            )
          ) : candidates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="file-text" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Candidates Found</Text>
              <Text style={styles.emptyDesc}>Candidates who applied via the portal will appear here.</Text>
            </View>
          ) : (
            candidates.map((cand) => (
              <Card key={cand.id} style={styles.recordCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatarCircle, { backgroundColor: '#EDE9FE' }]}>
                    <Text style={[styles.avatarText, { color: '#7C3AED' }]}>
                      {(cand.full_name || 'C').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.recordName}>{cand.full_name}</Text>
                    <Text style={styles.recordSub}>
                      {cand.reference_code || cand.mobile_number} • {cand.target_role || 'Applicant'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#1D4ED8' }]}>
                      {(cand.status || 'APPLIED').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Mobile</Text>
                    <Text style={styles.infoValue}>{cand.mobile_number || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Exp. Salary</Text>
                    <Text style={styles.infoValue}>₹{(cand.expected_salary || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>City</Text>
                    <Text style={styles.infoValue}>{cand.city || cand.current_city || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: '#EF444415', borderColor: '#EF4444' }]}
                    onPress={() => handleRejectCandidate(cand.id, cand.full_name)}
                  >
                    <Icon name="x" size={14} color="#EF4444" />
                    <Text style={[styles.smallBtnText, { color: '#EF4444' }]}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: '#10B981', borderColor: '#10B981', flex: 1 }]}
                    onPress={() => {
                      setSelectedCandidate(cand);
                      setOfferedDesignation(cand.target_role || 'TC');
                      setOfferedSalary(String(cand.expected_salary || 18000));
                      setConvertModalVisible(true);
                    }}
                  >
                    <Icon name="check" size={14} color="#fff" />
                    <Text style={[styles.smallBtnText, { color: '#fff', fontWeight: '700' }]}>
                      Convert to Employee
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* Convert to Employee Modal */}
      <Modal visible={convertModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Convert Candidate</Text>
            <Text style={styles.modalSub}>
              Convert {selectedCandidate?.full_name} to an active employee account.
            </Text>

            <Text style={styles.inputLabel}>Offered Designation</Text>
            <TextInput
              style={styles.modalInput}
              value={offeredDesignation}
              onChangeText={setOfferedDesignation}
              placeholder="e.g. TC, Team Leader, Manager"
            />

            <Text style={styles.inputLabel}>Offered Salary (₹/month)</Text>
            <TextInput
              style={styles.modalInput}
              value={offeredSalary}
              onChangeText={setOfferedSalary}
              keyboardType="numeric"
              placeholder="18000"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setConvertModalVisible(false)}
                disabled={converting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConvertCandidate}
                disabled={converting}
              >
                {converting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm & Convert</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 8,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.md,
    padding: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  kpiContainer: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTabBtn: {
    backgroundColor: `${colors.primary}12`,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  pillsScrollWrapper: {
    maxHeight: 44,
  },
  pillsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activePill: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMid,
  },
  activePillText: {
    color: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.textMid,
  },
  contentList: {
    flex: 1,
    padding: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 4,
    textAlign: 'center',
  },
  recordCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  recordName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  recordSub: {
    fontSize: 11,
    color: colors.textMid,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  cardFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: spacing.md,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMid,
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
