import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  assignEmployeeHierarchy,
  unassignEmployeeHierarchy,
} from '../../../services/super-admin.service';

const HIERARCHY_LEVELS = [
  { key: 'BRANCH_HEAD', label: 'Branch Head', short: 'BH', color: '#6366F1', bg: '#EEF2FF' },
  { key: 'SENIOR_MANAGER', label: 'Senior Manager', short: 'SM', color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'MANAGER', label: 'Manager', short: 'MGR', color: '#0284C7', bg: '#F0F9FF' },
  { key: 'TEAM_LEADER', label: 'Team Leader', short: 'TL', color: '#D97706', bg: '#FFFBEB' },
  { key: 'TC', label: 'TC / Telecaller', short: 'TC', color: '#059669', bg: '#ECFDF5' },
];

export default function SuperAdminEmployeesScreen() {
  const [activeTab, setActiveTab] = useState<'employees' | 'hierarchy' | 'candidates'>('employees');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('ALL');

  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);

  // Convert Candidate Modal State
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [offeredDesignation, setOfferedDesignation] = useState('TC');
  const [offeredSalary, setOfferedSalary] = useState('18000');
  const [converting, setConverting] = useState(false);

  // Hierarchy Assignment Modal State
  const [hierarchyModalVisible, setHierarchyModalVisible] = useState(false);
  const [selectedHierarchyEmp, setSelectedHierarchyEmp] = useState<any>(null);
  const [hierarchyLevel, setHierarchyLevel] = useState('TC');
  const [selectedBranchHeadId, setSelectedBranchHeadId] = useState<string>('');
  const [selectedSeniorManagerId, setSelectedSeniorManagerId] = useState<string>('');
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState<string>('');
  const [savingHierarchy, setSavingHierarchy] = useState(false);

  // Expanded Tree Levels State
  const [expandedTreeRole, setExpandedTreeRole] = useState<string | null>('BRANCH_HEAD');

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
    Alert.alert(
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

  const openHierarchyModal = (emp: any) => {
    setSelectedHierarchyEmp(emp);
    const desg = (emp.hierarchy_level || emp.designation || '').toUpperCase();
    let currentRole = 'TC';
    if (desg.includes('BRANCH') || desg === 'BRANCH_HEAD') currentRole = 'BRANCH_HEAD';
    else if (desg.includes('SENIOR') || desg === 'SENIOR_MANAGER') currentRole = 'SENIOR_MANAGER';
    else if (desg.includes('MANAGER') || desg === 'MANAGER') currentRole = 'MANAGER';
    else if (desg.includes('TEAM') || desg === 'TEAM_LEADER' || desg === 'TL') currentRole = 'TEAM_LEADER';
    else currentRole = 'TC';

    setHierarchyLevel(currentRole);
    setSelectedBranchHeadId(emp.branch_head_id || '');
    setSelectedSeniorManagerId(emp.senior_manager_id || '');
    setSelectedManagerId(emp.manager_id || '');
    setSelectedTeamLeaderId(emp.team_leader_id || '');
    setHierarchyModalVisible(true);
  };

  const handleSaveHierarchy = async () => {
    if (!selectedHierarchyEmp) return;
    try {
      setSavingHierarchy(true);
      await assignEmployeeHierarchy(selectedHierarchyEmp.id, {
        hierarchy_level: hierarchyLevel,
        branch_head_id: hierarchyLevel !== 'BRANCH_HEAD' ? (selectedBranchHeadId || null) : null,
        senior_manager_id: (hierarchyLevel === 'MANAGER' || hierarchyLevel === 'TEAM_LEADER' || hierarchyLevel === 'TC') ? (selectedSeniorManagerId || null) : null,
        manager_id: (hierarchyLevel === 'TEAM_LEADER' || hierarchyLevel === 'TC') ? (selectedManagerId || null) : null,
        team_leader_id: hierarchyLevel === 'TC' ? (selectedTeamLeaderId || null) : null,
      });
      setHierarchyModalVisible(false);
      Alert.alert('Hierarchy Updated', `Reporting hierarchy for ${selectedHierarchyEmp.full_name} saved successfully.`);
      loadData();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update employee hierarchy');
    } finally {
      setSavingHierarchy(false);
    }
  };

  const handleUnassignHierarchy = async () => {
    if (!selectedHierarchyEmp) return;
    Alert.alert(
      'Unassign Hierarchy',
      `Are you sure you want to remove all hierarchy links for ${selectedHierarchyEmp.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            try {
              setSavingHierarchy(true);
              await unassignEmployeeHierarchy(selectedHierarchyEmp.id);
              setHierarchyModalVisible(false);
              Alert.alert('Hierarchy Unassigned', `${selectedHierarchyEmp.full_name} is now unassigned.`);
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to unassign hierarchy');
            } finally {
              setSavingHierarchy(false);
            }
          },
        },
      ]
    );
  };

  // Filtered supervisor candidates by role
  const branchHeads = useMemo(() => employees.filter((e) => {
    const role = (e.hierarchy_level || e.designation || '').toUpperCase();
    return role.includes('BRANCH') || role === 'BRANCH_HEAD';
  }), [employees]);

  const seniorManagers = useMemo(() => employees.filter((e) => {
    const role = (e.hierarchy_level || e.designation || '').toUpperCase();
    return role.includes('SENIOR') || role === 'SENIOR_MANAGER';
  }), [employees]);

  const managers = useMemo(() => employees.filter((e) => {
    const role = (e.hierarchy_level || e.designation || '').toUpperCase();
    return (role.includes('MANAGER') && !role.includes('SENIOR')) || role === 'MANAGER';
  }), [employees]);

  const teamLeaders = useMemo(() => employees.filter((e) => {
    const role = (e.hierarchy_level || e.designation || '').toUpperCase();
    return role.includes('TEAM') || role === 'TEAM_LEADER' || role === 'TL';
  }), [employees]);

  const telecallers = useMemo(() => employees.filter((e) => {
    const role = (e.hierarchy_level || e.designation || '').toUpperCase();
    return role === 'TC' || role.includes('TELECALLER') || role.includes('STAFF');
  }), [employees]);

  const designations = ['ALL', 'Branch Head', 'Senior Manager', 'Manager', 'Team Leader', 'TC'];

  const getHierarchyBadge = (emp: any) => {
    const levelKey = (emp.hierarchy_level || '').toUpperCase();
    const desgUpper = (emp.designation || '').toUpperCase();
    let config = HIERARCHY_LEVELS.find((h) => h.key === levelKey);
    if (!config) {
      if (desgUpper.includes('BRANCH')) config = HIERARCHY_LEVELS[0];
      else if (desgUpper.includes('SENIOR')) config = HIERARCHY_LEVELS[1];
      else if (desgUpper.includes('MANAGER')) config = HIERARCHY_LEVELS[2];
      else if (desgUpper.includes('TEAM') || desgUpper === 'TL') config = HIERARCHY_LEVELS[3];
      else config = HIERARCHY_LEVELS[4];
    }
    return config;
  };

  const getSupervisorLabel = (emp: any) => {
    if (emp.team_leader_name) return `Reports to TL: ${emp.team_leader_name}`;
    if (emp.manager_name) return `Reports to Manager: ${emp.manager_name}`;
    if (emp.senior_manager_name) return `Reports to Sr Mgr: ${emp.senior_manager_name}`;
    if (emp.branch_head_name) return `Reports to Branch Head: ${emp.branch_head_name}`;
    const badge = getHierarchyBadge(emp);
    if (badge.key === 'BRANCH_HEAD') return 'Direct Executive Lead';
    return 'No Supervisor Assigned';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>SUPER ADMIN</Text>
          <Text style={styles.headerTitle}>Staff & 5-Level Hierarchy</Text>
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
            {stats?.active_employees || employees.filter(e => (e.employee_status || '').toLowerCase() === 'active').length}
          </Text>
          <Text style={styles.kpiLabel}>Active</Text>
        </View>
        <View style={[styles.kpiCard, { borderColor: '#6366F1' }]}>
          <Text style={[styles.kpiNumber, { color: '#6366F1' }]}>
            {branchHeads.length + seniorManagers.length + managers.length + teamLeaders.length}
          </Text>
          <Text style={styles.kpiLabel}>Supervisors</Text>
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
            size={15}
            color={activeTab === 'employees' ? colors.primary : colors.textLight}
          />
          <Text style={[styles.tabText, activeTab === 'employees' && styles.activeTabText]}>
            Staff ({employees.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'hierarchy' && styles.activeTabBtn]}
          onPress={() => setActiveTab('hierarchy')}
        >
          <Icon
            name="git-branch"
            size={15}
            color={activeTab === 'hierarchy' ? colors.primary : colors.textLight}
          />
          <Text style={[styles.tabText, activeTab === 'hierarchy' && styles.activeTabText]}>
            Hierarchy Tree
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'candidates' && styles.activeTabBtn]}
          onPress={() => setActiveTab('candidates')}
        >
          <Icon
            name="file-text"
            size={15}
            color={activeTab === 'candidates' ? colors.primary : colors.textLight}
          />
          <Text style={[styles.tabText, activeTab === 'candidates' && styles.activeTabText]}>
            Talent ({candidates.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input (For Employees & Candidates) */}
      {activeTab !== 'hierarchy' && (
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, mobile, or designation..."
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
      )}

      {/* Designation Filter Pills (Only for Employees Tab) */}
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

      {/* Main Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching staff records & hierarchy...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {activeTab === 'employees' && (
            employees.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="users" size={48} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No Employees Found</Text>
                <Text style={styles.emptyDesc}>Try adjusting your search query or filter.</Text>
              </View>
            ) : (
              employees.map((emp) => {
                const isActive = (emp.employee_status || '').toLowerCase() === 'active' || (emp.activation_status || '').toLowerCase() === 'approved';
                const hBadge = getHierarchyBadge(emp);
                const supervisorLabel = getSupervisorLabel(emp);

                return (
                  <Card key={emp.id} style={styles.recordCard}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.avatarCircle, { backgroundColor: hBadge.bg }]}>
                        <Text style={[styles.avatarText, { color: hBadge.color }]}>
                          {(emp.full_name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={styles.recordName}>{emp.full_name}</Text>
                        <Text style={styles.recordSub}>
                          {emp.employee_id || emp.id.slice(0, 8)} • {emp.designation || 'Staff'}
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

                    {/* Hierarchy Level Banner */}
                    <View style={styles.hierarchyBadgeRow}>
                      <View style={[styles.hierarchyTag, { backgroundColor: hBadge.bg, borderColor: hBadge.color }]}>
                        <Icon name="shield" size={12} color={hBadge.color} />
                        <Text style={[styles.hierarchyTagText, { color: hBadge.color }]}>{hBadge.label}</Text>
                      </View>
                      <Text style={styles.supervisorText} numberOfLines={1}>
                        {supervisorLabel}
                      </Text>
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

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={[styles.smallBtn, { backgroundColor: '#EEF2FF', borderColor: '#6366F1' }]}
                        onPress={() => openHierarchyModal(emp)}
                      >
                        <Icon name="git-branch" size={13} color="#6366F1" />
                        <Text style={[styles.smallBtnText, { color: '#6366F1', fontWeight: '700' }]}>
                          Assign Hierarchy
                        </Text>
                      </TouchableOpacity>

                      {!isActive && (
                        <TouchableOpacity
                          style={[styles.smallBtn, { backgroundColor: '#10B981', borderColor: '#10B981', flex: 1 }]}
                          onPress={() => handleActivate(emp.id, emp.full_name)}
                        >
                          <Icon name="check" size={13} color="#fff" />
                          <Text style={[styles.smallBtnText, { color: '#fff', fontWeight: '700' }]}>
                            Activate
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card>
                );
              })
            )
          )}

          {/* HIERARCHY TREE VIEW */}
          {activeTab === 'hierarchy' && (
            <View style={styles.treeWrapper}>
              <View style={styles.treeOverviewCard}>
                <Text style={styles.treeOverviewTitle}>5-Level Organizational Structure</Text>
                <Text style={styles.treeOverviewSub}>
                  Branch Head ➔ Senior Manager ➔ Manager ➔ Team Leader ➔ TC
                </Text>
              </View>

              {HIERARCHY_LEVELS.map((lvl) => {
                let members: any[] = [];
                if (lvl.key === 'BRANCH_HEAD') members = branchHeads;
                else if (lvl.key === 'SENIOR_MANAGER') members = seniorManagers;
                else if (lvl.key === 'MANAGER') members = managers;
                else if (lvl.key === 'TEAM_LEADER') members = teamLeaders;
                else members = telecallers;

                const isExpanded = expandedTreeRole === lvl.key;

                return (
                  <Card key={lvl.key} style={styles.treeLevelCard}>
                    <TouchableOpacity
                      style={styles.treeLevelHeader}
                      onPress={() => setExpandedTreeRole(isExpanded ? null : lvl.key)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.treeLevelBadge, { backgroundColor: lvl.bg }]}>
                        <Text style={[styles.treeLevelBadgeText, { color: lvl.color }]}>{lvl.short}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={styles.treeLevelTitle}>{lvl.label}</Text>
                        <Text style={styles.treeLevelCount}>{members.length} {members.length === 1 ? 'member' : 'members'}</Text>
                      </View>
                      <Icon
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.textLight}
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.treeMemberList}>
                        {members.length === 0 ? (
                          <Text style={styles.treeEmptyMember}>No employees assigned to {lvl.label} yet.</Text>
                        ) : (
                          members.map((m) => (
                            <View key={m.id} style={styles.treeMemberItem}>
                              <View style={styles.treeMemberInfo}>
                                <Text style={styles.treeMemberName}>{m.full_name}</Text>
                                <Text style={styles.treeMemberSub}>
                                  {m.employee_id || m.mobile_number} • {getSupervisorLabel(m)}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.treeEditBtn}
                                onPress={() => openHierarchyModal(m)}
                              >
                                <Icon name="edit-2" size={13} color={colors.primary} />
                              </TouchableOpacity>
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          )}

          {/* CANDIDATES TAB */}
          {activeTab === 'candidates' && (
            candidates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="file-text" size={48} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No Candidates Found</Text>
                <Text style={styles.emptyDesc}>Candidates who applied via the career portal will appear here.</Text>
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
            )
          )}
        </ScrollView>
      )}

      {/* Hierarchy Assignment Modal */}
      <Modal visible={hierarchyModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '88%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Assign Hierarchy</Text>
                  <Text style={styles.modalSub}>
                    {selectedHierarchyEmp?.full_name} ({selectedHierarchyEmp?.employee_id || 'Staff'})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setHierarchyModalVisible(false)}>
                  <Icon name="x" size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>

              {/* Hierarchy Level Picker */}
              <Text style={styles.inputLabel}>1. Select Hierarchy Level</Text>
              <View style={styles.levelSelectorContainer}>
                {HIERARCHY_LEVELS.map((lvl) => {
                  const isSelected = hierarchyLevel === lvl.key;
                  return (
                    <TouchableOpacity
                      key={lvl.key}
                      style={[
                        styles.levelSelectorPill,
                        isSelected && { backgroundColor: lvl.color, borderColor: lvl.color },
                      ]}
                      onPress={() => setHierarchyLevel(lvl.key)}
                    >
                      <Text
                        style={[
                          styles.levelSelectorText,
                          isSelected && { color: '#fff', fontWeight: '800' },
                        ]}
                      >
                        {lvl.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Dependent Reporting Supervisor Selectors */}
              <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>2. Reporting Supervisor</Text>

              {hierarchyLevel === 'BRANCH_HEAD' && (
                <View style={styles.supervisoNoticeBox}>
                  <Icon name="info" size={16} color="#6366F1" />
                  <Text style={styles.supervisoNoticeText}>
                    Branch Head is the top level in this operational hierarchy and reports directly to executive management.
                  </Text>
                </View>
              )}

              {hierarchyLevel === 'SENIOR_MANAGER' && (
                <View style={styles.supervisorGroup}>
                  <Text style={styles.subInputLabel}>Reporting Branch Head:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.supervisorPills}>
                    <TouchableOpacity
                      style={[styles.supervisorPill, !selectedBranchHeadId && styles.supervisorPillActive]}
                      onPress={() => setSelectedBranchHeadId('')}
                    >
                      <Text style={[styles.supervisorPillText, !selectedBranchHeadId && styles.supervisorPillTextActive]}>None</Text>
                    </TouchableOpacity>
                    {branchHeads.filter(b => b.id !== selectedHierarchyEmp?.id).map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.supervisorPill, selectedBranchHeadId === b.id && styles.supervisorPillActive]}
                        onPress={() => setSelectedBranchHeadId(b.id)}
                      >
                        <Text style={[styles.supervisorPillText, selectedBranchHeadId === b.id && styles.supervisorPillTextActive]}>
                          {b.full_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {hierarchyLevel === 'MANAGER' && (
                <>
                  <View style={styles.supervisorGroup}>
                    <Text style={styles.subInputLabel}>Reporting Senior Manager:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.supervisorPills}>
                      <TouchableOpacity
                        style={[styles.supervisorPill, !selectedSeniorManagerId && styles.supervisorPillActive]}
                        onPress={() => setSelectedSeniorManagerId('')}
                      >
                        <Text style={[styles.supervisorPillText, !selectedSeniorManagerId && styles.supervisorPillTextActive]}>None</Text>
                      </TouchableOpacity>
                      {seniorManagers.filter(s => s.id !== selectedHierarchyEmp?.id).map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          style={[styles.supervisorPill, selectedSeniorManagerId === s.id && styles.supervisorPillActive]}
                          onPress={() => setSelectedSeniorManagerId(s.id)}
                        >
                          <Text style={[styles.supervisorPillText, selectedSeniorManagerId === s.id && styles.supervisorPillTextActive]}>
                            {s.full_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.supervisorGroup}>
                    <Text style={styles.subInputLabel}>Branch Head (Optional):</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.supervisorPills}>
                      <TouchableOpacity
                        style={[styles.supervisorPill, !selectedBranchHeadId && styles.supervisorPillActive]}
                        onPress={() => setSelectedBranchHeadId('')}
                      >
                        <Text style={[styles.supervisorPillText, !selectedBranchHeadId && styles.supervisorPillTextActive]}>None</Text>
                      </TouchableOpacity>
                      {branchHeads.filter(b => b.id !== selectedHierarchyEmp?.id).map((b) => (
                        <TouchableOpacity
                          key={b.id}
                          style={[styles.supervisorPill, selectedBranchHeadId === b.id && styles.supervisorPillActive]}
                          onPress={() => setSelectedBranchHeadId(b.id)}
                        >
                          <Text style={[styles.supervisorPillText, selectedBranchHeadId === b.id && styles.supervisorPillTextActive]}>
                            {b.full_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}

              {hierarchyLevel === 'TEAM_LEADER' && (
                <>
                  <View style={styles.supervisorGroup}>
                    <Text style={styles.subInputLabel}>Reporting Manager:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.supervisorPills}>
                      <TouchableOpacity
                        style={[styles.supervisorPill, !selectedManagerId && styles.supervisorPillActive]}
                        onPress={() => setSelectedManagerId('')}
                      >
                        <Text style={[styles.supervisorPillText, !selectedManagerId && styles.supervisorPillTextActive]}>None</Text>
                      </TouchableOpacity>
                      {managers.filter(m => m.id !== selectedHierarchyEmp?.id).map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={[styles.supervisorPill, selectedManagerId === m.id && styles.supervisorPillActive]}
                          onPress={() => setSelectedManagerId(m.id)}
                        >
                          <Text style={[styles.supervisorPillText, selectedManagerId === m.id && styles.supervisorPillTextActive]}>
                            {m.full_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}

              {hierarchyLevel === 'TC' && (
                <>
                  <View style={styles.supervisorGroup}>
                    <Text style={styles.subInputLabel}>Reporting Team Leader:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.supervisorPills}>
                      <TouchableOpacity
                        style={[styles.supervisorPill, !selectedTeamLeaderId && styles.supervisorPillActive]}
                        onPress={() => setSelectedTeamLeaderId('')}
                      >
                        <Text style={[styles.supervisorPillText, !selectedTeamLeaderId && styles.supervisorPillTextActive]}>None</Text>
                      </TouchableOpacity>
                      {teamLeaders.filter(t => t.id !== selectedHierarchyEmp?.id).map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          style={[styles.supervisorPill, selectedTeamLeaderId === t.id && styles.supervisorPillActive]}
                          onPress={() => setSelectedTeamLeaderId(t.id)}
                        >
                          <Text style={[styles.supervisorPillText, selectedTeamLeaderId === t.id && styles.supervisorPillTextActive]}>
                            {t.full_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.supervisorGroup}>
                    <Text style={styles.subInputLabel}>Manager (Optional):</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.supervisorPills}>
                      <TouchableOpacity
                        style={[styles.supervisorPill, !selectedManagerId && styles.supervisorPillActive]}
                        onPress={() => setSelectedManagerId('')}
                      >
                        <Text style={[styles.supervisorPillText, !selectedManagerId && styles.supervisorPillTextActive]}>None</Text>
                      </TouchableOpacity>
                      {managers.filter(m => m.id !== selectedHierarchyEmp?.id).map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={[styles.supervisorPill, selectedManagerId === m.id && styles.supervisorPillActive]}
                          onPress={() => setSelectedManagerId(m.id)}
                        >
                          <Text style={[styles.supervisorPillText, selectedManagerId === m.id && styles.supervisorPillTextActive]}>
                            {m.full_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}

              {/* Actions */}
              <View style={[styles.modalActions, { marginTop: spacing.lg }]}>
                <TouchableOpacity
                  style={styles.modalUnassignBtn}
                  onPress={handleUnassignHierarchy}
                  disabled={savingHierarchy}
                >
                  <Text style={styles.modalUnassignText}>Unassign</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setHierarchyModalVisible(false)}
                  disabled={savingHierarchy}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleSaveHierarchy}
                  disabled={savingHierarchy}
                >
                  {savingHierarchy ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Save Hierarchy</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    gap: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  activeTabBtn: {
    backgroundColor: `${colors.primary}12`,
  },
  tabText: {
    fontSize: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
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
  hierarchyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
    gap: 8,
  },
  hierarchyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    gap: 4,
  },
  hierarchyTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  supervisorText: {
    flex: 1,
    fontSize: 11,
    color: colors.textMid,
    fontWeight: '500',
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
  },
  treeWrapper: {
    gap: spacing.sm,
  },
  treeOverviewCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  treeOverviewTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  treeOverviewSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },
  treeLevelCard: {
    padding: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  treeLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  treeLevelBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeLevelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  treeLevelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  treeLevelCount: {
    fontSize: 11,
    color: colors.textMid,
  },
  treeMemberList: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  treeEmptyMember: {
    fontSize: 11,
    color: colors.textLight,
    fontStyle: 'italic',
    padding: spacing.xs,
  },
  treeMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  treeMemberInfo: {
    flex: 1,
  },
  treeMemberName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  treeMemberSub: {
    fontSize: 10,
    color: colors.textMid,
    marginTop: 1,
  },
  treeEditBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  subInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMid,
    marginBottom: 4,
  },
  levelSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  levelSelectorPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  levelSelectorText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  supervisoNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: spacing.sm,
    gap: 8,
    alignItems: 'center',
  },
  supervisoNoticeText: {
    fontSize: 11,
    color: '#4338CA',
    flex: 1,
  },
  supervisorGroup: {
    marginTop: 8,
  },
  supervisorPills: {
    gap: 6,
    paddingVertical: 4,
  },
  supervisorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  supervisorPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  supervisorPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  supervisorPillTextActive: {
    color: '#fff',
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
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalUnassignBtn: {
    marginRight: 'auto',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  modalUnassignText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMid,
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
