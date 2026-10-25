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
  Image,
  Linking,
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
  fetchEmployeeDetails,
  updateEmployeeInfo,
  approveDocument,
  rejectDocument,
  fetchEmployeeAttendance,
  verifyEmployeeKYC,
  updateEmployeeIdentityDetails,
  sendReminder,
  sendKYCReverificationLink,
  resetLoginCredentials,
  toggleEmployeeStatus,
  downloadProfileSummary,
  fetchEmployeeDepartments,
  saveEmployeeDepartments,
  fetchBonusRules,
  createBonusRule,
  deleteBonusRule,
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
  const [actionRequiredFilter, setActionRequiredFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);

  // Employee 360 Drawer State
  const [employeeDrawerVisible, setEmployeeDrawerVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'kyc' | 'biometric' | 'team' | 'attendance' | 'actions'>('overview');
  const [employee360Data, setEmployee360Data] = useState<any>(null);
  const [loading360, setLoading360] = useState(false);

  // Document Verification State
  const [docStatuses, setDocStatuses] = useState<any>({});
  const [rejectingDoc, setRejectingDoc] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Identity Fields State
  const [identityFields, setIdentityFields] = useState({
    aadhaar_number: '',
    pan_number: '',
    bank_account: '',
    ifsc_code: '',
    admin_remarks: '',
  });
  const [savingIdentity, setSavingIdentity] = useState(false);

  // Attendance State
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth() + 1);
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());

  // Employee Edit State
  const [editingEmployee, setEditingEmployee] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    mobile_number: '',
    email_id: '',
    designation: '',
    department: '',
  });

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

  // Document Inspection Preview Modal State
  const [viewingDocModal, setViewingDocModal] = useState<{ key: string; label: string; url: string | null } | null>(null);

  // Attendance Day Inspection Modal State
  const [selectedDayAttendance, setSelectedDayAttendance] = useState<any>(null);

  // Department & Bank Assignment Modal State
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [deptModalEmp, setDeptModalEmp] = useState<any>(null);
  const [deptBanksList, setDeptBanksList] = useState<any[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [savingDepts, setSavingDepts] = useState(false);

  // Bonus & Targets Modal State
  const [bonusModalVisible, setBonusModalVisible] = useState(false);
  const [bonusModalEmp, setBonusModalEmp] = useState<any>(null);
  const [bonusRulesList, setBonusRulesList] = useState<any[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  const [bonusEmployeeBanks, setBonusEmployeeBanks] = useState<any[]>([]);
  const [bonusForm, setBonusForm] = useState({
    employee_id: '',
    bank_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    target_count: '10',
    bonus_per_card: '500',
  });

  // Login Credentials Modal State
  const [credentialsModalEmp, setCredentialsModalEmp] = useState<any>(null);
  const [credentialsTempPassword, setCredentialsTempPassword] = useState('Pass#1234');
  const [credentialsCopied, setCredentialsCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, empRes, candRes] = await Promise.all([
        fetchEmployeeStats().catch(() => null),
        fetchEmployeesList({
          search: searchQuery || undefined,
          designation: selectedDesignation !== 'ALL' ? selectedDesignation : undefined,
          action_required: actionRequiredFilter || undefined,
          department: departmentFilter || undefined,
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
  }, [searchQuery, selectedDesignation, actionRequiredFilter, departmentFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const fetchEmployee360 = async (empId: string) => {
    try {
      setLoading360(true);
      const res = await fetchEmployeeDetails(empId);
      if (res?.success && res?.data) {
        setEmployee360Data(res.data);
        
        // Set document statuses
        const data = res.data;
        const kyc = data.kyc || {};
        const emp = data.employee || {};
        const docs = data.documents || [];

        const findDoc = (types: string[]) => 
          docs.find((d: any) => types.includes(String(d.document_type || '').toLowerCase().trim()));

        const parseStatus = (statusStr: string, isVerified: boolean, url: string) => {
          if (isVerified || statusStr === 'VERIFIED' || statusStr === 'APPROVED') return 'verified';
          if (statusStr === 'REJECTED') return 'rejected';
          if (url || statusStr === 'SUBMITTED' || statusStr === 'UNDER_REVIEW' || statusStr === 'PENDING') return 'submitted';
          return 'not_uploaded';
        };

        const aadhaarDoc = findDoc(['aadhaar', 'aadhaar_card', 'aadhaar_front', 'aadhaar_back']);
        const panDoc = findDoc(['pan', 'pan_card']);
        const bankDoc = findDoc(['bank', 'bank_proof', 'bank_passbook', 'cheque', 'passbook']);
        const photoDoc = findDoc(['photo', 'photograph', 'profile_photo']);
        const offerDoc = findDoc(['offer_letter', 'joining_form', 'terms_video', 'resume']);

        const aadhaarUrl = kyc.aadhaar_document_url || aadhaarDoc?.document_url || null;
        const panUrl = kyc.pan_document_url || panDoc?.document_url || null;
        const bankUrl = kyc.bank_document_url || bankDoc?.document_url || null;
        const photoUrl = emp.profile_photo_url || photoDoc?.document_url || null;
        const offerUrl = offerDoc?.document_url || emp.resume_url || null;

        setDocStatuses({
          aadhaar: {
            status: parseStatus(kyc.aadhaar_status || aadhaarDoc?.verification_status, kyc.aadhaar_verified, aadhaarUrl),
            reason: kyc.aadhaar_rejection_reason || aadhaarDoc?.rejection_reason || '',
            url: aadhaarUrl
          },
          pan: {
            status: parseStatus(kyc.pan_status || panDoc?.verification_status, kyc.pan_verified, panUrl),
            reason: kyc.pan_rejection_reason || panDoc?.rejection_reason || '',
            url: panUrl
          },
          bank: {
            status: parseStatus(kyc.bank_status || bankDoc?.verification_status, kyc.bank_verified, bankUrl),
            reason: kyc.bank_rejection_reason || bankDoc?.rejection_reason || '',
            url: bankUrl
          },
          photo: {
            status: parseStatus(photoDoc?.verification_status || (photoUrl ? 'SUBMITTED' : 'NOT_UPLOADED'), false, photoUrl),
            reason: photoDoc?.rejection_reason || '',
            url: photoUrl
          },
          offer_letter: {
            status: parseStatus(offerDoc?.verification_status || (offerUrl ? 'SUBMITTED' : 'NOT_UPLOADED'), false, offerUrl),
            reason: offerDoc?.rejection_reason || '',
            url: offerUrl
          }
        });

        setIdentityFields({
          aadhaar_number: kyc.aadhaar_number || emp.aadhaar_number || '',
          pan_number: kyc.pan_number || emp.pan_number || '',
          bank_account: kyc.bank_account_number || emp.bank_account_number || '',
          ifsc_code: kyc.ifsc_code || emp.ifsc_code || '',
          admin_remarks: kyc.review_notes || '',
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load employee details');
    } finally {
      setLoading360(false);
    }
  };

  const fetchAttendance = async (empId: string) => {
    try {
      const res = await fetchEmployeeAttendance(empId, attendanceMonth, attendanceYear);
      if (res?.success) {
        setAttendanceData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch attendance:', err);
    }
  };

  const openEmployeeDrawer = (emp: any) => {
    setSelectedEmployee(emp);
    setDrawerTab('overview');
    setEmployeeDrawerVisible(true);
    fetchEmployee360(emp.id);
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

  const handleApproveDoc = async (docType: string) => {
    if (!selectedEmployee) return;
    try {
      await approveDocument(selectedEmployee.id, docType);
      Alert.alert('Success', 'Document approved successfully');
      fetchEmployee360(selectedEmployee.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to approve document');
    }
  };

  const handleRejectDoc = async (docType: string) => {
    if (!selectedEmployee || !rejectReason.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason');
      return;
    }
    try {
      await rejectDocument(selectedEmployee.id, docType, rejectReason);
      Alert.alert('Success', 'Document rejected');
      setRejectingDoc(null);
      setRejectReason('');
      fetchEmployee360(selectedEmployee.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject document');
    }
  };

  const handleSaveEmployeeEdit = async () => {
    if (!selectedEmployee) return;
    try {
      await updateEmployeeInfo(selectedEmployee.id, editForm);
      Alert.alert('Success', 'Employee information updated');
      setEditingEmployee(false);
      fetchEmployee360(selectedEmployee.id);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update employee');
    }
  };

  // ── Manage Departments Handlers ──
  const openDeptModal = async (emp: any) => {
    setDeptModalEmp(emp);
    setDeptModalVisible(true);
    setLoadingDepts(true);
    try {
      const res = await fetchEmployeeDepartments(emp.id);
      if (res?.success) {
        setDeptBanksList(res.all_banks || []);
        setSelectedBankIds((res.assigned_banks || []).map((b: any) => b.bank_id));
      }
    } catch (err: any) {
      console.error('Failed to load employee department assignments:', err);
      Alert.alert('Error', err.message || 'Failed to load bank assignments');
    } finally {
      setLoadingDepts(false);
    }
  };

  const handleSaveDeptAssignments = async () => {
    if (!deptModalEmp) return;
    setSavingDepts(true);
    try {
      const res = await saveEmployeeDepartments(deptModalEmp.id, selectedBankIds);
      if (res?.success) {
        Alert.alert('Success', res.message || 'Department/Bank assignments updated successfully');
        setDeptModalVisible(false);
        fetchEmployee360(deptModalEmp.id);
        loadData();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update department assignments');
    } finally {
      setSavingDepts(false);
    }
  };

  // ── Manage Bonus Rules Handlers ──
  const openBonusModal = async (emp: any = null) => {
    setBonusModalEmp(emp);
    const targetEmpId = emp ? emp.id : (employees[0]?.id || '');
    setBonusForm({
      employee_id: targetEmpId,
      bank_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      target_count: '10',
      bonus_per_card: '500',
    });
    setBonusModalVisible(true);
    loadBonusRules();
    if (targetEmpId) {
      loadEmployeeAssignedBanks(targetEmpId);
    }
  };

  const loadEmployeeAssignedBanks = async (empId: string) => {
    if (!empId) return;
    try {
      const res = await fetchEmployeeDepartments(empId);
      if (res?.success) {
        const assigned = res.assigned_banks || [];
        setBonusEmployeeBanks(assigned);
        if (assigned.length > 0) {
          setBonusForm((prev) => ({ ...prev, bank_id: assigned[0].bank_id }));
        } else {
          setBonusForm((prev) => ({ ...prev, bank_id: '' }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch assigned banks for bonus form:', err);
    }
  };

  const loadBonusRules = async () => {
    setLoadingRules(true);
    try {
      const res = await fetchBonusRules();
      if (res?.success) {
        setBonusRulesList(res.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch bonus rules:', err);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleSaveBonusRule = async () => {
    if (!bonusForm.employee_id || !bonusForm.bank_id || !bonusForm.start_date || !bonusForm.end_date) {
      Alert.alert('Required Fields', 'Please fill out all required fields');
      return;
    }
    setSavingRule(true);
    try {
      const res = await createBonusRule(bonusForm);
      if (res?.success) {
        Alert.alert('Success', res.message || 'Bonus target rule assigned successfully!');
        loadBonusRules();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save bonus rule');
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteBonusRule = async (ruleId: string) => {
    Alert.alert(
      'Delete Bonus Rule',
      'Are you sure you want to delete this bonus target rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteBonusRule(ruleId);
              if (res?.success) {
                loadBonusRules();
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete bonus rule');
            }
          },
        },
      ]
    );
  };

  // ── Send Credentials Handlers ──
  const getCredentialMessageTemplate = (emp: any, pass: string) => {
    return `Dear ${emp?.full_name || 'Employee'},\nYour login credentials for the GharKaPaisa Portal are:\nPortal: https://gharkapaisa.com/login\nUser/ID: ${emp?.employee_code || emp?.employee_id || emp?.id || 'EMP10001'}\nPassword: ${pass}\nPlease login and reset your password.`;
  };

  const handleSendWhatsAppCredentials = (emp: any, pass: string) => {
    const text = encodeURIComponent(getCredentialMessageTemplate(emp, pass));
    const phone = (emp?.mobile_number || '').replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${phone.startsWith('91') ? phone : '91' + phone}&text=${text}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`).catch(() => {
        Alert.alert('Error', 'WhatsApp is not installed on this device.');
      });
    });
  };

  const handleSendSmsCredentials = (emp: any, pass: string) => {
    const text = encodeURIComponent(getCredentialMessageTemplate(emp, pass));
    const phone = emp?.mobile_number || '';
    Linking.openURL(`sms:${phone}?body=${text}`).catch(() => {
      Alert.alert('Error', 'Unable to open SMS application.');
    });
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

  const renderDrawerContent = () => {
    if (loading360) {
      return (
        <View style={styles.drawerCentered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.drawerLoadingText}>Loading employee details...</Text>
        </View>
      );
    }

    const emp = employee360Data?.employee || selectedEmployee;
    const kyc = employee360Data?.kyc || {};

    switch (drawerTab) {
      case 'overview':
        return (
          <ScrollView style={styles.drawerScroll}>
            <View style={styles.drawerSection}>
              <View style={styles.drawerSectionHeader}>
                <Text style={styles.drawerSectionTitle}>Employee Information</Text>
                <View style={styles.drawerHeaderActions}>
                  <TouchableOpacity style={styles.actionsBtn}>
                    <Icon name="ellipsis-h" size={16} color={colors.text} />
                    <Text style={styles.actionsBtnText}>Actions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setEditForm({
                      full_name: emp?.full_name || '',
                      mobile_number: emp?.mobile_number || '',
                      email_id: emp?.email_id || '',
                      designation: emp?.designation || '',
                      department: emp?.department || '',
                    });
                    setEditingEmployee(true);
                  }}>
                    <Icon name="edit-2" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {!editingEmployee ? (
                <>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Full Name</Text>
                    <Text style={styles.drawerValue}>{emp?.full_name || 'N/A'}</Text>
                  </View>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Date of Joining</Text>
                    <Text style={styles.drawerValue}>{emp?.joining_date || emp?.date_of_joining || (emp?.created_at ? new Date(emp.created_at).toLocaleDateString() : 'N/A')}</Text>
                  </View>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Employee Code</Text>
                    <Text style={styles.drawerValue}>{emp?.employee_code || emp?.employee_id || emp?.emp_code || emp?.code || (emp?.id ? String(emp.id).slice(0, 8) : 'N/A')}</Text>
                  </View>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Account Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: emp?.activation_status === 'APPROVED' ? '#D1FAE5' : '#FEF3C7' }]}>
                      <Text style={[styles.statusBadgeText, { color: emp?.activation_status === 'APPROVED' ? '#065F46' : '#92400E' }]}>
                        {emp?.activation_status === 'APPROVED' ? '✓ Active' : '● Pending'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Mobile Number</Text>
                    <Text style={styles.drawerValue}>{emp?.mobile_number || 'N/A'}</Text>
                  </View>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Reporting Manager</Text>
                    <Text style={styles.drawerValue}>{emp?.manager_name || emp?.reporting_manager || emp?.team_leader_name || 'N/A'}</Text>
                  </View>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Email Address</Text>
                    <Text style={styles.drawerValue}>{emp?.email_id || emp?.email || 'N/A'}</Text>
                  </View>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Team</Text>
                    <Text style={styles.drawerValue}>{emp?.team_name || emp?.team || (emp?.team_leader_name ? `${emp.team_leader_name}'s Team` : 'N/A')}</Text>
                  </View>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Designation</Text>
                    <Text style={styles.drawerValue}>{emp?.designation || emp?.role || 'N/A'}</Text>
                  </View>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Attendance Access</Text>
                    <View style={[styles.statusBadge, { backgroundColor: (emp?.attendance_access === false || emp?.attendance_enabled === false) ? '#FEE2E2' : '#D1FAE5' }]}>
                      <Text style={[styles.statusBadgeText, { color: (emp?.attendance_access === false || emp?.attendance_enabled === false) ? '#991B1B' : '#065F46' }]}>
                        {(emp?.attendance_access === false || emp?.attendance_enabled === false) ? '✕ Disabled' : '✓ Enabled'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Department</Text>
                    <Text style={styles.drawerValue}>{emp?.department || 'N/A'}</Text>
                  </View>
                  <View style={styles.drawerInfoRow}>
                    <Text style={styles.drawerLabel}>Bank Access</Text>
                    <Text style={styles.drawerValue}>{emp?.active_links_count !== undefined ? `${emp.active_links_count} Products Assigned` : (emp?.bank_count !== undefined ? `${emp.bank_count} Banks Assigned` : 'N/A')}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.editRow}>
                    <Text style={styles.drawerLabel}>Full Name *</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.full_name}
                      onChangeText={(t) => setEditForm({ ...editForm, full_name: t })}
                    />
                  </View>
                  <View style={styles.editRow}>
                    <Text style={styles.drawerLabel}>Mobile Number *</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.mobile_number}
                      onChangeText={(t) => setEditForm({ ...editForm, mobile_number: t })}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={styles.editRow}>
                    <Text style={styles.drawerLabel}>Email Address *</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.email_id}
                      onChangeText={(t) => setEditForm({ ...editForm, email_id: t })}
                      keyboardType="email-address"
                    />
                  </View>
                  <View style={styles.editRow}>
                    <Text style={styles.drawerLabel}>Designation *</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.designation}
                      onChangeText={(t) => setEditForm({ ...editForm, designation: t })}
                    />
                  </View>
                  <View style={styles.editRow}>
                    <Text style={styles.drawerLabel}>Department</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.department}
                      onChangeText={(t) => setEditForm({ ...editForm, department: t })}
                    />
                  </View>
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.editCancelBtn} onPress={() => setEditingEmployee(false)}>
                      <Text style={styles.editCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editSaveBtn} onPress={handleSaveEmployeeEdit}>
                      <Text style={styles.editSaveText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* Status Summary Cards */}
            <View style={styles.statusCardsGrid}>
              <View style={styles.statusCard}>
                <Text style={styles.statusCardLabel}>KYC Status</Text>
                <View style={styles.statusCardValueRow}>
                  <View style={[styles.statusCardIcon, { backgroundColor: '#10B981' }]}>
                    <Icon name="check" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.statusCardValue, { color: '#059669' }]}>Completed</Text>
                </View>
                <Text style={styles.statusCardSub}>All documents verified</Text>
              </View>

              <View style={styles.statusCard}>
                <Text style={styles.statusCardLabel}>Face Verification</Text>
                <View style={styles.statusCardValueRow}>
                  <View style={[styles.statusCardIcon, { backgroundColor: '#F59E0B' }]}>
                    <Icon name="exclamation-circle" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.statusCardValue, { color: '#D97706' }]}>Pending</Text>
                </View>
                <Text style={styles.statusCardSub}>Biometric reference not captured</Text>
              </View>

              <View style={styles.statusCard}>
                <Text style={styles.statusCardLabel}>Attendance</Text>
                <View style={styles.statusCardValueRow}>
                  <View style={[styles.statusCardIcon, { backgroundColor: '#10B981' }]}>
                    <Icon name="check" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.statusCardValue, { color: '#059669' }]}>Enabled</Text>
                </View>
                <Text style={styles.statusCardSub}>Can mark attendance</Text>
              </View>

              <View style={styles.statusCard}>
                <Text style={styles.statusCardLabel}>Team Assignment</Text>
                <View style={styles.statusCardValueRow}>
                  <View style={[styles.statusCardIcon, { backgroundColor: '#4F46E5' }]}>
                    <Icon name="users" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.statusCardValue, { color: '#4F46E5' }]}>Assigned</Text>
                </View>
                <Text style={styles.statusCardSub}>{emp?.team_name || 'Team Alpha'}</Text>
              </View>
            </View>

            {/* Additional Fields (Mobile additions) */}
            <View style={styles.drawerSection}>
              <Text style={styles.drawerSectionTitle}>Additional Information</Text>
              <View style={styles.drawerInfoRow}>
                <Text style={styles.drawerLabel}>Salary</Text>
                <Text style={styles.drawerValue}>₹{(emp?.offered_salary || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.drawerInfoRow}>
                <Text style={styles.drawerLabel}>Work Anniversary</Text>
                <Text style={styles.drawerValue}>{emp?.joining_date ? `${Math.floor((new Date().getTime() - new Date(emp.joining_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} years` : 'N/A'}</Text>
              </View>
              <View style={styles.drawerInfoRow}>
                <Text style={styles.drawerLabel}>Performance Target</Text>
                <Text style={styles.drawerValue}>{emp?.performance_target || '₹0'}</Text>
              </View>
              <View style={styles.drawerInfoRow}>
                <Text style={styles.drawerLabel}>Incentive Earned</Text>
                <Text style={[styles.drawerValue, { color: '#10B981' }]}>{emp?.incentive_earned ? `₹${emp.incentive_earned.toLocaleString('en-IN')}` : '₹0'}</Text>
              </View>
            </View>

            {/* Hierarchy Information */}
            <View style={styles.drawerSection}>
              <Text style={styles.drawerSectionTitle}>Hierarchy Information</Text>
              <View style={styles.drawerInfoRow}>
                <Text style={styles.drawerLabel}>Level</Text>
                <Text style={styles.drawerValue}>{emp?.hierarchy_level || 'Not Assigned'}</Text>
              </View>
              <View style={styles.drawerInfoRow}>
                <Text style={styles.drawerLabel}>Branch Head</Text>
                <Text style={styles.drawerValue}>{emp?.branch_head_name || 'N/A'}</Text>
              </View>
              <View style={styles.drawerInfoRow}>
                <Text style={styles.drawerLabel}>Senior Manager</Text>
                <Text style={styles.drawerValue}>{emp?.senior_manager_name || 'N/A'}</Text>
              </View>
              <View style={styles.drawerInfoRow}>
                <Text style={styles.drawerLabel}>Manager</Text>
                <Text style={styles.drawerValue}>{emp?.manager_name || 'N/A'}</Text>
              </View>
              <View style={styles.drawerInfoRow}>
                <Text style={styles.drawerLabel}>Team Leader</Text>
                <Text style={styles.drawerValue}>{emp?.team_leader_name || 'N/A'}</Text>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.drawerSection}>
              <View style={styles.drawerSectionHeader}>
                <Text style={styles.drawerSectionTitle}>Recent Activity</Text>
                <TouchableOpacity style={styles.viewAllBtn}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.activityTimeline}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Icon name="check" size={12} color="#059669" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Employee account activated</Text>
                    <Text style={styles.activitySubtitle}>by Super Admin</Text>
                  </View>
                  <View style={styles.activityTime}>
                    <Text style={styles.activityDate}>Oct 2, 2026</Text>
                    <Text style={styles.activityTimeText}>10:30 AM</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Icon name="file-text" size={12} color="#2563EB" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>KYC documents submitted</Text>
                    <Text style={styles.activitySubtitle}>by Employee</Text>
                  </View>
                  <View style={styles.activityTime}>
                    <Text style={styles.activityDate}>Oct 1, 2026</Text>
                    <Text style={styles.activityTimeText}>04:15 PM</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: '#F3E8FF' }]}>
                    <Icon name="user" size={12} color="#7C3AED" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Employee created</Text>
                    <Text style={styles.activitySubtitle}>by Super Admin</Text>
                  </View>
                  <View style={styles.activityTime}>
                    <Text style={styles.activityDate}>Sep 28, 2026</Text>
                    <Text style={styles.activityTimeText}>11:20 AM</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        );

      case 'kyc':
        return (
          <ScrollView style={styles.drawerScroll}>
            {/* KYC Approval Status Banner */}
            <View style={[styles.kycBanner, { 
              backgroundColor: emp?.activation_status === 'APPROVED' ? '#D1FAE5' : '#FEF3C7',
              borderColor: emp?.activation_status === 'APPROVED' ? '#A7F3D0' : '#FDE68A'
            }]}>
              <Text style={[styles.kycBannerText, { 
                color: emp?.activation_status === 'APPROVED' ? '#065F46' : '#92400E'
              }]}>
                KYC Approval Status: {emp?.activation_status === 'APPROVED' ? '✓ VERIFIED & APPROVED' : '⏳ PENDING SUPER ADMIN APPROVAL'}
              </Text>
              {emp?.activation_status !== 'APPROVED' && (
                <TouchableOpacity 
                  style={styles.approveKycBtn}
                  onPress={async () => {
                    try {
                      await verifyEmployeeKYC(emp.id, 'VERIFIED');
                      Alert.alert('Success', 'KYC approved and account activated');
                      fetchEmployee360(emp.id);
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Failed to approve KYC');
                    }
                  }}
                >
                  <Text style={styles.approveKycText}>✓ Approve KYC & Activate Account Now</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 360° Identity Form Fields */}
            <View style={styles.identitySection}>
              <Text style={styles.identitySectionTitle}>360° Profile & Identity Details</Text>
              
              <View style={styles.identityForm}>
                <View style={styles.identityRow}>
                  <Text style={styles.identityLabel}>Aadhaar Number</Text>
                  <TextInput
                    style={styles.identityInput}
                    value={identityFields.aadhaar_number}
                    onChangeText={(t) => setIdentityFields({ ...identityFields, aadhaar_number: t })}
                    placeholder="Enter Aadhaar number"
                  />
                </View>

                <View style={styles.identityRow}>
                  <Text style={styles.identityLabel}>PAN Number</Text>
                  <TextInput
                    style={styles.identityInput}
                    value={identityFields.pan_number}
                    onChangeText={(t) => setIdentityFields({ ...identityFields, pan_number: t })}
                    placeholder="Enter PAN number"
                  />
                </View>

                <View style={styles.identityRow}>
                  <Text style={styles.identityLabel}>Bank Account No.</Text>
                  <TextInput
                    style={styles.identityInput}
                    value={identityFields.bank_account}
                    onChangeText={(t) => setIdentityFields({ ...identityFields, bank_account: t })}
                    placeholder="Enter bank account number"
                  />
                </View>

                <View style={styles.identityRow}>
                  <Text style={styles.identityLabel}>IFSC Code</Text>
                  <TextInput
                    style={styles.identityInput}
                    value={identityFields.ifsc_code}
                    onChangeText={(t) => setIdentityFields({ ...identityFields, ifsc_code: t })}
                    placeholder="Enter IFSC code"
                  />
                </View>

                <View style={styles.identityRowFull}>
                  <Text style={styles.identityLabel}>Verification Notes / Inspection Remarks</Text>
                  <TextInput
                    style={[styles.identityInput, styles.identityTextarea]}
                    value={identityFields.admin_remarks}
                    onChangeText={(t) => setIdentityFields({ ...identityFields, admin_remarks: t })}
                    placeholder="Add KYC notes or verification remarks..."
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity 
                  style={styles.saveIdentityBtn}
                  onPress={async () => {
                    try {
                      setSavingIdentity(true);
                      await updateEmployeeIdentityDetails(emp.id, identityFields);
                      Alert.alert('Success', 'Identity details updated successfully!');
                      fetchEmployee360(emp.id);
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Failed to update identity details');
                    } finally {
                      setSavingIdentity(false);
                    }
                  }}
                  disabled={savingIdentity}
                >
                  {savingIdentity ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveIdentityText}>💾 Save Identity Details</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 360° Document Inspection */}
            <View style={styles.docInspectionSection}>
              <View style={styles.docInspectionHeader}>
                <Text style={styles.docInspectionTitle}>Required Documents Inspection</Text>
                <View style={styles.docCountBadge}>
                  <Text style={styles.docCountText}>5 Required Files</Text>
                </View>
              </View>
              
              {[
                { key: 'aadhaar', label: 'Aadhaar Card (Front & Back)', icon: 'id-card' },
                { key: 'pan', label: 'PAN Card', icon: 'file-text' },
                { key: 'bank', label: 'Bank Passbook / Cheque', icon: 'university' },
                { key: 'photo', label: 'Profile Photograph', icon: 'user' },
                { key: 'offer_letter', label: 'Signed Offer Letter', icon: 'briefcase' },
              ].map((doc) => {
                const status = docStatuses[doc.key] || { status: 'not_uploaded', reason: '', url: null };
                const statusColor = status.status === 'verified' ? '#10B981' : 
                                   status.status === 'rejected' ? '#EF4444' : 
                                   status.status === 'submitted' ? '#F59E0B' : '#9CA3AF';
                const isRejectingThis = rejectingDoc === doc.key;
                
                return (
                  <View key={doc.key} style={styles.docCard}>
                    <View style={styles.docHeader}>
                      <View style={styles.docTitleRow}>
                        <Icon name={doc.icon as any} size={18} color={colors.primary} />
                        <Text style={styles.docLabel}>{doc.label}</Text>
                      </View>
                      <View style={[styles.docStatusBadge, { 
                        backgroundColor: status.status === 'verified' ? '#D1FAE5' : 
                                       status.status === 'rejected' ? '#FEE2E2' : 
                                       status.status === 'submitted' ? '#FEF3C7' : '#F3F4F6',
                        borderColor: status.status === 'verified' ? '#A7F3D0' : 
                                     status.status === 'rejected' ? '#FCA5A5' : 
                                     status.status === 'submitted' ? '#FDE68A' : '#E5E7EB'
                      }]}>
                        <Text style={[styles.docStatusText, { 
                          color: status.status === 'verified' ? '#065F46' : 
                               status.status === 'rejected' ? '#991B1B' : 
                               status.status === 'submitted' ? '#92400E' : '#6B7280'
                        }]}>
                          {status.status === 'verified' ? 'Verified ✓' : 
                           status.status === 'rejected' ? 'Rejected ❌' : 
                           status.status === 'submitted' ? 'Submitted ⏳' : 'Not Uploaded ⚠️'}
                        </Text>
                      </View>
                    </View>
                    
                    {status.reason && (
                      <Text style={styles.docReason}>⚠️ Rejection Reason: {status.reason}</Text>
                    )}
                    
                    <View style={styles.docActions}>
                      {status.url && (
                        <TouchableOpacity 
                          style={styles.viewDocBtn}
                          onPress={() => setViewingDocModal({ key: doc.key, label: doc.label, url: status.url })}
                        >
                          <Icon name="eye" size={14} color="#2563EB" />
                          <Text style={styles.viewDocText}>View</Text>
                        </TouchableOpacity>
                      )}
                      
                      {status.status === 'submitted' && (
                        <>
                          <TouchableOpacity 
                            style={styles.approveDocBtn}
                            onPress={() => handleApproveDoc(doc.key)}
                          >
                            <Text style={styles.approveDocText}>✓ Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.rejectDocBtn}
                            onPress={() => {
                              if (isRejectingThis) {
                                setRejectingDoc(null);
                              } else {
                                setRejectingDoc(doc.key);
                                setRejectReason('');
                              }
                            }}
                          >
                            <Text style={styles.rejectDocText}>✕ Reject</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                    
                    {isRejectingThis && (
                      <View style={styles.rejectSection}>
                        <Text style={styles.rejectSectionTitle}>Specify Rejection Reason for {doc.label}:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetReasonsScroll}>
                          {['Blurry Image', 'Document Expired', 'Name Mismatch', 'Signature Missing', 'File Unreadable'].map((preset) => (
                            <TouchableOpacity
                              key={preset}
                              style={styles.presetReasonBtn}
                              onPress={() => setRejectReason(preset)}
                            >
                              <Text style={styles.presetReasonText}>{preset}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        <View style={styles.rejectInputRow}>
                          <TextInput
                            style={styles.rejectInput}
                            placeholder="Enter custom rejection reason..."
                            value={rejectReason}
                            onChangeText={setRejectReason}
                          />
                          <TouchableOpacity 
                            style={styles.rejectConfirmBtn}
                            onPress={() => {
                              if (!rejectReason.trim()) {
                                Alert.alert('Required', 'Please select or enter a rejection reason');
                                return;
                              }
                              handleRejectDoc(doc.key);
                            }}
                          >
                            <Text style={styles.rejectConfirmText}>Confirm</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        );

      case 'biometric':
        return (
          <ScrollView style={styles.drawerScroll}>
            <Text style={styles.drawerSectionTitle}>Face Biometric Verification</Text>

            {emp?.face_enrolled || emp?.face_verification_status === 'VERIFIED' ? (
              /* Enrolled & Verified Callout Box */
              <View style={[styles.biometricCallout, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
                <View style={styles.biometricCalloutHeader}>
                  <View style={[styles.biometricCalloutIcon, { backgroundColor: '#10B981' }]}>
                    <Icon name="check" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.biometricCalloutContent}>
                    <Text style={[styles.biometricCalloutTitle, { color: '#065F46' }]}>
                      Attendance Biometric Reference Enrolled & Locked
                    </Text>
                    <Text style={[styles.biometricCalloutSub, { color: '#047857' }]}>
                      Biometric Version: V1 | Enrolled Date: {emp?.activated_at ? new Date(emp.activated_at).toLocaleDateString() : 'Active'} | Status: <Text style={{ color: '#059669' }}>ACTIVE ✓</Text>
                    </Text>
                    <Text style={[styles.biometricCalloutNote, { color: '#065F46' }]}>
                      Your biometric reference is locked. Employees cannot replace it. Re-enrollment requires Super Admin authorization.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.reenrollBtn}
                  onPress={() => {
                    Alert.alert(
                      'Biometric Re-Enrollment',
                      `Request biometric reference re-enrollment for ${emp?.full_name}? The current face template will be locked until re-captured.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Request Re-Enrollment',
                          onPress: async () => {
                            try {
                              await sendReminder(emp.id);
                              Alert.alert('Success', 'Biometric re-enrollment notification sent to employee');
                            } catch (err: any) {
                              Alert.alert('Error', err.message || 'Failed to send notification');
                            }
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Icon name="lock" size={16} color="#FFFFFF" />
                  <Text style={styles.reenrollText}>🔒 Re-Enroll / Modify Biometric Reference</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Face Pending Callout Box */
              <View style={[styles.biometricCallout, { backgroundColor: '#FFF8F0', borderColor: '#FED7AA' }]}>
                <View style={styles.biometricCalloutHeader}>
                  <View style={[styles.biometricCalloutIcon, { backgroundColor: '#F59E0B' }]}>
                    <Icon name="exclamation-circle" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.biometricCalloutContent}>
                    <Text style={[styles.biometricCalloutTitle, { color: '#C2410C' }]}>Face Verification Pending</Text>
                    <Text style={[styles.biometricCalloutSub, { color: '#9A3412' }]}>
                      No authoritative face biometric reference captured yet.
                    </Text>
                  </View>
                </View>
                <View style={styles.biometricPendingActions}>
                  <TouchableOpacity 
                    style={styles.sendReminderBtn}
                    onPress={async () => {
                      try {
                        await sendReminder(emp.id);
                        Alert.alert('Success', 'Reminder sent successfully');
                      } catch (err: any) {
                        Alert.alert('Error', err.message || 'Failed to send reminder');
                      }
                    }}
                  >
                    <Icon name="bell" size={16} color="#FFFFFF" />
                    <Text style={styles.sendReminderText}>🔔 Send Reminder</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.completeVerificationBtn}
                    onPress={() => {
                      Alert.alert(
                        'Complete Face Verification',
                        `Mark face verification as completed for ${emp?.full_name}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Approve & Verify',
                            onPress: async () => {
                              try {
                                await verifyEmployeeKYC(emp.id, 'VERIFIED');
                                Alert.alert('Success', 'Face verification completed successfully');
                                fetchEmployee360(emp.id);
                              } catch (err: any) {
                                Alert.alert('Error', err.message || 'Failed to complete verification');
                              }
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.completeVerificationText}>Complete Verification</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Side by Side Reference Grid */}
            <View style={styles.faceRefGrid}>
              {/* Captured Face Photo */}
              <View style={styles.faceRefCard}>
                <Text style={styles.faceRefCardTitle}>Captured Profile Image</Text>
                <View style={styles.faceImageContainer}>
                  {emp?.profile_photo_url ? (
                    <Image source={{ uri: emp.profile_photo_url }} style={styles.faceImgPreview} resizeMode="cover" />
                  ) : (
                    <View style={styles.faceImagePlaceholder}>
                      <Icon name="user" size={36} color="#64748B" />
                      <Text style={styles.faceImageText}>Captured Face Image</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Employee Face Reference Box */}
              <View style={styles.faceRefCard}>
                <Text style={styles.faceRefCardTitle}>Biometric Reference Template</Text>
                <View style={[styles.faceImageContainer, { 
                  borderColor: emp?.face_enrolled ? '#86EFAC' : '#CBD5E1',
                  backgroundColor: emp?.face_enrolled ? '#F0FDF4' : '#F8FAFC'
                }]}>
                  {emp?.face_enrolled ? (
                    emp?.face_reference_url ? (
                      <Image source={{ uri: emp.face_reference_url }} style={styles.faceImgPreview} resizeMode="cover" />
                    ) : (
                      <View style={styles.faceEnrolledBox}>
                        <Icon name="check-circle" size={28} color="#059669" />
                        <Text style={styles.faceEnrolledTitle}>Face Reference Enrolled</Text>
                        <Text style={styles.faceEnrolledSub}>Biometric active and locked for attendance.</Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.faceImagePlaceholder}>
                      <View style={[styles.faceRefIcon, { borderColor: '#94A3B8' }]}>
                        <Text style={{ fontSize: 24, color: '#64748B' }}>🔲</Text>
                      </View>
                      <Text style={[styles.faceImageText, { color: '#64748B' }]}>
                        No face biometric reference available yet.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Bottom Info Banner Callout */}
            <View style={styles.infoBanner}>
              <Icon name="info" size={16} color="#2563EB" />
              <Text style={styles.infoBannerText}>
                This photo will be used to create the biometric reference for attendance face matching. It is separate from the profile photo.
              </Text>
            </View>
          </ScrollView>
        );

      case 'team':
        return (
          <ScrollView style={styles.drawerScroll}>
            {/* Department & Bank Access Card */}
            <View style={styles.accessCard}>
              <View>
                <Text style={styles.accessCardLabel}>Department & Bank Access</Text>
                <Text style={styles.accessCardValue}>{emp?.department || 'Sales & Support'}</Text>
              </View>
              <TouchableOpacity style={styles.manageBtn} onPress={() => openDeptModal(emp)}>
                <Text style={styles.manageBtnText}>Manage Depts</Text>
              </TouchableOpacity>
            </View>

            {/* Reporting Hierarchy Card */}
            <View style={styles.accessCard}>
              <View>
                <Text style={styles.accessCardLabel}>Reporting Hierarchy</Text>
                <Text style={styles.accessCardValue}>Manager: <Text style={{ fontWeight: '800' }}>{emp?.manager_name || 'Direct Super Admin'}</Text></Text>
                <Text style={styles.accessCardValue}>Designation: <Text style={{ fontWeight: '800' }}>{emp?.designation || 'Telecaller'}</Text></Text>
              </View>
              <TouchableOpacity 
                style={styles.manageBtn}
                onPress={() => openHierarchyModal(emp)}
              >
                <Text style={styles.manageBtnText}>Assign Team</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case 'attendance':
        return (
          <ScrollView style={styles.drawerScroll}>
            {/* Attendance Access & Biometric Status Card */}
            <View style={styles.attendanceAccessCard}>
              <View>
                <Text style={styles.attendanceAccessLabel}>Attendance Access & Biometric Status</Text>
                <Text style={[styles.attendanceAccessValue, { 
                  color: (emp?.face_verification_status === 'VERIFIED' || emp?.biometric_enrolled) ? '#059669' : '#DC2626'
                }]}>
                  {(emp?.face_verification_status === 'VERIFIED' || emp?.biometric_enrolled) ? '✓ ENABLED (Face Registered)' : '🔒 RESTRICTED (Face Reference Missing)'}
                </Text>
              </View>
              <TouchableOpacity style={styles.biometricSettingsBtn} onPress={() => setDrawerTab('biometric')}>
                <Text style={styles.biometricSettingsText}>⚙ Biometric Settings</Text>
              </TouchableOpacity>
            </View>

            {/* Month & Year Filter Bar */}
            <View style={styles.monthFilterBar}>
              <View style={styles.monthFilterLabel}>
                <Icon name="calendar" size={16} color={colors.text} />
                <Text style={styles.monthFilterText}>Monthly Attendance Overview</Text>
              </View>
              <View style={styles.monthFilterSelectors}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthDropdownScroll}>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                    <TouchableOpacity
                      key={idx + 1}
                      style={[styles.monthDropdownItem, attendanceMonth === idx + 1 && styles.monthDropdownItemActive]}
                      onPress={() => {
                        setAttendanceMonth(idx + 1);
                        fetchAttendance(emp.id);
                      }}
                    >
                      <Text style={[styles.monthDropdownText, attendanceMonth === idx + 1 && styles.monthDropdownTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearDropdownScroll}>
                  {[2026, 2025, 2024].map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.yearDropdownItem, attendanceYear === y && styles.yearDropdownItemActive]}
                      onPress={() => {
                        setAttendanceYear(y);
                        fetchAttendance(emp.id);
                      }}
                    >
                      <Text style={[styles.yearDropdownText, attendanceYear === y && styles.yearDropdownTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Summary Metrics Cards */}
            {attendanceData?.summary && (
              <View style={styles.attendanceSummaryCards}>
                <View style={[styles.attSummaryCard, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}>
                  <Text style={[styles.attSummaryLabel, { color: '#065F46' }]}>PRESENT</Text>
                  <Text style={[styles.attSummaryValue, { color: '#047857' }]}>{attendanceData.summary.totalPresent || 0}</Text>
                </View>
                <View style={[styles.attSummaryCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                  <Text style={[styles.attSummaryLabel, { color: '#92400E' }]}>LATE</Text>
                  <Text style={[styles.attSummaryValue, { color: '#D97706' }]}>{attendanceData.summary.totalLate || 0}</Text>
                </View>
                <View style={[styles.attSummaryCard, { backgroundColor: '#FFEDD5', borderColor: '#FED7AA' }]}>
                  <Text style={[styles.attSummaryLabel, { color: '#9A3412' }]}>HALF DAY</Text>
                  <Text style={[styles.attSummaryValue, { color: '#C2410C' }]}>{attendanceData.summary.totalHalfDay || 0}</Text>
                </View>
                <View style={[styles.attSummaryCard, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                  <Text style={[styles.attSummaryLabel, { color: '#991B1B' }]}>ABSENT / LEAVE</Text>
                  <Text style={[styles.attSummaryValue, { color: '#DC2626' }]}>
                    {(attendanceData.summary.totalAbsent || 0) + (attendanceData.summary.totalLeave || 0)}
                  </Text>
                </View>
              </View>
            )}

            {/* Total Working Hours Bar */}
            {attendanceData?.summary && (
              <View style={styles.workingHoursBar}>
                <Text style={styles.workingHoursLabel}>⏱ Total Hours Logged this Month:</Text>
                <Text style={styles.workingHoursValue}>{attendanceData.summary.totalWorkingHoursFormatted || '0h 0m'}</Text>
              </View>
            )}

            {/* Detailed Daily Attendance Breakdown */}
            <Text style={styles.dailyBreakdownTitle}>Detailed Daily Attendance Breakdown</Text>

            {!attendanceData?.records || attendanceData.records.length === 0 ? (
              <View style={styles.noDailyRecords}>
                <Icon name="calendar" size={32} color={colors.textLight} />
                <Text style={styles.noDailyRecordsText}>📅 No attendance records found for this month.</Text>
              </View>
            ) : (
              <View style={styles.dailyRecordsList}>
                {attendanceData.records.map((rec: any) => {
                  const dateObj = new Date(rec.attendance_date);
                  const dateFormatted = isNaN(dateObj.getTime()) ? rec.attendance_date : dateObj.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                  
                  const checkInFmt = rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
                  const checkOutFmt = rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : (rec.check_in_time ? '⏳ In Progress' : 'N/A');

                  let duration = 'N/A';
                  if (rec.check_in_time) {
                    const startMs = new Date(rec.check_in_time).getTime();
                    const endMs = rec.check_out_time ? new Date(rec.check_out_time).getTime() : Date.now();
                    if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
                      const totalMins = Math.floor((endMs - startMs) / 60000);
                      duration = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m${!rec.check_out_time ? ' (Active)' : ''}`;
                    }
                  }

                  const statusColors: any = {
                    PRESENT: { bg: '#D1FAE5', color: '#065F46', label: '✓ PRESENT' },
                    LATE: { bg: '#FEF3C7', color: '#92400E', label: '⚠️ LATE' },
                    HALF_DAY: { bg: '#FFEDD5', color: '#C2410C', label: '🌗 HALF DAY' },
                    LEAVE: { bg: '#F3E8FF', color: '#6B21A8', label: '🏖 LEAVE' },
                    ABSENT: { bg: '#FEE2E2', color: '#991B1B', label: '✕ ABSENT' },
                  };
                  const st = statusColors[rec.attendance_status] || { bg: '#F3F4F6', color: '#374151', label: rec.attendance_status || 'NOT MARKED' };

                  return (
                    <View key={rec.attendance_id || rec.attendance_date} style={styles.dailyRecordCard}>
                      {/* Top Bar: Date & Status */}
                      <View style={styles.dailyRecordHeader}>
                        <Text style={styles.dailyRecordDate}>📅 {dateFormatted}</Text>
                        <View style={[styles.dailyRecordStatus, { backgroundColor: st.bg }]}>
                          <Text style={[styles.dailyRecordStatusText, { color: st.color }]}>{st.label}</Text>
                        </View>
                      </View>

                      {/* Time & Duration Grid */}
                      <View style={styles.dailyRecordTimeGrid}>
                        <View style={styles.timeGridItem}>
                          <Text style={styles.timeGridLabel}>Check-In</Text>
                          <Text style={styles.timeGridValue}>{checkInFmt}</Text>
                        </View>
                        <View style={styles.timeGridItem}>
                          <Text style={styles.timeGridLabel}>Check-Out</Text>
                          <Text style={styles.timeGridValue}>{checkOutFmt}</Text>
                        </View>
                        <View style={styles.timeGridItem}>
                          <Text style={styles.timeGridLabel}>Work Duration</Text>
                          <Text style={[styles.timeGridValue, { color: colors.primary }]}>{duration}</Text>
                        </View>
                      </View>

                      {/* Audit & Verification Badges */}
                      <View style={styles.dailyRecordAudit}>
                        <View style={styles.auditBadges}>
                          <Text style={styles.auditBadge}>🔒 Ref: <Text style={{ fontWeight: '800' }}>{rec.verification_reference || 'N/A'}</Text></Text>
                          <Text style={styles.auditBadge}>📍 Location: <Text style={{ fontWeight: '800' }}>{rec.matched_environment_code || 'OFFICE'}</Text></Text>
                          <Text style={styles.auditBadge}>📱 Channel: <Text style={{ fontWeight: '800' }}>{rec.source || 'WEB'}</Text></Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.inspectDetailsBtn}
                          onPress={() => setSelectedDayAttendance(rec)}
                        >
                          <Text style={styles.inspectDetailsText}>Inspect Full Day Details →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        );

      case 'actions':
        return (
          <ScrollView style={styles.drawerScroll}>
            <Text style={styles.drawerSectionTitle}>Administrative & Operational Actions</Text>

            {/* Action Cards Grid */}
            <View style={styles.actionsGrid}>
              {/* Manage Depts */}
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => openDeptModal(emp)}
              >
                <View style={[styles.actionCardIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <Icon name="building" size={20} color={colors.primary} />
                </View>
                <View style={styles.actionCardContent}>
                  <Text style={styles.actionCardTitle}>Manage Depts</Text>
                  <Text style={styles.actionCardSub}>Assign bank & department access</Text>
                </View>
              </TouchableOpacity>

              {/* Manage Bonus */}
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: '#F59E0B08', borderColor: '#F59E0B30' }]}
                onPress={() => openBonusModal(emp)}
              >
                <View style={[styles.actionCardIcon, { backgroundColor: '#F59E0B20' }]}>
                  <Icon name="dollar-sign" size={20} color="#B45309" />
                </View>
                <View style={styles.actionCardContent}>
                  <Text style={styles.actionCardTitle}>Manage Bonus</Text>
                  <Text style={styles.actionCardSub}>Set card targets & bonus rates</Text>
                </View>
              </TouchableOpacity>

              {/* 360 View */}
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: '#3B82F608', borderColor: '#3B82F630' }]}
                onPress={() => setDrawerTab('overview')}
              >
                <View style={[styles.actionCardIcon, { backgroundColor: '#3B82F620' }]}>
                  <Icon name="eye" size={20} color="#2563EB" />
                </View>
                <View style={styles.actionCardContent}>
                  <Text style={styles.actionCardTitle}>360 View</Text>
                  <Text style={styles.actionCardSub}>Inspect KYC, links & profile 360</Text>
                </View>
              </TouchableOpacity>

              {/* Assign Team */}
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: '#8B5CF608', borderColor: '#8B5CF630' }]}
                onPress={() => openHierarchyModal(emp)}
              >
                <View style={[styles.actionCardIcon, { backgroundColor: '#8B5CF620' }]}>
                  <Icon name="git-branch" size={20} color="#7C3AED" />
                </View>
                <View style={styles.actionCardContent}>
                  <Text style={styles.actionCardTitle}>Assign Team</Text>
                  <Text style={styles.actionCardSub}>Set reporting hierarchy & team</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Additional Action Buttons */}
            <View style={styles.additionalActions}>
              <TouchableOpacity 
                style={styles.actionRowBtn}
                onPress={() => {
                  setDrawerTab('overview');
                  setEditForm({
                    full_name: emp?.full_name || '',
                    mobile_number: emp?.mobile_number || '',
                    email_id: emp?.email_id || '',
                    designation: emp?.designation || '',
                    department: emp?.department || '',
                  });
                  setEditingEmployee(true);
                }}
              >
                <Icon name="edit-2" size={20} color="#4F46E5" />
                <View style={styles.actionRowContent}>
                  <Text style={styles.actionRowTitle}>Edit Employee Details</Text>
                  <Text style={styles.actionRowSub}>Update designation, department, contact & manager</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionRowBtn}
                onPress={async () => {
                  try {
                    await sendKYCReverificationLink(emp.id);
                    Alert.alert('Success', 'KYC re-verification link sent');
                  } catch (err: any) {
                    Alert.alert('Error', err.message || 'Failed to send KYC link');
                  }
                }}
              >
                <Icon name="envelope" size={20} color={colors.primary} />
                <View style={styles.actionRowContent}>
                  <Text style={styles.actionRowTitle}>Send KYC Re-verification Link</Text>
                  <Text style={styles.actionRowSub}>Notify employee via in-app alert, SMS & WhatsApp</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionRowBtn}
                onPress={() => setCredentialsModalEmp(emp)}
              >
                <Icon name="key" size={20} color="#F59E0B" />
                <View style={styles.actionRowContent}>
                  <Text style={styles.actionRowTitle}>Send / Reset Login Credentials</Text>
                  <Text style={styles.actionRowSub}>Generate temporary password and send via WhatsApp/SMS</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionRowBtn}
                onPress={async () => {
                  try {
                    await downloadProfileSummary(emp.id);
                    Alert.alert('Success', 'Profile summary downloaded');
                  } catch (err: any) {
                    Alert.alert('Error', err.message || 'Failed to download profile summary');
                  }
                }}
              >
                <Icon name="file-text" size={20} color="#10B981" />
                <View style={styles.actionRowContent}>
                  <Text style={styles.actionRowTitle}>Download Official Profile Summary</Text>
                  <Text style={styles.actionRowSub}>Export comprehensive employee record text file</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionRowBtn, { 
                  backgroundColor: emp?.activation_status === 'APPROVED' ? '#FEF2F2' : '#F0FDF4',
                  borderColor: emp?.activation_status === 'APPROVED' ? '#FCA5A5' : '#86EFAC'
                }]}
                onPress={async () => {
                  try {
                    await toggleEmployeeStatus(emp.id);
                    Alert.alert('Success', 'Employee status toggled');
                    fetchEmployee360(emp.id);
                  } catch (err: any) {
                    Alert.alert('Error', err.message || 'Failed to toggle status');
                  }
                }}
              >
                <Icon name={emp?.activation_status === 'APPROVED' ? 'lock' : 'check'} size={20} color={emp?.activation_status === 'APPROVED' ? '#EF4444' : '#10B981'} />
                <View style={styles.actionRowContent}>
                  <Text style={[styles.actionRowTitle, { 
                    color: emp?.activation_status === 'APPROVED' ? '#DC2626' : '#166534'
                  }]}>
                    {emp?.activation_status === 'APPROVED' ? 'Suspend Employee Account' : 'Activate Employee Account'}
                  </Text>
                  <Text style={styles.actionRowSub}>
                    {emp?.activation_status === 'APPROVED' ? 'Revoke login access and mark account suspended' : 'Grant active portal login access'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
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

      {/* Action Required Filter (Only for Employees Tab) */}
      {activeTab === 'employees' && (
        <View style={styles.pillsScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
            <TouchableOpacity
              style={[styles.pill, actionRequiredFilter === '' && styles.activePill]}
              onPress={() => setActionRequiredFilter('')}
            >
              <Text style={[styles.pillText, actionRequiredFilter === '' && styles.activePillText]}>All Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, actionRequiredFilter === 'face_missing' && styles.activePill]}
              onPress={() => setActionRequiredFilter('face_missing')}
            >
              <Text style={[styles.pillText, actionRequiredFilter === 'face_missing' && styles.activePillText]}>⚠️ Face Missing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, actionRequiredFilter === 'kyc_pending' && styles.activePill]}
              onPress={() => setActionRequiredFilter('kyc_pending')}
            >
              <Text style={[styles.pillText, actionRequiredFilter === 'kyc_pending' && styles.activePillText]}>⚠️ KYC Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, actionRequiredFilter === 'docs_missing' && styles.activePill]}
              onPress={() => setActionRequiredFilter('docs_missing')}
            >
              <Text style={[styles.pillText, actionRequiredFilter === 'docs_missing' && styles.activePillText]}>⚠️ Docs Missing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, actionRequiredFilter === 'activation_pending' && styles.activePill]}
              onPress={() => setActionRequiredFilter('activation_pending')}
            >
              <Text style={[styles.pillText, actionRequiredFilter === 'activation_pending' && styles.activePillText]}>⚠️ Activation Pending</Text>
            </TouchableOpacity>
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
                    <TouchableOpacity onPress={() => openEmployeeDrawer(emp)}>
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
                    </TouchableOpacity>

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

      {/* Employee 360 Drawer Modal */}
      <Modal visible={employeeDrawerVisible} animationType="slide" transparent onRequestClose={() => setEmployeeDrawerVisible(false)}>
        <View style={styles.drawerBackdrop}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerTitle}>Employee 360°</Text>
                <Text style={styles.drawerSubtitle}>{selectedEmployee?.full_name}</Text>
              </View>
              <TouchableOpacity onPress={() => setEmployeeDrawerVisible(false)}>
                <Icon name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Drawer Tabs */}
            <View style={styles.drawerTabs}>
              {[
                { key: 'overview', label: 'Overview', icon: 'activity' },
                { key: 'kyc', label: 'KYC Details', icon: 'file-text' },
                { key: 'biometric', label: 'Face Verification', icon: 'user-shield' },
                { key: 'team', label: 'Access & Team', icon: 'users' },
                { key: 'attendance', label: 'Attendance', icon: 'calendar' },
                { key: 'actions', label: 'Actions', icon: 'bolt' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.drawerTab, drawerTab === tab.key && styles.drawerTabActive]}
                  onPress={() => setDrawerTab(tab.key as any)}
                >
                  <Icon name={tab.icon as any} size={16} color={drawerTab === tab.key ? colors.primary : colors.textLight} />
                  <Text style={[styles.drawerTabText, drawerTab === tab.key && styles.drawerTabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Drawer Content */}
            <View style={styles.drawerBody}>
              {renderDrawerContent()}
            </View>
          </View>
        </View>
      </Modal>

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

      {/* 1. Document Inspection Modal */}
      <Modal visible={!!viewingDocModal} transparent animationType="fade" onRequestClose={() => setViewingDocModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '90%', padding: spacing.md }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>📄 Document Inspection</Text>
                <Text style={styles.modalSub}>{viewingDocModal?.label}</Text>
              </View>
              <TouchableOpacity onPress={() => setViewingDocModal(null)} style={styles.modalCloseBtn}>
                <Icon name="x" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.docPreviewContainer}>
              {viewingDocModal?.url ? (
                <Image
                  source={{ uri: viewingDocModal.url }}
                  style={styles.docPreviewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.docPreviewEmpty}>
                  <Icon name="file-text" size={48} color={colors.textLight} />
                  <Text style={styles.docPreviewEmptyText}>Document file not uploaded or unavailable.</Text>
                </View>
              )}
            </View>

            <View style={styles.docModalFooter}>
              {viewingDocModal?.url && (
                <TouchableOpacity
                  style={styles.docOpenExternalBtn}
                  onPress={() => {
                    if (viewingDocModal?.url) {
                      Linking.openURL(viewingDocModal.url).catch(() => {
                        Alert.alert('Error', 'Unable to open document in browser');
                      });
                    }
                  }}
                >
                  <Icon name="eye" size={14} color="#fff" />
                  <Text style={styles.docOpenExternalText}>Open Full Size</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.docCloseBtn}
                onPress={() => setViewingDocModal(null)}
              >
                <Text style={styles.docCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Full Day Attendance Details Modal */}
      <Modal visible={!!selectedDayAttendance} transparent animationType="fade" onRequestClose={() => setSelectedDayAttendance(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '90%', padding: spacing.md }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>📅 Attendance Audit Log</Text>
                <Text style={styles.modalSub}>
                  {selectedDayAttendance?.attendance_date ? new Date(selectedDayAttendance.attendance_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Day Details'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDayAttendance(null)} style={styles.modalCloseBtn}>
                <Icon name="x" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Day Metrics Row */}
              <View style={styles.auditTimeGrid}>
                <View style={styles.auditTimeCard}>
                  <Text style={styles.auditTimeLabel}>Check-In Timestamp</Text>
                  <Text style={styles.auditTimeValue}>
                    {selectedDayAttendance?.check_in_time ? new Date(selectedDayAttendance.check_in_time).toLocaleString('en-IN') : 'N/A'}
                  </Text>
                </View>
                <View style={styles.auditTimeCard}>
                  <Text style={styles.auditTimeLabel}>Check-Out Timestamp</Text>
                  <Text style={styles.auditTimeValue}>
                    {selectedDayAttendance?.check_out_time ? new Date(selectedDayAttendance.check_out_time).toLocaleString('en-IN') : (selectedDayAttendance?.check_in_time ? '⏳ In Progress' : 'N/A')}
                  </Text>
                </View>
              </View>

              {/* Technical Audit Log */}
              <View style={styles.auditTechnicalBox}>
                <View style={styles.auditTechnicalHeader}>
                  <Icon name="shield" size={14} color={colors.teal} />
                  <Text style={styles.auditTechnicalTitle}>Security & Verification Audit</Text>
                </View>

                <View style={styles.auditTechnicalGrid}>
                  <View style={styles.auditTechnicalRow}>
                    <Text style={styles.auditTechLabel}>Verification Ref:</Text>
                    <Text style={styles.auditTechValue}>{selectedDayAttendance?.verification_reference || 'N/A'}</Text>
                  </View>
                  <View style={styles.auditTechnicalRow}>
                    <Text style={styles.auditTechLabel}>Verification Status:</Text>
                    <Text style={[styles.auditTechValue, { color: '#059669' }]}>{selectedDayAttendance?.verification_status || 'VERIFIED'}</Text>
                  </View>
                  <View style={styles.auditTechnicalRow}>
                    <Text style={styles.auditTechLabel}>Face Match Status:</Text>
                    <Text style={[styles.auditTechValue, { color: '#059669' }]}>{selectedDayAttendance?.face_status || 'PASSED'}</Text>
                  </View>
                  <View style={styles.auditTechnicalRow}>
                    <Text style={styles.auditTechLabel}>Liveness Check:</Text>
                    <Text style={[styles.auditTechValue, { color: '#059669' }]}>{selectedDayAttendance?.liveness_status || 'PASSED'}</Text>
                  </View>
                  <View style={styles.auditTechnicalRow}>
                    <Text style={styles.auditTechLabel}>Environment Status:</Text>
                    <Text style={styles.auditTechValue}>{selectedDayAttendance?.environment_status || 'MATCHED'}</Text>
                  </View>
                  <View style={styles.auditTechnicalRow}>
                    <Text style={styles.auditTechLabel}>Location Code:</Text>
                    <Text style={styles.auditTechValue}>{selectedDayAttendance?.matched_environment_code || 'OFFICE_HQ'}</Text>
                  </View>
                  <View style={styles.auditTechnicalRow}>
                    <Text style={styles.auditTechLabel}>Channel / Source:</Text>
                    <Text style={styles.auditTechValue}>{selectedDayAttendance?.source || 'WEB'}</Text>
                  </View>
                  <View style={styles.auditTechnicalRow}>
                    <Text style={styles.auditTechLabel}>Attendance Result:</Text>
                    <Text style={[styles.auditTechValue, { fontWeight: '900', color: colors.primary }]}>{selectedDayAttendance?.attendance_status || 'PRESENT'}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.auditCloseBtn}
              onPress={() => setSelectedDayAttendance(null)}
            >
              <Text style={styles.auditCloseText}>Close Audit Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Manage Departments / Banks Assignment Modal */}
      <Modal visible={deptModalVisible} transparent animationType="slide" onRequestClose={() => setDeptModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Manage Depts & Banks</Text>
                <Text style={styles.modalSub}>
                  Employee: <Text style={{ color: colors.primary, fontWeight: '800' }}>{deptModalEmp?.full_name}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDeptModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="x" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Assigned Departments / Banks</Text>

            {loadingDepts ? (
              <View style={styles.deptLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.deptLoadingText}>Loading bank departments...</Text>
              </View>
            ) : (
              <ScrollView style={styles.deptBanksList} showsVerticalScrollIndicator={false}>
                {deptBanksList.map((bank: any) => {
                  const isChecked = selectedBankIds.includes(bank.bank_id);
                  return (
                    <TouchableOpacity
                      key={bank.bank_id}
                      style={[
                        styles.deptBankRow,
                        isChecked && styles.deptBankRowChecked
                      ]}
                      onPress={() => {
                        if (isChecked) {
                          setSelectedBankIds((prev) => prev.filter((id) => id !== bank.bank_id));
                        } else {
                          setSelectedBankIds((prev) => [...prev, bank.bank_id]);
                        }
                      }}
                    >
                      <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareChecked]}>
                        {isChecked && <Icon name="check" size={12} color="#fff" />}
                      </View>
                      <Text style={[styles.deptBankName, isChecked && styles.deptBankNameChecked]}>
                        {bank.bank_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeptModalVisible(false)}
                disabled={savingDepts}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveDeptAssignments}
                disabled={savingDepts}
              >
                {savingDepts ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Save Assignments</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Manage Bonus & Targets Modal */}
      <Modal visible={bonusModalVisible} transparent animationType="slide" onRequestClose={() => setBonusModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '92%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Manage Bonus & Targets</Text>
                <Text style={styles.modalSub}>Configure targets, date period & bonus per card</Text>
              </View>
              <TouchableOpacity onPress={() => setBonusModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="x" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Form Card */}
              <View style={styles.bonusFormCard}>
                <Text style={styles.bonusFormHeader}>🎯 Create Target & Bonus Rule</Text>

                {/* Employee Selector */}
                <Text style={styles.inputLabel}>Employee</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bonusPickerScroll}>
                  {employees.slice(0, 10).map((e: any) => (
                    <TouchableOpacity
                      key={e.id}
                      style={[
                        styles.bonusPickerPill,
                        bonusForm.employee_id === e.id && styles.bonusPickerPillActive,
                      ]}
                      onPress={() => {
                        setBonusForm({ ...bonusForm, employee_id: e.id });
                        loadEmployeeAssignedBanks(e.id);
                      }}
                    >
                      <Text style={[styles.bonusPickerText, bonusForm.employee_id === e.id && styles.bonusPickerTextActive]}>
                        {e.full_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Bank Department Selector */}
                <Text style={styles.inputLabel}>Department / Bank</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bonusPickerScroll}>
                  {bonusEmployeeBanks.length > 0 ? (
                    bonusEmployeeBanks.map((b: any) => (
                      <TouchableOpacity
                        key={b.bank_id}
                        style={[
                          styles.bonusPickerPill,
                          bonusForm.bank_id === b.bank_id && styles.bonusPickerPillActive,
                        ]}
                        onPress={() => setBonusForm({ ...bonusForm, bank_id: b.bank_id })}
                      >
                        <Text style={[styles.bonusPickerText, bonusForm.bank_id === b.bank_id && styles.bonusPickerTextActive]}>
                          {b.bank_name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.bonusNoBanksText}>No banks assigned. Bank will auto-assign.</Text>
                  )}
                </ScrollView>

                <View style={styles.bonusRow2}>
                  <View style={{ flex: 1, marginRight: spacing.xs }}>
                    <Text style={styles.inputLabel}>Target Cards *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={bonusForm.target_count}
                      onChangeText={(t) => setBonusForm({ ...bonusForm, target_count: t })}
                      keyboardType="numeric"
                      placeholder="10"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.xs }}>
                    <Text style={styles.inputLabel}>Bonus/Card (₹) *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={bonusForm.bonus_per_card}
                      onChangeText={(t) => setBonusForm({ ...bonusForm, bonus_per_card: t })}
                      keyboardType="numeric"
                      placeholder="500"
                    />
                  </View>
                </View>

                <View style={styles.bonusRow2}>
                  <View style={{ flex: 1, marginRight: spacing.xs }}>
                    <Text style={styles.inputLabel}>From Date (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={bonusForm.start_date}
                      onChangeText={(t) => setBonusForm({ ...bonusForm, start_date: t })}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.xs }}>
                    <Text style={styles.inputLabel}>To Date (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={bonusForm.end_date}
                      onChangeText={(t) => setBonusForm({ ...bonusForm, end_date: t })}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.bonusSaveBtn}
                  onPress={handleSaveBonusRule}
                  disabled={savingRule}
                >
                  {savingRule ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.bonusSaveBtnText}>Assign Target & Bonus</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Existing Rules List */}
              <Text style={styles.bonusRulesTitle}>Existing Active Rules</Text>
              {loadingRules ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
              ) : bonusRulesList.length === 0 ? (
                <Text style={styles.bonusNoRulesText}>No bonus rules created yet.</Text>
              ) : (
                bonusRulesList.map((rule: any) => (
                  <View key={rule.id} style={styles.bonusRuleItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bonusRuleEmployee}>{rule.employee_name || 'Staff'}</Text>
                      <Text style={styles.bonusRuleSub}>
                        Bank: {rule.bank_name || 'All'} | Target: {rule.target_count} cards | Bonus: ₹{rule.bonus_per_card}/card
                      </Text>
                      <Text style={styles.bonusRuleDates}>
                        Period: {rule.start_date} to {rule.end_date}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteBonusRule(rule.id)}
                      style={styles.bonusDeleteBtn}
                    >
                      <Icon name="trash" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 5. Send / Reset Login Credentials Modal */}
      <Modal visible={!!credentialsModalEmp} transparent animationType="fade" onRequestClose={() => setCredentialsModalEmp(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '90%', padding: spacing.md }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>🔑 Send Login Credentials</Text>
                <Text style={styles.modalSub}>
                  Recipient: <Text style={{ color: colors.primary, fontWeight: '800' }}>{credentialsModalEmp?.full_name}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCredentialsModalEmp(null)} style={styles.modalCloseBtn}>
                <Icon name="x" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Employee Code / Username</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: '#F1F5F9' }]}
                editable={false}
                value={credentialsModalEmp?.employee_code || credentialsModalEmp?.employee_id || credentialsModalEmp?.id || 'EMP10001'}
              />

              <Text style={styles.inputLabel}>Temporary Password</Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  value={credentialsTempPassword}
                  onChangeText={setCredentialsTempPassword}
                />
                <TouchableOpacity
                  style={styles.autoGenBtn}
                  onPress={() => setCredentialsTempPassword(`Pass#${Math.floor(1000 + Math.random() * 9000)}`)}
                >
                  <Text style={styles.autoGenText}>🎲 Auto</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.inputLabel}>Message Template Preview:</Text>
                {credentialsCopied && <Text style={{ fontSize: 11, color: '#059669', fontWeight: '800' }}>✓ Copied!</Text>}
              </View>

              <TextInput
                style={styles.templatePreviewInput}
                multiline
                numberOfLines={6}
                editable={false}
                value={getCredentialMessageTemplate(credentialsModalEmp, credentialsTempPassword)}
              />

              {/* Action Buttons */}
              <View style={styles.credentialsActionsGrid}>
                <TouchableOpacity
                  style={styles.credSmsBtn}
                  onPress={() => {
                    handleSendSmsCredentials(credentialsModalEmp, credentialsTempPassword);
                  }}
                >
                  <Icon name="message-square" size={16} color="#fff" />
                  <Text style={styles.credBtnText}>Send via SMS</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.credWhatsAppBtn}
                  onPress={() => {
                    handleSendWhatsAppCredentials(credentialsModalEmp, credentialsTempPassword);
                  }}
                >
                  <Icon name="phone" size={16} color="#fff" />
                  <Text style={styles.credBtnText}>Send WhatsApp</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.credCancelBtn}
                onPress={() => setCredentialsModalEmp(null)}
              >
                <Text style={styles.credCancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
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
  // Employee 360 Drawer Styles
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  drawerSubtitle: {
    fontSize: 13,
    color: colors.textMid,
    marginTop: 2,
  },
  drawerTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  drawerTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  drawerTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  drawerTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  drawerTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  drawerBody: {
    flex: 1,
    padding: spacing.lg,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  drawerLoadingText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textMid,
  },
  drawerSection: {
    marginBottom: spacing.lg,
  },
  drawerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  drawerHeaderActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  actionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  statusCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusCardLabel: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusCardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusCardIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  statusCardSub: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  viewAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  activityTimeline: {
    gap: 14,
  },
  activityItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  activitySubtitle: {
    fontSize: 11,
    color: colors.textLight,
  },
  activityTime: {
    alignItems: 'flex-end',
  },
  activityDate: {
    fontSize: 11,
    color: colors.textLight,
  },
  activityTimeText: {
    fontSize: 11,
    color: colors.textLight,
  },
  drawerSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  drawerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  drawerLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
  },
  drawerValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  activeText: {
    color: '#10B981',
  },
  editRow: {
    marginBottom: spacing.sm,
  },
  editInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
  },
  editCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMid,
  },
  editSaveBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  editSaveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Document Verification Styles
  docCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  docLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  docStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  docStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  docReason: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  viewDocText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338CA',
  },
  docActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  approveDocBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#10B981',
    borderRadius: 6,
    gap: 4,
  },
  approveDocText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectDocBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    gap: 4,
  },
  rejectDocText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectSection: {
    marginTop: spacing.sm,
  },
  rejectInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  rejectActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectCancelBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    alignItems: 'center',
  },
  rejectCancelText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMid,
  },
  rejectConfirmBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    alignItems: 'center',
  },
  rejectConfirmText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Biometric Styles
  biometricCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  biometricTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  biometricStatus: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  biometricActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  biometricActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  biometricNote: {
    fontSize: 11,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  // Access Styles
  accessNote: {
    fontSize: 12,
    color: colors.textMid,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  accessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  accessText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  // Attendance Styles
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  monthBtn: {
    padding: 8,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  attendanceStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  attStatBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: 8,
  },
  attStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  attStatLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  noAttendanceText: {
    fontSize: 13,
    color: colors.textMid,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.lg,
  },
  // Activity Styles
  activityNote: {
    fontSize: 12,
    color: colors.textMid,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // KYC Tab Styles
  kycBanner: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  kycBannerText: {
    fontSize: 13,
    fontWeight: 900,
  },
  approveKycBtn: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center',
  },
  approveKycText: {
    fontSize: 13,
    fontWeight: 900,
    color: '#FFFFFF',
  },
  identitySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  identitySectionTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: colors.text,
    marginBottom: 12,
  },
  identityForm: {
    gap: 12,
  },
  identityRow: {
    gap: 8,
  },
  identityRowFull: {
    gap: 8,
  },
  identityLabel: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: 800,
    marginBottom: 3,
  },
  identityInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: 700,
    color: colors.text,
  },
  identityTextarea: {
    height: 60,
    textAlignVertical: 'top',
  },
  saveIdentityBtn: {
    marginTop: 12,
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveIdentityText: {
    fontSize: 12,
    fontWeight: 800,
    color: '#FFFFFF',
  },
  docInspectionSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docInspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  docInspectionTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: colors.text,
  },
  docCountBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  docCountText: {
    fontSize: 11,
    fontWeight: 900,
    color: colors.primary,
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rejectSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 6,
  },
  presetReasonsScroll: {
    gap: 6,
    marginBottom: 10,
  },
  presetReasonBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  presetReasonText: {
    fontSize: 11,
    fontWeight: 700,
    color: '#991B1B',
  },
  rejectInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  // Biometric Tab Styles
  biometricCallout: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  biometricCalloutHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  biometricCalloutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricCalloutContent: {
    flex: 1,
  },
  biometricCalloutTitle: {
    fontSize: 15,
    fontWeight: 900,
  },
  biometricCalloutSub: {
    fontSize: 12,
    marginTop: 2,
  },
  biometricCalloutNote: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  reenrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: '#059669',
    borderRadius: 8,
    justifyContent: 'center',
  },
  reenrollText: {
    fontSize: 12,
    fontWeight: 800,
    color: '#FFFFFF',
  },
  biometricPendingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sendReminderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendReminderText: {
    fontSize: 12,
    fontWeight: 800,
    color: '#FFFFFF',
  },
  completeVerificationBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderRadius: 8,
    alignItems: 'center',
  },
  completeVerificationText: {
    fontSize: 12,
    fontWeight: 800,
    color: '#4F46E5',
  },
  faceRefGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  faceRefCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faceRefCardTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: colors.text,
    marginBottom: 10,
  },
  faceImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faceImagePlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  faceImageText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  faceRefIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'flex-start',
  },
  infoBannerText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
    flex: 1,
  },
  // Access & Team Tab Styles
  accessCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  accessCardLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  accessCardValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: 800,
  },
  manageBtn: {
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  manageBtnText: {
    fontSize: 12,
    fontWeight: 800,
    color: '#FFFFFF',
  },
  // Attendance Tab Styles
  attendanceAccessCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  attendanceAccessLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: 700,
  },
  attendanceAccessValue: {
    fontSize: 14,
    fontWeight: 900,
    marginTop: 2,
  },
  biometricSettingsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    borderRadius: 6,
  },
  biometricSettingsText: {
    fontSize: 11,
    fontWeight: 800,
    color: colors.primary,
  },
  monthFilterBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  monthFilterLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthFilterText: {
    fontSize: 13,
    fontWeight: 900,
    color: colors.text,
  },
  monthFilterSelectors: {
    flexDirection: 'row',
    gap: 8,
  },
  monthDropdownScroll: {
    maxWidth: 200,
  },
  monthDropdownItem: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthDropdownItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthDropdownText: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.text,
  },
  monthDropdownTextActive: {
    color: '#FFFFFF',
  },
  yearDropdownScroll: {
    maxWidth: 120,
  },
  yearDropdownItem: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearDropdownItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearDropdownText: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.text,
  },
  yearDropdownTextActive: {
    color: '#FFFFFF',
  },
  attendanceSummaryCards: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  attSummaryCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  attSummaryLabel: {
    fontSize: 10,
    fontWeight: 800,
  },
  attSummaryValue: {
    fontSize: 16,
    fontWeight: 900,
  },
  workingHoursBar: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  workingHoursLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: 700,
  },
  workingHoursValue: {
    fontSize: 13,
    fontWeight: 900,
    color: colors.primary,
  },
  dailyBreakdownTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: colors.text,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  noDailyRecords: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
  },
  noDailyRecordsText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
  },
  dailyRecordsList: {
    gap: 10,
  },
  dailyRecordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  dailyRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyRecordDate: {
    fontSize: 13,
    fontWeight: 900,
    color: colors.text,
  },
  dailyRecordStatus: {
    paddingHorizontal: 3,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dailyRecordStatusText: {
    fontSize: 11,
    fontWeight: 800,
  },
  dailyRecordTimeGrid: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
  },
  timeGridItem: {
    flex: 1,
  },
  timeGridLabel: {
    fontSize: 10,
    color: colors.textLight,
    marginBottom: 2,
  },
  timeGridValue: {
    fontSize: 11,
    fontWeight: 800,
    color: colors.text,
  },
  dailyRecordAudit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    fontSize: 11,
    color: colors.textLight,
    paddingTop: 2,
  },
  auditBadges: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  auditBadge: {
    fontSize: 11,
  },
  inspectDetailsBtn: {
    backgroundColor: 'transparent',
  },
  inspectDetailsText: {
    color: colors.primary,
    fontWeight: 800,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  // Actions Tab Styles
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: spacing.sm,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: `${colors.primary}08`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  actionCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: colors.text,
  },
  actionCardSub: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  additionalActions: {
    gap: 10,
    marginTop: 8,
  },
  actionRowBtn: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionRowContent: {
    flex: 1,
  },
  actionRowTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: colors.text,
  },
  actionRowSub: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: 600,
    marginTop: 2,
  },
  faceImgPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  faceEnrolledBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  faceEnrolledTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    marginTop: spacing.xs,
  },
  faceEnrolledSub: {
    fontSize: 11,
    color: '#047857',
    textAlign: 'center',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  docPreviewContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginVertical: spacing.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docPreviewImage: {
    width: '100%',
    height: '100%',
  },
  docPreviewEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  docPreviewEmptyText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  docModalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  docOpenExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  docOpenExternalText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  docCloseBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docCloseText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  auditTimeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  auditTimeCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  auditTimeLabel: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '700',
  },
  auditTimeValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  auditTechnicalBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  auditTechnicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  auditTechnicalTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.teal,
  },
  auditTechnicalGrid: {
    gap: 6,
  },
  auditTechnicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditTechLabel: {
    fontSize: 11.5,
    color: colors.textLight,
  },
  auditTechValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.text,
  },
  auditCloseBtn: {
    backgroundColor: colors.teal,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  auditCloseText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  deptLoadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  deptLoadingText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  deptBanksList: {
    maxHeight: 260,
    marginVertical: spacing.sm,
  },
  deptBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.xs,
    backgroundColor: '#F8FAFC',
  },
  deptBankRowChecked: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxSquareChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  deptBankName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  deptBankNameChecked: {
    color: colors.primary,
    fontWeight: '800',
  },
  bonusFormCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  bonusFormHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bonusPickerScroll: {
    marginVertical: spacing.xs,
  },
  bonusPickerPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: spacing.xs,
  },
  bonusPickerPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bonusPickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  bonusPickerTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  bonusNoBanksText: {
    fontSize: 11,
    color: '#D97706',
    marginVertical: 4,
  },
  bonusRow2: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  bonusSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  bonusSaveBtnText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  bonusRulesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bonusNoRulesText: {
    fontSize: 12,
    color: colors.textLight,
    paddingVertical: spacing.sm,
  },
  bonusRuleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.xs,
  },
  bonusRuleEmployee: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
  },
  bonusRuleSub: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  bonusRuleDates: {
    fontSize: 10.5,
    color: colors.textLight,
    marginTop: 1,
  },
  bonusDeleteBtn: {
    padding: spacing.xs,
  },
  autoGenBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoGenText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  templatePreviewInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 11.5,
    fontFamily: 'monospace',
    color: colors.text,
    marginBottom: spacing.md,
  },
  credentialsActionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  credSmsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
  },
  credWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 10,
  },
  credBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  credCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  credCancelText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
