import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaUsers, FaUserCheck, FaSitemap, FaLink, FaSearch, 
  FaPlus, FaCheckCircle, FaTimesCircle, FaEye, FaEdit, FaCheck, FaLock,
  FaFileAlt, FaVideo, FaUniversity, FaBuilding, FaBriefcase, FaIdCard, FaPhone, FaEnvelope, FaClock, FaUserCircle,
  FaUserTimes, FaUnlink, FaChartLine, FaTrophy, FaEllipsisV, FaDownload, FaRedo, FaInfoCircle, FaChevronRight,
  FaCoins, FaBullseye, FaTrash, FaCalendarAlt, FaExclamationCircle
} from 'react-icons/fa';
import api from '../../../services/api';

export default function EmployeeManagement() {
  const { C } = useTheme();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'hierarchy', 'bonus'
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');

  // Hierarchy Tree selected Role, Person & Popovers
  const [selectedTreeRole, setSelectedTreeRole] = useState('MANAGER'); // 'BRANCH_HEAD', 'SENIOR_MANAGER', 'MANAGER', 'TEAM_LEADER'
  const [selectedTreePersonId, setSelectedTreePersonId] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState(null);
  const [popoverEmpId, setPopoverEmpId] = useState(null);

  // Modals state
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [emp360Data, setEmp360Data] = useState(null);
  const [loading360, setLoading360] = useState(false);
  const [linkModalEmp, setLinkModalEmp] = useState(null);
  const [hierarchyModalEmp, setHierarchyModalEmp] = useState(null);
  const [actionModalEmp, setActionModalEmp] = useState(null);
  const [perfModalEmp, setPerfModalEmp] = useState(null);
  const [createEmpModalOpen, setCreateEmpModalOpen] = useState(false);

  // Manage Departments Modal State
  const [deptModalEmp, setDeptModalEmp] = useState(null);
  const [deptBanksList, setDeptBanksList] = useState([]);
  const [selectedBankIds, setSelectedBankIds] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [savingDepts, setSavingDepts] = useState(false);

  // Manage Bonus Modal & Rules State
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusModalEmp, setBonusModalEmp] = useState(null);
  const [employeeAssignedBanks, setEmployeeAssignedBanks] = useState([]);
  const [bonusRulesList, setBonusRulesList] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  const [bonusForm, setBonusForm] = useState({
    employee_id: '',
    bank_id: '',
    start_date: '',
    end_date: '',
    target_count: '10',
    bonus_per_card: '500'
  });

  // Create Employee Form
  const [createForm, setCreateForm] = useState({
    full_name: '',
    mobile_number: '',
    email_id: '',
    designation: 'TC',
    hierarchy_level: 'TC',
    offered_salary: '25000',
    work_location: 'Head Office',
    department: 'Sales & Distribution',
    branch_head_id: '',
    senior_manager_id: '',
    manager_id: '',
    team_leader_id: ''
  });

  const handleCreateEmployeeSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/employees/create', createForm);
      if (res.data.success) {
        alert(res.data.message || 'Employee created successfully!');
        setCreateEmpModalOpen(false);
        setCreateForm({
          full_name: '',
          mobile_number: '',
          email_id: '',
          designation: 'TC',
          hierarchy_level: 'TC',
          offered_salary: '25000',
          work_location: 'Head Office',
          department: 'Sales & Distribution',
          branch_head_id: '',
          senior_manager_id: '',
          manager_id: '',
          team_leader_id: ''
        });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Employee creation failed');
    }
  };

  // Hierarchy Form
  const [subordinateSearchText, setSubordinateSearchText] = useState('');
  const [hierarchyForm, setHierarchyForm] = useState({
    hierarchy_level: 'TC',
    branch_head_id: '',           // For SENIOR_MANAGER
    senior_manager_id: '',        // For MANAGER
    manager_id: '',               // For TEAM_LEADER and TC
    team_leader_id: '',            // For TC
    selected_sm_ids: [],          // For BRANCH_HEAD
    selected_mgr_ids: [],         // For SENIOR_MANAGER
    selected_tl_ids: [],          // For MANAGER
    selected_tc_ids: [],          // For TEAM_LEADER
    tl_tc_mapping: {}             // For MANAGER (TL → TC mapping)
  });

  const openHierarchyModal = (emp) => {
    setSubordinateSearchText('');
    setHierarchyModalEmp(emp);
    const sourceEmployees = allEmployees.length ? allEmployees : employees;
    const desgUpper = String(emp.designation || '').toUpperCase();
    const currentRole = (emp.hierarchy_level || (desgUpper.includes('BRANCH') ? 'BRANCH_HEAD' : desgUpper.includes('SENIOR') ? 'SENIOR_MANAGER' : desgUpper.includes('MANAGER') ? 'MANAGER' : desgUpper.includes('TEAM') || desgUpper === 'TL' ? 'TEAM_LEADER' : 'TC')).toUpperCase();
    
    // Find current subordinates based on role
    let currentSubordinates = [];
    
    if (currentRole === 'BRANCH_HEAD') {
      currentSubordinates = sourceEmployees.filter(e => 
        e.branch_head_id === emp.id && 
        (e.designation === 'Senior Manager' || e.hierarchy_level === 'SENIOR_MANAGER')
      ).map(e => e.id);
    }
    else if (currentRole === 'SENIOR_MANAGER') {
      currentSubordinates = sourceEmployees.filter(e => 
        e.senior_manager_id === emp.id && 
        (e.designation === 'Manager' || e.hierarchy_level === 'MANAGER')
      ).map(e => e.id);
    }
    else if (currentRole === 'MANAGER') {
      currentSubordinates = sourceEmployees.filter(e => 
        e.manager_id === emp.id && 
        (e.designation === 'Team Leader' || e.hierarchy_level === 'TEAM_LEADER')
      ).map(e => e.id);
    }
    else if (currentRole === 'TEAM_LEADER') {
      currentSubordinates = sourceEmployees.filter(e => 
        e.team_leader_id === emp.id && 
        (e.designation === 'TC' || e.hierarchy_level === 'TC')
      ).map(e => e.id);
    }
    
    // Build TL to TC mapping for Managers
    const tlTcMapping = {};
    if (currentRole === 'MANAGER') {
      currentSubordinates.forEach(tlId => {
        const tcIds = sourceEmployees.filter(e => 
          e.team_leader_id === tlId && 
          (e.designation === 'TC' || e.hierarchy_level === 'TC')
        ).map(e => e.id);
        if (tcIds.length > 0) {
          tlTcMapping[tlId] = tcIds;
        }
      });
    }

    setHierarchyForm({
      hierarchy_level: currentRole,
      branch_head_id: emp.branch_head_id || '',
      senior_manager_id: emp.senior_manager_id || '',
      manager_id: emp.manager_id || '',
      team_leader_id: emp.team_leader_id || '',
      selected_sm_ids: currentRole === 'BRANCH_HEAD' ? currentSubordinates : [],
      selected_mgr_ids: currentRole === 'SENIOR_MANAGER' ? currentSubordinates : [],
      selected_tl_ids: currentRole === 'MANAGER' ? currentSubordinates : [],
      selected_tc_ids: currentRole === 'TEAM_LEADER' ? currentSubordinates : [],
      tl_tc_mapping: tlTcMapping
    });
  };

  const handleAssignHierarchySubmit = async (e) => {
    e.preventDefault();
    if (!hierarchyModalEmp) return;
    
    const sourceEmployees = allEmployees.length ? allEmployees : employees;

    try {
      const role = hierarchyForm.hierarchy_level || 'TC';
      const bulkAssignments = [];
      
      // =====================================================
      // VALIDATION: Single Supervisor Rule
      // =====================================================
      
      // Validate that employees don't have multiple supervisors at same level
      const validateSingleSupervisor = (employeeId, supervisorId, supervisorType, supervisorName) => {
        if (!supervisorId) return true; // No supervisor is valid
        
        const employee = sourceEmployees.find(e => e.id === employeeId);
        if (!employee) return true;
        
        // Check if employee already has a different supervisor at this level
        const currentSupervisorId = employee[`${supervisorType}_id`];
        if (currentSupervisorId && currentSupervisorId !== supervisorId) {
          const currentSupervisor = sourceEmployees.find(e => e.id === currentSupervisorId);
          const currentSupervisorName = currentSupervisor ? currentSupervisor.full_name : 'Unknown';
          alert(`⚠️ Validation Error: ${employee.full_name} (${employee.employee_id}) already reports to ${currentSupervisorName} (${currentSupervisorId}) as ${supervisorType.replace('_', ' ').toUpperCase()}. Unassign current supervisor first or select the same supervisor.`);
          return false;
        }
        return true;
      };
      
      // Validate Senior Manager assignment (should have only one Branch Head)
      if (role === 'SENIOR_MANAGER' && hierarchyForm.branch_head_id) {
        if (!validateSingleSupervisor(hierarchyModalEmp.id, hierarchyForm.branch_head_id, 'branch_head', 'Branch Head')) {
          return;
        }
      }
      
      // Validate Manager assignment (should have only one Branch Head OR one Senior Manager)
      if (role === 'MANAGER') {
        if (hierarchyForm.branch_head_id && !validateSingleSupervisor(hierarchyModalEmp.id, hierarchyForm.branch_head_id, 'branch_head', 'Branch Head')) {
          return;
        }
        if (hierarchyForm.senior_manager_id && !validateSingleSupervisor(hierarchyModalEmp.id, hierarchyForm.senior_manager_id, 'senior_manager', 'Senior Manager')) {
          return;
        }
        // Prevent having both Branch Head and Senior Manager (choose one)
        if (hierarchyForm.branch_head_id && hierarchyForm.senior_manager_id) {
          alert('⚠️ Validation Error: A Manager can report to either a Branch Head OR a Senior Manager, not both. Please select only one reporting supervisor.');
          return;
        }
      }
      
      // Validate Team Leader assignment (should have only one Manager)
      if (role === 'TEAM_LEADER' && hierarchyForm.manager_id) {
        if (!validateSingleSupervisor(hierarchyModalEmp.id, hierarchyForm.manager_id, 'manager', 'Manager')) {
          return;
        }
      }
      
      // Validate TC assignment (should have only one Manager OR one Team Leader)
      if (role === 'TC') {
        if (hierarchyForm.manager_id && !validateSingleSupervisor(hierarchyModalEmp.id, hierarchyForm.manager_id, 'manager', 'Manager')) {
          return;
        }
        if (hierarchyForm.team_leader_id && !validateSingleSupervisor(hierarchyModalEmp.id, hierarchyForm.team_leader_id, 'team_leader', 'Team Leader')) {
          return;
        }
        // Prevent having both Manager and Team Leader without proper hierarchy
        if (hierarchyForm.manager_id && hierarchyForm.team_leader_id) {
          // This is valid - TC reports to Manager through Team Leader
          // But validate that the Team Leader reports to the same Manager
          const tl = sourceEmployees.find(e => e.id === hierarchyForm.team_leader_id);
          if (tl && tl.manager_id !== hierarchyForm.manager_id) {
            alert('⚠️ Validation Error: The selected Team Leader does not report to the selected Manager. Please select a Team Leader who reports to this Manager, or assign the TC directly to the Manager without a Team Leader.');
            return;
          }
        }
      }
      
      // =====================================================
      // STEP 1: Update target employee's own hierarchy
      // =====================================================
      const payload = {
        hierarchy_level: role,
        branch_head_id: null,
        senior_manager_id: null,
        manager_id: null,
        team_leader_id: null
      };
      
      // Role-based field assignment
      switch (role) {
        case 'BRANCH_HEAD':
          // Branch Head: No reporting structure (top level)
          // All fields remain null
          break;
          
        case 'SENIOR_MANAGER':
          // Senior Manager: Reports to Branch Head
          payload.branch_head_id = hierarchyForm.branch_head_id || null;
          break;
          
        case 'MANAGER':
          // Manager: Reports to Branch Head OR Senior Manager
          payload.branch_head_id = hierarchyForm.branch_head_id || null;
          payload.senior_manager_id = hierarchyForm.senior_manager_id || null;
          break;
          
        case 'TEAM_LEADER':
          // Team Leader: Reports to Manager
          payload.manager_id = hierarchyForm.manager_id || null;
          break;
          
        case 'TC':
          // Telecaller: Reports to Manager OR Team Leader
          payload.manager_id = hierarchyForm.manager_id || null;
          payload.team_leader_id = hierarchyForm.team_leader_id || null;
          break;
      }
      
      await api.post(`/employees/${hierarchyModalEmp.id}/hierarchy`, payload);
      
      // =====================================================
      // STEP 2: Handle Subordinate Assignments Based on Role
      // =====================================================
      
      // -------------------------------------------------
      // BRANCH HEAD: Assign Senior Managers
      // -------------------------------------------------
      if (role === 'BRANCH_HEAD') {
        // Remove previous Senior Manager assignments that are no longer selected
        const prevSeniorManagers = sourceEmployees.filter(e => 
          (e.branch_head_id === hierarchyModalEmp.id || e.branch_head_name === hierarchyModalEmp.full_name) &&
          (e.designation === 'Senior Manager' || e.hierarchy_level === 'SENIOR_MANAGER')
        );
        
        for (const prevSm of prevSeniorManagers) {
          if (!hierarchyForm.selected_sm_ids.includes(prevSm.id)) {
            bulkAssignments.push({
              employee_id: prevSm.id,
              hierarchy_level: 'SENIOR_MANAGER',
              branch_head_id: null,
              senior_manager_id: null,
              manager_id: null,
              team_leader_id: null
            });
            
            // Also cascade: Remove Managers under this Senior Manager
            const prevManagers = sourceEmployees.filter(e => 
              e.senior_manager_id === prevSm.id && 
              (e.designation === 'Manager' || e.hierarchy_level === 'MANAGER')
            );
            for (const mgr of prevManagers) {
              bulkAssignments.push({
                employee_id: mgr.id,
                hierarchy_level: 'MANAGER',
                branch_head_id: null,
                senior_manager_id: null,
                manager_id: null,
                team_leader_id: null
              });
              
              // Further cascade: Remove TLs under this Manager
              const prevTLs = sourceEmployees.filter(e => 
                e.manager_id === mgr.id && 
                (e.designation === 'Team Leader' || e.hierarchy_level === 'TEAM_LEADER')
              );
              for (const tl of prevTLs) {
                bulkAssignments.push({
                  employee_id: tl.id,
                  hierarchy_level: 'TEAM_LEADER',
                  branch_head_id: null,
                  senior_manager_id: null,
                  manager_id: null,
                  team_leader_id: null
                });
                
                // Further cascade: Remove TCs under this TL
                const prevTCs = sourceEmployees.filter(e => 
                  e.team_leader_id === tl.id && 
                  (e.designation === 'TC' || e.hierarchy_level === 'TC')
                );
                for (const tc of prevTCs) {
                  bulkAssignments.push({
                    employee_id: tc.id,
                    hierarchy_level: 'TC',
                    branch_head_id: null,
                    senior_manager_id: null,
                    manager_id: null,
                    team_leader_id: null
                  });
                }
              }
            }
          }
        }
        
        // Assign selected Senior Managers to this Branch Head
        for (const smId of hierarchyForm.selected_sm_ids) {
          bulkAssignments.push({
            employee_id: smId,
            hierarchy_level: 'SENIOR_MANAGER',
            branch_head_id: hierarchyModalEmp.id,
            senior_manager_id: null,
            manager_id: null,
            team_leader_id: null
          });
        }
      }
      
      // -------------------------------------------------
      // SENIOR MANAGER: Assign Managers
      // -------------------------------------------------
      else if (role === 'SENIOR_MANAGER') {
        // Remove previous Manager assignments that are no longer selected
        const prevManagers = sourceEmployees.filter(e => 
          (e.senior_manager_id === hierarchyModalEmp.id || e.senior_manager_name === hierarchyModalEmp.full_name) &&
          (e.designation === 'Manager' || e.hierarchy_level === 'MANAGER')
        );
        
        for (const prevMgr of prevManagers) {
          if (!hierarchyForm.selected_mgr_ids.includes(prevMgr.id)) {
            bulkAssignments.push({
              employee_id: prevMgr.id,
              hierarchy_level: 'MANAGER',
              branch_head_id: hierarchyForm.branch_head_id || null,
              senior_manager_id: null,
              manager_id: null,
              team_leader_id: null
            });
            
            // Cascade: Remove TLs under this Manager
            const prevTLs = sourceEmployees.filter(e => 
              e.manager_id === prevMgr.id && 
              (e.designation === 'Team Leader' || e.hierarchy_level === 'TEAM_LEADER')
            );
            for (const tl of prevTLs) {
              bulkAssignments.push({
                employee_id: tl.id,
                hierarchy_level: 'TEAM_LEADER',
                branch_head_id: hierarchyForm.branch_head_id || null,
                senior_manager_id: null,
                manager_id: null,
                team_leader_id: null
              });
              
              // Further cascade: Remove TCs under this TL
              const prevTCs = sourceEmployees.filter(e => 
                e.team_leader_id === tl.id && 
                (e.designation === 'TC' || e.hierarchy_level === 'TC')
              );
              for (const tc of prevTCs) {
                bulkAssignments.push({
                  employee_id: tc.id,
                  hierarchy_level: 'TC',
                  branch_head_id: hierarchyForm.branch_head_id || null,
                  senior_manager_id: null,
                  manager_id: null,
                  team_leader_id: null
                });
              }
            }
          }
        }
        
        // Assign selected Managers to this Senior Manager
        for (const mgrId of hierarchyForm.selected_mgr_ids) {
          bulkAssignments.push({
            employee_id: mgrId,
            hierarchy_level: 'MANAGER',
            branch_head_id: hierarchyForm.branch_head_id || null,
            senior_manager_id: hierarchyModalEmp.id,
            manager_id: null,
            team_leader_id: null
          });
        }
      }
      
      // -------------------------------------------------
      // MANAGER: Assign Team Leaders and TCs with TL-TC Mapping
      // -------------------------------------------------
      else if (role === 'MANAGER') {
        // Remove previous TL assignments that are no longer selected
        const prevTLs = sourceEmployees.filter(e => 
          (e.manager_id === hierarchyModalEmp.id || e.manager_name === hierarchyModalEmp.full_name) &&
          (e.designation === 'Team Leader' || e.hierarchy_level === 'TEAM_LEADER')
        );
        
        for (const prevTl of prevTLs) {
          if (!hierarchyForm.selected_tl_ids.includes(prevTl.id)) {
            // Remove this TL from manager
            bulkAssignments.push({
              employee_id: prevTl.id,
              hierarchy_level: 'TEAM_LEADER',
              branch_head_id: hierarchyForm.branch_head_id || null,
              senior_manager_id: hierarchyForm.senior_manager_id || null,
              manager_id: null,
              team_leader_id: null
            });
            
            // Clear TC assignments for this TL
            const prevTCs = sourceEmployees.filter(e => 
              e.team_leader_id === prevTl.id && 
              (e.designation === 'TC' || e.hierarchy_level === 'TC')
            );
            for (const tc of prevTCs) {
              bulkAssignments.push({
                employee_id: tc.id,
                hierarchy_level: 'TC',
                branch_head_id: hierarchyForm.branch_head_id || null,
                senior_manager_id: hierarchyForm.senior_manager_id || null,
                manager_id: hierarchyModalEmp.id,  // Keep TC reporting to Manager directly
                team_leader_id: null
              });
            }
          }
        }
        
        // Assign selected TLs to this Manager
        for (const tlId of hierarchyForm.selected_tl_ids) {
          bulkAssignments.push({
            employee_id: tlId,
            hierarchy_level: 'TEAM_LEADER',
            branch_head_id: hierarchyForm.branch_head_id || null,
            senior_manager_id: hierarchyForm.senior_manager_id || null,
            manager_id: hierarchyModalEmp.id,
            team_leader_id: null
          });
        }
        
        // Handle TC assignments based on TL-to-TC mapping
        const allSelectedTCs = new Set();
        Object.values(hierarchyForm.tl_tc_mapping || {}).forEach(tcIds => {
          tcIds.forEach(tcId => allSelectedTCs.add(tcId));
        });
        
        // Clear previous TC assignments for this manager that are no longer selected
        const prevTCs = sourceEmployees.filter(e => 
          e.manager_id === hierarchyModalEmp.id && 
          (e.designation === 'TC' || e.hierarchy_level === 'TC')
        );
        
        for (const tc of prevTCs) {
          if (!allSelectedTCs.has(tc.id)) {
            bulkAssignments.push({
              employee_id: tc.id,
              hierarchy_level: 'TC',
              branch_head_id: hierarchyForm.branch_head_id || null,
              senior_manager_id: hierarchyForm.senior_manager_id || null,
              manager_id: null,
              team_leader_id: null
            });
          }
        }
        
        // Assign TCs to their respective TLs under this Manager
        for (const [tlId, tcIds] of Object.entries(hierarchyForm.tl_tc_mapping || {})) {
          for (const tcId of tcIds) {
            bulkAssignments.push({
              employee_id: tcId,
              hierarchy_level: 'TC',
              branch_head_id: hierarchyForm.branch_head_id || null,
              senior_manager_id: hierarchyForm.senior_manager_id || null,
              manager_id: hierarchyModalEmp.id,  // TC still reports to Manager
              team_leader_id: tlId
            });
          }
        }
      }
      
      // -------------------------------------------------
      // TEAM LEADER: Assign TCs
      // -------------------------------------------------
      else if (role === 'TEAM_LEADER') {
        // Remove previous TC assignments that are no longer selected
        const prevTCs = sourceEmployees.filter(e => 
          e.team_leader_id === hierarchyModalEmp.id && 
          (e.designation === 'TC' || e.hierarchy_level === 'TC')
        );
        
        for (const tc of prevTCs) {
          if (!hierarchyForm.selected_tc_ids.includes(tc.id)) {
            bulkAssignments.push({
              employee_id: tc.id,
              hierarchy_level: 'TC',
              branch_head_id: hierarchyForm.branch_head_id || null,
              senior_manager_id: hierarchyForm.senior_manager_id || null,
              manager_id: hierarchyForm.manager_id || null,  // Revert to Manager
              team_leader_id: null
            });
          }
        }
        
        // Assign selected TCs to this Team Leader
        for (const tcId of hierarchyForm.selected_tc_ids) {
          bulkAssignments.push({
            employee_id: tcId,
            hierarchy_level: 'TC',
            branch_head_id: hierarchyForm.branch_head_id || null,
            senior_manager_id: hierarchyForm.senior_manager_id || null,
            manager_id: hierarchyForm.manager_id || null,  // Keep Manager for full chain
            team_leader_id: hierarchyModalEmp.id
          });
        }
      }
      
      // -------------------------------------------------
      // TC: Only update own reporting structure (already done in Step 1)
      // -------------------------------------------------
      else if (role === 'TC') {
        // No subordinate assignments for TC
        // Only reporting structure updated in Step 1
      }
      
      // =====================================================
      // STEP 3: Execute Bulk Assignments
      // =====================================================
      if (bulkAssignments.length > 0) {
        await api.post('/employees/bulk-hierarchy', { assignments: bulkAssignments });
      }
      
      alert('Employee hierarchy and team assignments updated successfully!');
      setHierarchyModalEmp(null);
      fetchData();
      
    } catch (err) {
      alert(err.response?.data?.message || 'Hierarchy assignment failed');
    }
  };

  // ── Manage Departments Handlers ──
  const openDeptModal = async (emp) => {
    setDeptModalEmp(emp);
    setLoadingDepts(true);
    try {
      const res = await api.get(`/employees/${emp.id}/departments`);
      if (res.data?.success) {
        setDeptBanksList(res.data.all_banks || []);
        setSelectedBankIds((res.data.assigned_banks || []).map(b => b.bank_id));
      }
    } catch (err) {
      console.error('Failed to load employee department assignments:', err);
      alert('Failed to load bank assignments');
    } finally {
      setLoadingDepts(false);
    }
  };

  const handleSaveDeptAssignments = async () => {
    if (!deptModalEmp) return;
    setSavingDepts(true);
    try {
      const res = await api.post(`/employees/${deptModalEmp.id}/departments`, { bank_ids: selectedBankIds });
      if (res.data?.success) {
        alert(res.data.message || 'Department/Bank assignments updated successfully');
        setDeptModalEmp(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update department assignments');
    } finally {
      setSavingDepts(false);
    }
  };

  // ── Manage Bonus Rules Handlers ──
  const openBonusModal = async (emp = null) => {
    setBonusModalEmp(emp);
    const targetEmpId = emp ? emp.id : (employees[0]?.id || '');
    setBonusForm({
      employee_id: targetEmpId,
      bank_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      target_count: '10',
      bonus_per_card: '500'
    });
    setBonusModalOpen(true);
    fetchBonusRules();
    if (targetEmpId) {
      fetchEmployeeAssignedBanks(targetEmpId);
    }
  };

  const fetchEmployeeAssignedBanks = async (empId) => {
    if (!empId) return;
    try {
      const res = await api.get(`/employees/${empId}/departments`);
      if (res.data?.success) {
        const assigned = res.data.assigned_banks || [];
        setEmployeeAssignedBanks(assigned);
        if (assigned.length > 0) {
          setBonusForm(prev => ({ ...prev, bank_id: assigned[0].bank_id }));
        } else {
          setBonusForm(prev => ({ ...prev, bank_id: '' }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch assigned banks for bonus form:', err);
    }
  };

  const fetchBonusRules = async () => {
    setLoadingRules(true);
    try {
      const res = await api.get('/employees/bonus-rules/all');
      if (res.data?.success) {
        setBonusRulesList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch bonus rules:', err);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleSaveBonusRule = async (e) => {
    e.preventDefault();
    if (!bonusForm.employee_id || !bonusForm.bank_id || !bonusForm.start_date || !bonusForm.end_date) {
      alert('Please fill out all required fields');
      return;
    }
    setSavingRule(true);
    try {
      const res = await api.post('/employees/bonus-rules', bonusForm);
      if (res.data?.success) {
        alert(res.data.message || 'Bonus target rule assigned successfully!');
        fetchBonusRules();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save bonus rule');
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteBonusRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this bonus target rule?')) return;
    try {
      const res = await api.delete(`/employees/bonus-rules/${ruleId}`);
      if (res.data?.success) {
        fetchBonusRules();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete bonus rule');
    }
  };

  // Link Form
  const [productsList, setProductsList] = useState([]);
  const [linkForm, setLinkForm] = useState({
    product_id: '',
    employee_referral_url: '',
    incentive_amount: '500',
    incentive_type: 'FIXED'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/employees/stats');
      if (statsRes.data.success) setStats(statsRes.data.data);

      const allEmpRes = await api.get('/employees', { params: { limit: 10000 } });
      if (allEmpRes.data.success) setAllEmployees(allEmpRes.data.data || []);

      const empRes = await api.get('/employees', { 
        params: { 
          search: searchTerm,
          status: statusFilter,
          designation: designationFilter
        } 
      });
      if (empRes.data.success) setEmployees(empRes.data.data || []);

      const prodRes = await api.get('/products');
      if (prodRes.data.success) setProductsList(prodRes.data.data || []);
    } catch (err) {
      console.error('Super Admin Employees fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, statusFilter, designationFilter]);

  const handleActivateEmployee = async (empId, currentActivation) => {
    const newActivation = currentActivation === 'APPROVED' ? 'PENDING' : 'APPROVED';
    try {
      const res = await api.post(`/employees/${empId}/activate`, {
        activation_status: newActivation,
        employee_status: newActivation === 'APPROVED' ? 'ACTIVE' : 'INACTIVE'
      });
      if (res.data.success) {
        alert(`Employee status updated to ${newActivation}`);
        fetchData();
        if (selectedEmp && selectedEmp.id === empId) {
          handleOpen360View(selectedEmp);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Activation failed');
    }
  };

  const handleKycVerify = async (empId, status) => {
    const actionLabel = status === 'VERIFIED' ? 'Approve KYC & Activate' : 'Reject KYC';
    if (!window.confirm(`Are you sure you want to ${actionLabel} for this employee?`)) return;

    let notes = '';
    if (status === 'REJECTED') {
      notes = prompt('Enter rejection / re-upload reason for Employee KYC:');
      if (!notes || !notes.trim()) return;
    }

    try {
      const res = await api.post(`/employees/${empId}/kyc-verify`, {
        kyc_status: status,
        review_notes: notes ? notes.trim() : null
      });
      if (res.data.success) {
        alert(`Employee KYC successfully updated to ${status}`);
        fetchData();
        if (selectedEmp && selectedEmp.id === empId) {
          handleOpen360View(selectedEmp);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'KYC status update failed');
    }
  };

  const handleDocVerify = async (empId, docType, action) => {
    let reason = '';
    if (action === 'REJECTED') {
      reason = prompt(`Enter rejection reason for ${docType.toUpperCase()}:`);
      if (!reason || !reason.trim()) return;
    }

    try {
      const payload = {
        [`${docType}_action`]: action,
        [`${docType}_reason`]: reason ? reason.trim() : null
      };

      const res = await api.post(`/employees/${empId}/kyc-verify`, payload);
      if (res.data.success) {
        alert(`${docType.toUpperCase()} marked as ${action}`);
        fetchData();
        if (selectedEmp && selectedEmp.id === empId) {
          handleOpen360View(selectedEmp);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Document verification update failed');
    }
  };

  const handleOpen360View = async (emp) => {
    setSelectedEmp(emp);
    setLoading360(true);
    try {
      const res = await api.get(`/employees/${emp.id}`);
      if (res.data.success) {
        setEmp360Data(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching 360 view:', err);
    } finally {
      setLoading360(false);
    }
  };

  const handleAssignLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkModalEmp || !linkForm.product_id) return;
    try {
      const res = await api.post(`/employees/${linkModalEmp.id}/product-links`, linkForm);
      if (res.data.success) {
        alert('Product link and employee incentive assigned successfully!');
        setLinkModalEmp(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Link assignment failed');
    }
  };



  const handleUnassignHierarchy = async (empId, empName, empCode) => {
    if (!window.confirm(`Are you sure you want to unassign ${empName} (${empCode || 'N/A'}) from this team hierarchy?`)) return;
    try {
      const res = await api.post(`/employees/${empId}/unassign-hierarchy`);
      if (res.data.success) {
        alert(`${empName} unassigned from team hierarchy successfully.`);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unassignment failed');
    }
  };

  const handleExportTree = () => {
    const activeRoleList = selectedTreeRole === 'BRANCH_HEAD' ? branchHeadsList :
                           selectedTreeRole === 'SENIOR_MANAGER' ? seniorManagersList :
                           selectedTreeRole === 'TEAM_LEADER' ? tlsList :
                           managersList;
    const currentPerson = activeRoleList.find(p => p.id === selectedTreePersonId) || activeRoleList[0];
    if (!currentPerson) return alert('No employee tree available to export.');
    
    let csv = 'Level,Role,Employee Name,Employee ID,Mobile Number,Reporting To\n';
    const roleTitle = selectedTreeRole.replace('_', ' ');
    csv += `Level 1,${roleTitle},"${currentPerson.full_name}","${currentPerson.employee_id}","${currentPerson.mobile_number || ''}","Top Level"\n`;

    if (selectedTreeRole === 'BRANCH_HEAD') {
      const subSrMgrs = seniorManagersList.filter(sm => sm.branch_head_id === currentPerson.id || sm.branch_head_name === currentPerson.full_name);
      subSrMgrs.forEach(sm => {
        csv += `Level 2,Senior Manager,"${sm.full_name}","${sm.employee_id}","${sm.mobile_number || ''}","${currentPerson.full_name}"\n`;
        const subMgrs = managersList.filter(m => m.senior_manager_id === sm.id || m.senior_manager_name === sm.full_name);
        subMgrs.forEach(m => {
          csv += `Level 3,Manager,"${m.full_name}","${m.employee_id}","${m.mobile_number || ''}","${sm.full_name}"\n`;
          const subTLs = tlsList.filter(tl => tl.manager_id === m.id || tl.manager_name === m.full_name);
          subTLs.forEach(tl => {
            csv += `Level 4,Team Leader,"${tl.full_name}","${tl.employee_id}","${tl.mobile_number || ''}","${m.full_name}"\n`;
            const subTCs = targetEmployeeList.filter(tc => tc.team_leader_id === tl.id || tc.team_leader_name === tl.full_name);
            subTCs.forEach(tc => {
              csv += `Level 5,Telecaller,"${tc.full_name}","${tc.employee_id}","${tc.mobile_number || ''}","${tl.full_name}"\n`;
            });
          });
        });
      });
    } else if (selectedTreeRole === 'SENIOR_MANAGER') {
      const subMgrs = managersList.filter(m => m.senior_manager_id === currentPerson.id || m.senior_manager_name === currentPerson.full_name);
      subMgrs.forEach(m => {
        csv += `Level 2,Manager,"${m.full_name}","${m.employee_id}","${m.mobile_number || ''}","${currentPerson.full_name}"\n`;
        const subTLs = tlsList.filter(tl => tl.manager_id === m.id || tl.manager_name === m.full_name);
        subTLs.forEach(tl => {
          csv += `Level 3,Team Leader,"${tl.full_name}","${tl.employee_id}","${tl.mobile_number || ''}","${m.full_name}"\n`;
          const subTCs = targetEmployeeList.filter(tc => tc.team_leader_id === tl.id || tc.team_leader_name === tl.full_name);
          subTCs.forEach(tc => {
            csv += `Level 4,Telecaller,"${tc.full_name}","${tc.employee_id}","${tc.mobile_number || ''}","${tl.full_name}"\n`;
          });
        });
      });
    } else if (selectedTreeRole === 'MANAGER') {
      const subTLs = tlsList.filter(tl => tl.manager_id === currentPerson.id || tl.manager_name === currentPerson.full_name);
      subTLs.forEach(tl => {
        csv += `Level 2,Team Leader,"${tl.full_name}","${tl.employee_id}","${tl.mobile_number || ''}","${currentPerson.full_name}"\n`;
        const subTCs = targetEmployeeList.filter(tc => tc.team_leader_id === tl.id || tc.team_leader_name === tl.full_name);
        subTCs.forEach(tc => {
          csv += `Level 3,Telecaller,"${tc.full_name}","${tc.employee_id}","${tc.mobile_number || ''}","${tl.full_name}"\n`;
        });
      });
      const directTCs = targetEmployeeList.filter(tc => (tc.designation === 'TC' || tc.hierarchy_level === 'TC') && (tc.manager_id === currentPerson.id || tc.manager_name === currentPerson.full_name) && !tc.team_leader_id);
      directTCs.forEach(tc => {
        csv += `Level 2,Direct Telecaller,"${tc.full_name}","${tc.employee_id}","${tc.mobile_number || ''}","${currentPerson.full_name}"\n`;
      });
    } else if (selectedTreeRole === 'TEAM_LEADER') {
      const subTCs = targetEmployeeList.filter(tc => (tc.designation === 'TC' || tc.hierarchy_level === 'TC') && (tc.team_leader_id === currentPerson.id || tc.team_leader_name === currentPerson.full_name));
      subTCs.forEach(tc => {
        csv += `Level 2,Telecaller,"${tc.full_name}","${tc.employee_id}","${tc.mobile_number || ''}","${currentPerson.full_name}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Hierarchy_Tree_${currentPerson.full_name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const targetEmployeeList = allEmployees.length ? allEmployees : employees;

  const branchHeadsList = targetEmployeeList.filter(e => e.id !== hierarchyModalEmp?.id && (String(e.designation || '').toLowerCase().includes('branch head') || e.hierarchy_level === 'BRANCH_HEAD'));
  const seniorManagersList = targetEmployeeList.filter(e => e.id !== hierarchyModalEmp?.id && (String(e.designation || '').toLowerCase().includes('senior manager') || e.hierarchy_level === 'SENIOR_MANAGER'));
  const managersList = targetEmployeeList.filter(e => e.id !== hierarchyModalEmp?.id && (String(e.designation || '').toLowerCase().includes('manager') && !String(e.designation || '').toLowerCase().includes('senior') || e.hierarchy_level === 'MANAGER'));
  const tlsList = targetEmployeeList.filter(e => e.id !== hierarchyModalEmp?.id && (String(e.designation || '').toLowerCase().includes('team leader') || String(e.designation || '').toUpperCase() === 'TL' || e.hierarchy_level === 'TEAM_LEADER'));
  const tcsList = targetEmployeeList.filter(e => e.id !== hierarchyModalEmp?.id && (String(e.designation || '').toLowerCase().includes('tc') || String(e.designation || '').toLowerCase().includes('telecaller') || e.hierarchy_level === 'TC'));

  const getSortedSupervisorOptions = (roleKeyword, levelCode) => {
    const activeId = hierarchyModalEmp?.id;
    return targetEmployeeList
      .filter(e => e.id !== activeId)
      .sort((a, b) => {
        const matchA = String(a.designation || '').toLowerCase().includes(roleKeyword) || a.hierarchy_level === levelCode;
        const matchB = String(b.designation || '').toLowerCase().includes(roleKeyword) || b.hierarchy_level === levelCode;
        if (matchA && !matchB) return -1;
        if (!matchA && matchB) return 1;
        return (a.full_name || '').localeCompare(b.full_name || '');
      });
  };

  const selectBranchHeadsOptions = getSortedSupervisorOptions('branch head', 'BRANCH_HEAD');
  const selectSeniorManagersOptions = getSortedSupervisorOptions('senior manager', 'SENIOR_MANAGER');
  const selectManagersOptions = getSortedSupervisorOptions('manager', 'MANAGER');
  const selectTlsOptions = getSortedSupervisorOptions('team leader', 'TEAM_LEADER');

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '12px 16px 24px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Super Admin Operations
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0 }}>Employee Management Center</h1>
          </div>
          <button
            onClick={() => setCreateEmpModalOpen(true)}
            style={{
              background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px',
              fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
            }}
          >
            <FaPlus /> + Add New Employee
          </button>
        </div>

        {/* Global Stats Cards — 5-Level Hierarchy Structure */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '12px' }}>
          {[
            { label: 'Total Employees', count: stats.total_employees || employees.length, icon: <FaUsers />, color: C.teal },
            { label: 'L1: Branch Heads', count: stats.total_branch_heads || branchHeadsList.length, icon: <FaBuilding />, color: '#D97706' },
            { label: 'L2: Senior Managers', count: stats.total_senior_managers || seniorManagersList.length, icon: <FaBriefcase />, color: '#6366F1' },
            { label: 'L3: Managers', count: stats.total_managers || managersList.length, icon: <FaSitemap />, color: '#8B5CF6' },
            { label: 'L4: Team Leaders', count: stats.total_tls || tlsList.length, icon: <FaSitemap />, color: '#3B82F6' },
            { label: 'L5: Telecallers (TC)', count: stats.total_tcs || tcsList.length, icon: <FaUsers />, color: '#EC4899' }
          ].map((st, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${st.color}15`, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                {st.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '10.5px', color: C.textMid, fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.label}</span>
                <div style={{ fontSize: '18px', fontWeight: 900, color: C.text }}>{st.count}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {[
            { id: 'all', label: 'All Employees Directory', icon: <FaUsers /> },
            { id: 'hierarchy', label: 'Team Hierarchy Tree', icon: <FaSitemap /> },
            { id: 'bonus', label: 'Manage Bonus & Targets', icon: <FaCoins /> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                background: activeTab === tab.id ? C.teal : C.card, 
                color: activeTab === tab.id ? '#fff' : C.textMid, 
                border: `1px solid ${activeTab === tab.id ? C.teal : C.border}`, 
                padding: '8px 16px', borderRadius: '10px', fontSize: '13px', 
                fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Directory Tab View */}
        {activeTab === 'all' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', minHeight: '450px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            {/* Filters Toolbar */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textMid }} />
                  <input 
                    type="text" 
                    placeholder="Search by Employee ID, Name, Mobile..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '9px 14px 9px 38px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, outline: 'none', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <select value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)} style={{ padding: '9px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px' }}>
                  <option value="">All Designations</option>
                  <option value="TC">TC (Telecaller)</option>
                  <option value="TL">TL (Team Leader)</option>
                  <option value="Manager">MANAGER</option>
                  <option value="Senior Manager">SENIOR MANAGER</option>
                  <option value="Branch Head">BRANCH HEAD</option>
                </select>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px' }}>
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            {/* Table & Mobile Card View */}
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
                {loading ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: C.textMid }}>Loading records...</div>
                ) : employees.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: C.textMid }}>No employees found matching criteria.</div>
                ) : (
                  employees.map(emp => (
                    <div 
                      key={emp.id}
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderRadius: '16px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: C.text }}>
                            {emp.full_name}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: C.teal, marginTop: '2px' }}>
                            ID: {emp.employee_id} • {emp.mobile_number}
                          </div>
                        </div>
                        <span 
                          style={{ 
                            padding: '3px 8px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 800,
                            background: emp.activation_status === 'APPROVED' ? '#D1FAE5' : '#FEF3C7',
                            color: emp.activation_status === 'APPROVED' ? '#065F46' : '#92400E',
                            flexShrink: 0
                          }}
                        >
                          {emp.activation_status === 'APPROVED' ? 'Active' : 'Pending'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: C.textMid, borderTop: `1px solid ${C.border}`, paddingTop: '8px' }}>
                        <div>
                          <strong>Role:</strong> {emp.designation || (emp.hierarchy_level === 'BRANCH_HEAD' ? 'BRANCH HEAD' : emp.hierarchy_level === 'SENIOR_MANAGER' ? 'SENIOR MANAGER' : emp.hierarchy_level === 'MANAGER' ? 'MANAGER' : emp.hierarchy_level === 'TEAM_LEADER' ? 'TL' : 'TC')}
                        </div>
                        <div>
                          <strong>Manager:</strong> {emp.manager_name || 'Direct'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>Onboarding:</span>
                        <div style={{ flex: 1, background: C.bgSecondary, height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${emp.overall_progress || 35}%`, background: C.teal, height: '100%' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800 }}>{emp.overall_progress || 35}%</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: `1px dashed ${C.border}` }}>
                        <div>
                          {emp.activation_status !== 'APPROVED' && (
                            <button
                              onClick={() => handleKycVerify(emp.id, 'VERIFIED')}
                              style={{
                                padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                                background: '#10B981', color: '#ffffff', border: 'none', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '4px'
                              }}
                              title="Approve KYC and activate employee account"
                            >
                              <FaCheckCircle /> Approve KYC
                            </button>
                          )}
                        </div>

                        <button 
                          onClick={() => setActionModalEmp(emp)}
                          style={{ 
                            background: `linear-gradient(135deg, ${C.teal} 0%, #0D9488 100%)`, 
                            color: '#ffffff', 
                            border: 'none', 
                            padding: '8px 14px', 
                            borderRadius: '10px', 
                            fontSize: '12.5px', 
                            fontWeight: 800, 
                            cursor: 'pointer', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
                            flexShrink: 0
                          }}
                        >
                          <FaEllipsisV /> Actions
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                      <th style={{ padding: '14px 20px' }}>EMP ID</th>
                      <th style={{ padding: '14px 20px' }}>Employee Name</th>
                      <th style={{ padding: '14px 20px' }}>Designation</th>
                      <th style={{ padding: '14px 20px' }}>Manager / TL</th>
                      <th style={{ padding: '14px 20px' }}>Onboarding</th>
                      <th style={{ padding: '14px 20px' }}>Status</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>Loading records...</td></tr>
                    ) : employees.length === 0 ? (
                      <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>No employees found matching criteria.</td></tr>
                    ) : employees.map(emp => (
                      <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '14px 20px', fontWeight: 900, color: C.teal }}>{emp.employee_id}</td>
                        <td style={{ padding: '14px 20px', fontWeight: 800, color: C.text }}>
                          {emp.full_name}
                          <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 400 }}>{emp.mobile_number}</div>
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 800 }}>
                          {emp.designation || (emp.hierarchy_level === 'BRANCH_HEAD' ? 'BRANCH HEAD' : emp.hierarchy_level === 'SENIOR_MANAGER' ? 'SENIOR MANAGER' : emp.hierarchy_level === 'MANAGER' ? 'MANAGER' : emp.hierarchy_level === 'TEAM_LEADER' ? 'TL' : 'TC')}
                        </td>
                        <td style={{ padding: '14px 20px', color: C.textMid }}>
                          <div>{emp.manager_name ? `Mgr: ${emp.manager_name}` : 'Direct'}</div>
                          {emp.team_leader_name && <div style={{ fontSize: '12px' }}>TL: {emp.team_leader_name}</div>}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, background: C.bgSecondary, height: '8px', borderRadius: '4px', overflow: 'hidden', minWidth: '60px' }}>
                              <div style={{ width: `${emp.overall_progress || 35}%`, background: C.teal, height: '100%' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700 }}>{emp.overall_progress || 35}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                            <span 
                              style={{ 
                                padding: '3px 10px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 800,
                                background: emp.activation_status === 'APPROVED' ? '#D1FAE5' : '#FEF3C7',
                                color: emp.activation_status === 'APPROVED' ? '#065F46' : '#92400E'
                              }}
                            >
                              {emp.activation_status === 'APPROVED' ? '● Active Account' : '● Pending Activation'}
                            </span>

                            {emp.activation_status !== 'APPROVED' && (
                              <button
                                onClick={() => handleKycVerify(emp.id, 'VERIFIED')}
                                style={{
                                  padding: '5px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800,
                                  background: '#10B981', color: '#ffffff', border: 'none', cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }}
                                title="Approve KYC and activate employee account"
                              >
                                <FaCheckCircle /> Approve KYC & Activate
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button 
                            onClick={() => setActionModalEmp(emp)}
                            style={{ 
                              background: `linear-gradient(135deg, ${C.teal} 0%, #0D9488 100%)`, 
                              color: '#ffffff', 
                              border: 'none', 
                              padding: '7px 14px', 
                              borderRadius: '10px', 
                              fontSize: '12.5px', 
                              fontWeight: 800, 
                              cursor: 'pointer', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <FaEllipsisV /> Actions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Hierarchy Tab View */}
        {activeTab === 'hierarchy' && (() => {
          const activeRoleList = selectedTreeRole === 'BRANCH_HEAD' ? branchHeadsList :
                                 selectedTreeRole === 'SENIOR_MANAGER' ? seniorManagersList :
                                 selectedTreeRole === 'TEAM_LEADER' ? tlsList :
                                 managersList;
          const currentPerson = activeRoleList.find(p => p.id === selectedTreePersonId) || activeRoleList[0];
          const currentMgr = currentPerson;
          const activePersonId = currentPerson?.id;

          const subSrMgrs = selectedTreeRole === 'BRANCH_HEAD' && activePersonId
            ? seniorManagersList.filter(sm => sm.branch_head_id === activePersonId || sm.branch_head_name === currentPerson?.full_name)
            : [];

          const subManagers = selectedTreeRole === 'BRANCH_HEAD' && activePersonId
            ? managersList.filter(m => m.branch_head_id === activePersonId || m.branch_head_name === currentPerson?.full_name || subSrMgrs.some(sm => sm.id === m.senior_manager_id))
            : selectedTreeRole === 'SENIOR_MANAGER' && activePersonId
            ? managersList.filter(m => m.senior_manager_id === activePersonId || m.senior_manager_name === currentPerson?.full_name)
            : [];

          const managerTLs = selectedTreeRole === 'TEAM_LEADER'
            ? []
            : activePersonId
            ? tlsList.filter(tl => tl.manager_id === activePersonId || tl.manager_name === currentPerson?.full_name || subManagers.some(m => m.id === tl.manager_id))
            : [];

          const allManagerTCs = activePersonId
            ? (selectedTreeRole === 'TEAM_LEADER'
                ? targetEmployeeList.filter(tc => (tc.designation === 'TC' || tc.hierarchy_level === 'TC') && (tc.team_leader_id === activePersonId || tc.team_leader_name === currentPerson?.full_name))
                : targetEmployeeList.filter(tc => (tc.designation === 'TC' || tc.hierarchy_level === 'TC') && (
                    tc.manager_id === activePersonId || tc.manager_name === currentPerson?.full_name ||
                    managerTLs.some(tl => tl.id === tc.team_leader_id)
                  ))
              )
            : [];

          const directTCs = selectedTreeRole === 'TEAM_LEADER' ? allManagerTCs : allManagerTCs.filter(tc => !tc.team_leader_id && !tc.team_leader_name);

          const roleBadgeLabel = selectedTreeRole === 'BRANCH_HEAD' ? 'BRANCH HEAD' :
                                 selectedTreeRole === 'SENIOR_MANAGER' ? 'SENIOR MANAGER' :
                                 selectedTreeRole === 'TEAM_LEADER' ? 'TEAM LEADER' :
                                 'MANAGER';

          const roleBadgeColor = roleBadgeLabel === 'BRANCH HEAD' ? { bg: '#FEF3C7', color: '#D97706', border: '#FCD34D' } :
                                 roleBadgeLabel === 'SENIOR MANAGER' ? { bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' } :
                                 roleBadgeLabel === 'TEAM LEADER' ? { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' } :
                                 { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' };

          // Build TL to TC mapping for tree visualization
          const tlTcMapping = {};
          allManagerTCs.forEach(tc => {
            if (tc.team_leader_id) {
              if (!tlTcMapping[tc.team_leader_id]) {
                tlTcMapping[tc.team_leader_id] = [];
              }
              tlTcMapping[tc.team_leader_id].push(tc);
            }
          });

          return (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', minHeight: '500px', padding: isMobile ? '12px' : '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: C.text }}>
                    Team Hierarchy Tree <FaInfoCircle style={{ fontSize: '15px', color: C.textMid, cursor: 'pointer' }} title="Visualize and manage reporting structure" />
                  </h2>
                  <p style={{ fontSize: isMobile ? '12px' : '13px', color: C.textMid, margin: '4px 0 0' }}>
                    Select a role level and an employee to inspect their organizational hierarchy structure
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
                  <button 
                    onClick={fetchData} 
                    style={{ flex: isMobile ? 1 : 'none', background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <FaRedo style={{ fontSize: '12px', color: C.teal }} /> Refresh
                  </button>
                  <button 
                    onClick={handleExportTree} 
                    style={{ flex: isMobile ? 1 : 'none', background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <FaDownload style={{ fontSize: '12px', color: C.teal }} /> Export Tree
                  </button>
                </div>
              </div>

              {/* Selection Bar: Step 1 Role Selection & Step 2 Employee Selection */}
              <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: isMobile ? '14px' : '20px', marginBottom: '24px' }}>
                
                {/* Step 1: Select Role */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Step 1: Select Hierarchy Role Level
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    {[
                      { id: 'BRANCH_HEAD', label: 'Branch Heads', count: branchHeadsList.length, color: '#D97706' },
                      { id: 'SENIOR_MANAGER', label: 'Senior Managers', count: seniorManagersList.length, color: '#4F46E5' },
                      { id: 'MANAGER', label: 'Managers', count: managersList.length, color: '#8B5CF6' },
                      { id: 'TEAM_LEADER', label: 'Team Leaders (TL)', count: tlsList.length, color: '#2563EB' }
                    ].map(roleItem => {
                      const isSelectedRole = selectedTreeRole === roleItem.id;
                      return (
                        <button
                          key={roleItem.id}
                          onClick={() => {
                            setSelectedTreeRole(roleItem.id);
                            setSelectedTreePersonId(null);
                          }}
                          style={{
                            padding: isMobile ? '8px 10px' : '10px 18px',
                            borderRadius: '12px',
                            border: isSelectedRole ? `2px solid ${roleItem.color}` : `1px solid ${C.border}`,
                            background: isSelectedRole ? `${roleItem.color}15` : C.card,
                            color: isSelectedRole ? roleItem.color : C.text,
                            fontWeight: 800,
                            fontSize: isMobile ? '11.5px' : '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            boxShadow: isSelectedRole ? `0 4px 12px ${roleItem.color}25` : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <FaSitemap style={{ fontSize: '13px', flexShrink: 0 }} />
                            {roleItem.label}
                          </span>
                          <span style={{ 
                            background: isSelectedRole ? roleItem.color : C.bgSecondary, 
                            color: isSelectedRole ? '#FFFFFF' : C.textMid,
                            fontSize: '10.5px', fontWeight: 900, padding: '2px 6px', borderRadius: '10px', flexShrink: 0
                          }}>
                            {roleItem.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Select Person */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Step 2: Select {selectedTreeRole === 'BRANCH_HEAD' ? 'Branch Head' : selectedTreeRole === 'SENIOR_MANAGER' ? 'Senior Manager' : selectedTreeRole === 'TEAM_LEADER' ? 'Team Leader' : 'Manager'}
                  </div>

                  {activeRoleList.length === 0 ? (
                    <div style={{ padding: '16px', borderRadius: '12px', background: C.card, border: `1px dashed ${C.border}`, color: C.textMid, fontSize: '13px' }}>
                      No employees assigned as <strong>{selectedTreeRole.replace('_', ' ')}</strong> yet. Go to Directory tab and click "Assign Team" to set hierarchy levels.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div id="mgrCarousel" style={{ display: 'flex', gap: '12px', overflowX: 'auto', flexGrow: 1, paddingBottom: '4px', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
                        {activeRoleList.map(person => {
                          const isSelected = (person.id === activePersonId);
                          const memberCount = (
                            selectedTreeRole === 'BRANCH_HEAD' ? (seniorManagersList.filter(sm => sm.branch_head_id === person.id).length + managersList.filter(m => m.branch_head_id === person.id).length) :
                            selectedTreeRole === 'SENIOR_MANAGER' ? managersList.filter(m => m.senior_manager_id === person.id).length :
                            selectedTreeRole === 'TEAM_LEADER' ? targetEmployeeList.filter(tc => tc.team_leader_id === person.id).length :
                            (tlsList.filter(tl => tl.manager_id === person.id).length + targetEmployeeList.filter(tc => (tc.designation === 'TC' || tc.hierarchy_level === 'TC') && tc.manager_id === person.id).length)
                          );

                          return (
                            <div
                              key={person.id}
                              onClick={() => setSelectedTreePersonId(person.id)}
                              style={{
                                flexShrink: 0,
                                minWidth: isMobile ? '180px' : '210px',
                                padding: '12px 14px',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                background: isSelected ? 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)' : C.card,
                                color: isSelected ? '#FFFFFF' : C.text,
                                border: isSelected ? 'none' : `1px solid ${C.border}`,
                                boxShadow: isSelected ? '0 8px 20px rgba(79, 70, 229, 0.25)' : '0 2px 8px rgba(0,0,0,0.03)',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                            >
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.2)' : '#E0E7FF', color: isSelected ? '#FFF' : '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', flexShrink: 0 }}>
                                {person.full_name?.charAt(0) || 'P'}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{person.full_name}</div>
                                <div style={{ fontSize: '10.5px', opacity: isSelected ? 0.9 : 0.7, fontWeight: 700 }}>{person.employee_id}</div>
                                <div style={{ fontSize: '10.5px', fontWeight: 800, marginTop: '2px', opacity: isSelected ? 0.95 : 0.8 }}>
                                  {memberCount} Direct Members
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => {
                          const el = document.getElementById('mgrCarousel');
                          if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
                        }}
                        style={{ width: '34px', height: '34px', borderRadius: '50%', background: C.card, border: `1px solid ${C.border}`, color: C.textMid, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      >
                        <FaChevronRight style={{ fontSize: '12px' }} />
                      </button>
                    </div>
                  )}
                </div>

              </div>

                  {/* Visual Tree Diagram for Selected Manager */}
                  {currentMgr && (
                    <div onClick={() => setPopoverEmpId(null)} style={{ background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: '20px', padding: isMobile ? '16px 8px' : '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      
                      {/* LEVEL 1: ROOT NODE */}
                      <div style={{ background: '#FFFFFF', border: `2px solid ${roleBadgeColor.border}`, borderRadius: '16px', padding: isMobile ? '12px 14px' : '16px 20px', minWidth: isMobile ? '250px' : '320px', maxWidth: '380px', width: '100%', boxSizing: 'border-box', boxShadow: `0 10px 25px ${roleBadgeColor.color}18`, position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: roleBadgeColor.bg, color: roleBadgeColor.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15px', flexShrink: 0 }}>
                              {currentMgr.full_name?.charAt(0) || 'P'}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: isMobile ? '13.5px' : '15px', fontWeight: 900, color: '#1E293B', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                <span>{currentMgr.full_name}</span>
                                <span style={{ background: roleBadgeColor.bg, color: roleBadgeColor.color, border: `1px solid ${roleBadgeColor.border}`, fontSize: '9.5px', fontWeight: 900, padding: '2px 6px', borderRadius: '12px', textTransform: 'uppercase' }}>
                                  {roleBadgeLabel}
                                </span>
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700 }}>{currentMgr.employee_id}</div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPopoverEmpId(popoverEmpId === currentMgr.id ? null : currentMgr.id); }}
                            title="Employee Actions"
                            style={{ background: 'transparent', border: 'none', color: '#64748B', padding: '6px 8px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <FaEllipsisV />
                          </button>
                        </div>

                        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                          <span>📞 {currentMgr.mobile_number || 'N/A'}</span>
                          <span style={{ fontWeight: 800, color: roleBadgeColor.color }}>👤 Total Members: {(subSrMgrs?.length || 0) + (subManagers?.length || 0) + managerTLs.length + allManagerTCs.length}</span>
                        </div>

                        {/* Floating Context Popover Dropdown */}
                        {popoverEmpId === currentMgr.id && (
                          <div 
                            style={{ position: 'absolute', top: '48px', right: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '170px', padding: '6px 0' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div onClick={() => { setPopoverEmpId(null); handleOpen360View(currentMgr); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaEye style={{ fontSize: '13px', color: '#64748B' }} /> View Profile
                            </div>
                            <div onClick={() => { setPopoverEmpId(null); openHierarchyModal(currentMgr); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaEdit style={{ fontSize: '13px', color: '#64748B' }} /> Edit Details
                            </div>
                            <div onClick={() => { setPopoverEmpId(null); handleUnassignHierarchy(currentMgr.id, currentMgr.full_name, currentMgr.employee_id); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaUnlink style={{ fontSize: '13px', color: '#EF4444' }} /> Disassign Employee
                            </div>
                            <div onClick={() => { setPopoverEmpId(null); setPerfModalEmp(currentMgr); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaChartLine style={{ fontSize: '13px', color: '#64748B' }} /> View Performance
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sub-Tree Branches starting from Root Node */}
                      {(() => {
                        const hasMembers = (subSrMgrs?.length > 0) || (subManagers?.length > 0) || (managerTLs?.length > 0) || (allManagerTCs?.length > 0);
                        if (!hasMembers) {
                          return (
                            <div style={{ marginTop: '20px', padding: '20px', textAlign: 'center', color: C.textMid, fontSize: '13px' }}>
                              No sub-employees or team members assigned under <strong>{currentMgr.full_name}</strong> yet.<br/>
                              <span style={{ fontSize: '12px', color: C.teal, fontWeight: 700 }}>Go to the Directory tab and click "Assign Team" on an employee to link them to this {roleBadgeLabel.toLowerCase()}.</span>
                            </div>
                          );
                        }

                        const renderPopover = (emp) => {
                          if (popoverEmpId !== emp.id) return null;
                          return (
                            <div 
                              style={{ position: 'absolute', top: '44px', right: '10px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '170px', padding: '6px 0', textAlign: 'left' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div onClick={() => { setPopoverEmpId(null); handleOpen360View(emp); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaEye style={{ fontSize: '13px', color: '#64748B' }} /> View Profile
                              </div>
                              <div onClick={() => { setPopoverEmpId(null); openHierarchyModal(emp); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaEdit style={{ fontSize: '13px', color: '#64748B' }} /> Edit Details
                              </div>
                              <div onClick={() => { setPopoverEmpId(null); handleUnassignHierarchy(emp.id, emp.full_name, emp.employee_id); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaUnlink style={{ fontSize: '13px', color: '#EF4444' }} /> Disassign Employee
                              </div>
                              <div onClick={() => { setPopoverEmpId(null); setPerfModalEmp(emp); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaChartLine style={{ fontSize: '13px', color: '#64748B' }} /> View Performance
                              </div>
                            </div>
                          );
                        };

                        const renderSubTree = (parentEmp, parentRole) => {
                          let childRole = null;
                          let childrenList = [];

                          if (parentRole === 'BRANCH_HEAD') {
                            const srs = seniorManagersList.filter(sm => sm.branch_head_id === parentEmp.id || sm.branch_head_name === parentEmp.full_name);
                            if (srs.length > 0) {
                              childRole = 'SENIOR_MANAGER';
                              childrenList = srs;
                            } else {
                              const mgrs = managersList.filter(m => m.branch_head_id === parentEmp.id || m.branch_head_name === parentEmp.full_name);
                              childRole = 'MANAGER';
                              childrenList = mgrs;
                            }
                          } else if (parentRole === 'SENIOR_MANAGER') {
                            const mgrs = managersList.filter(m => m.senior_manager_id === parentEmp.id || m.senior_manager_name === parentEmp.full_name);
                            childRole = 'MANAGER';
                            childrenList = mgrs;
                          } else if (parentRole === 'MANAGER') {
                            const tls = tlsList.filter(tl => tl.manager_id === parentEmp.id || tl.manager_name === parentEmp.full_name);
                            childRole = 'TEAM_LEADER';
                            childrenList = tls;
                          } else if (parentRole === 'TEAM_LEADER') {
                            const tcs = targetEmployeeList.filter(tc => (tc.designation === 'TC' || tc.hierarchy_level === 'TC') && (tc.team_leader_id === parentEmp.id || tc.team_leader_name === parentEmp.full_name));
                            childRole = 'TC';
                            childrenList = tcs;
                          }

                          const directTCsForMgr = (parentRole === 'MANAGER') ? targetEmployeeList.filter(tc => (tc.designation === 'TC' || tc.hierarchy_level === 'TC') && (tc.manager_id === parentEmp.id || tc.manager_name === parentEmp.full_name) && !tc.team_leader_id && !tc.team_leader_name) : [];

                          if (childrenList.length === 0 && directTCsForMgr.length === 0) return null;

                          const stemColor = parentRole === 'BRANCH_HEAD' ? '#D97706' : parentRole === 'SENIOR_MANAGER' ? '#4F46E5' : parentRole === 'MANAGER' ? '#7C3AED' : '#2563EB';

                          return (
                            <>
                              <div style={{ width: '2px', height: '26px', background: stemColor, margin: '0 auto' }}></div>
                              <div style={{ width: '100%', overflowX: 'auto', padding: '0 10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', alignItems: 'flex-start', minWidth: 'max-content', margin: '0 auto' }}>
                                  
                                  {childrenList.map(child => {
                                    const childBadge = childRole === 'SENIOR_MANAGER' ? { label: 'SR MANAGER', bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' } :
                                                       childRole === 'MANAGER' ? { label: 'MANAGER', bg: '#F3E8FF', color: '#7C3AED', border: '#DDD6FE' } :
                                                       childRole === 'TEAM_LEADER' ? { label: 'TEAM LEADER', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' } :
                                                       { label: 'TELECALLER', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };

                                    if (childRole === 'TC') {
                                      return (
                                        <div 
                                          key={child.id} 
                                          style={{ background: '#FFFFFF', border: `1px solid ${childBadge.border}`, borderRadius: '16px', padding: '14px 12px', width: '135px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}
                                        >
                                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: childBadge.bg, color: childBadge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', marginBottom: '8px' }}>
                                            {child.full_name?.charAt(0) || 'T'}
                                          </div>
                                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '120px' }}>
                                            {child.full_name}
                                          </div>
                                          <span style={{ background: childBadge.bg, color: childBadge.color, border: `1px solid ${childBadge.border}`, fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            {childBadge.label}
                                          </span>
                                          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>{child.employee_id}</div>
                                          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{child.mobile_number || 'N/A'}</div>

                                          <button
                                            onClick={(e) => { e.stopPropagation(); setPopoverEmpId(popoverEmpId === child.id ? null : child.id); }}
                                            style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '4px', fontSize: '12px', cursor: 'pointer', marginTop: '6px' }}
                                          >
                                            <FaEllipsisV />
                                          </button>
                                          {renderPopover(child)}
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        
                                        {/* Stem line down to node */}
                                        <div style={{ width: '2px', height: '18px', background: childBadge.color }}></div>

                                        {/* Node Card */}
                                        <div style={{ background: '#FFFFFF', border: `2px solid ${childBadge.border}`, borderRadius: '16px', padding: isMobile ? '12px 14px' : '14px 18px', minWidth: isMobile ? '200px' : '250px', maxWidth: '290px', boxShadow: `0 8px 20px ${childBadge.color}15`, position: 'relative', zIndex: 9 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: childBadge.bg, color: childBadge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px' }}>
                                                {child.full_name?.charAt(0) || 'E'}
                                              </div>
                                              <div>
                                                <div style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                  {child.full_name}
                                                  <span style={{ background: childBadge.bg, color: childBadge.color, border: `1px solid ${childBadge.border}`, fontSize: '9.5px', fontWeight: 900, padding: '2px 6px', borderRadius: '10px' }}>
                                                    {childBadge.label}
                                                  </span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>{child.employee_id}</div>
                                              </div>
                                            </div>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setPopoverEmpId(popoverEmpId === child.id ? null : child.id); }}
                                              style={{ background: 'transparent', border: 'none', color: '#64748B', padding: '4px 8px', fontSize: '13px', cursor: 'pointer' }}
                                            >
                                              <FaEllipsisV />
                                            </button>
                                          </div>

                                          <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                                            <span>📞 {child.mobile_number || 'N/A'}</span>
                                          </div>
                                          {renderPopover(child)}
                                        </div>

                                        {/* Recursive Sub-tree */}
                                        {renderSubTree(child, childRole)}

                                      </div>
                                    );
                                  })}

                                  {/* Direct TCs under Manager if any */}
                                  {directTCsForMgr.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                      <div style={{ width: '2px', height: '18px', background: '#F59E0B' }}></div>
                                      <div style={{ background: '#FFFBEB', border: `1px solid #FCD34D`, borderRadius: '16px', padding: '10px 14px', marginBottom: '12px', textAlign: 'center' }}>
                                        <span style={{ background: '#F59E0B', color: '#FFF', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px' }}>
                                          DIRECT MEMBERS ({directTCsForMgr.length})
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {directTCsForMgr.map(tc => (
                                          <div 
                                            key={tc.id} 
                                            style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px 12px', width: '135px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}
                                          >
                                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', marginBottom: '8px' }}>
                                              {tc.full_name?.charAt(0) || 'T'}
                                            </div>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '120px' }}>
                                              {tc.full_name}
                                            </div>
                                            <span style={{ background: '#D1FAE5', color: '#047857', fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                              TELECALLER
                                            </span>
                                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>{tc.employee_id}</div>
                                            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{tc.mobile_number || 'N/A'}</div>

                                            <button
                                              onClick={(e) => { e.stopPropagation(); setPopoverEmpId(popoverEmpId === tc.id ? null : tc.id); }}
                                              style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '4px', fontSize: '12px', cursor: 'pointer', marginTop: '6px' }}
                                            >
                                              <FaEllipsisV />
                                            </button>
                                            {renderPopover(tc)}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                </div>
                              </div>
                            </>
                          );
                        };

                        return renderSubTree(currentMgr, selectedTreeRole);
                      })()}

                      {/* Bottom Stats Summary Bar & Legend */}
                      <div style={{ width: '100%', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {selectedTreeRole === 'BRANCH_HEAD' && (
                            <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: 900, color: '#D97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#D97706', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{subSrMgrs.length}</div>
                              Sr. Managers
                            </div>
                          )}
                          {(selectedTreeRole === 'BRANCH_HEAD' || selectedTreeRole === 'SENIOR_MANAGER') && (
                            <div style={{ background: '#EDE9FE', border: '1px solid #DDD6FE', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: 900, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#7C3AED', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{subManagers.length}</div>
                              Managers
                            </div>
                          )}
                          {selectedTreeRole !== 'TEAM_LEADER' && (
                            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: 900, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{managerTLs.length}</div>
                              Team Leaders
                            </div>
                          )}
                          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: 900, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#059669', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{allManagerTCs.length}</div>
                            Telecallers
                          </div>
                          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: 900, color: '#D97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#D97706', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
                              {1 + (subSrMgrs?.length || 0) + (subManagers?.length || 0) + managerTLs.length + allManagerTCs.length}
                            </div>
                            Total Employees
                          </div>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', fontWeight: 700, color: '#64748B' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706' }}></span> Branch Head</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4F46E5' }}></span> Sr Manager</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7C3AED' }}></span> Manager</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }}></span> Team Leader</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }}></span> Telecaller</span>
                        </div>
                      </div>

                    </div>
                  )}
            </div>
          );
        })()}

        {/* Manage Bonus & Targets Tab View */}
        {activeTab === 'bonus' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', minHeight: '450px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaCoins style={{ color: '#D97706' }} /> Employee Bonus & Department Target Manager
                </h2>
                <div style={{ fontSize: '12.5px', color: C.textMid, marginTop: '4px' }}>
                  Assign period targets (e.g., 10 cards) & card bonus amounts for each employee and department
                </div>
              </div>
              <button 
                onClick={() => openBonusModal()} 
                style={{ 
                  background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', 
                  borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' 
                }}
              >
                <FaPlus /> + Create Bonus Target
              </button>
            </div>

            {/* Configured Bonus Rules List */}
            <div style={{ marginTop: '16px' }}>
              {loadingRules ? (
                <div style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>Loading bonus rules...</div>
              ) : bonusRulesList.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: C.textMid, background: C.bgSecondary, borderRadius: '16px' }}>
                  No bonus targets configured yet. Click "+ Create Bonus Target" to configure your first target & bonus rule.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                  {bonusRulesList.map(rule => (
                    <div key={rule.id} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: C.text }}>{rule.employee_name}</div>
                          <div style={{ fontSize: '12px', color: C.teal, fontWeight: 800 }}>ID: {rule.emp_code} | {rule.employee_designation || 'TC'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '10px', background: `${C.teal}15`, color: C.teal, fontSize: '12px', fontWeight: 900 }}>
                            {rule.bank_name}
                          </span>
                          <button onClick={() => handleDeleteBonusRule(rule.id)} style={{ background: '#EF444415', border: 'none', color: '#EF4444', padding: '6px', borderRadius: '8px', cursor: 'pointer' }} title="Delete Rule">
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px', fontWeight: 800 }}>
                          <span>Target Progress: <strong style={{ color: C.teal }}>{rule.approved_count} / {rule.target_count} Approved Cards</strong></span>
                          {rule.target_achieved ? (
                            <span style={{ padding: '3px 8px', borderRadius: '8px', background: '#10B98118', color: '#10B981', fontWeight: 900, fontSize: '12px' }}>
                              ✓ Unlocked: ₹{Number(rule.earned_bonus || 0).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span style={{ padding: '3px 8px', borderRadius: '8px', background: '#F59E0B18', color: '#D97706', fontWeight: 800, fontSize: '12px' }}>
                              🔒 Bonus Locked
                            </span>
                          )}
                        </div>

                        <div style={{ width: '100%', background: C.bgSecondary, height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                          <div style={{ width: `${rule.progress_percentage}%`, background: rule.target_achieved ? '#10B981' : '#F59E0B', height: '100%', transition: 'width 0.4s ease' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: C.textMid, fontWeight: 700 }}>
                          <span>
                            {rule.target_achieved ? (
                              <strong style={{ color: '#10B981' }}>Target Achieved (Unlocked for {rule.employee_name})</strong>
                            ) : (
                              <span style={{ color: '#D97706' }}>Needs {rule.remaining_count} more cards to unlock bonus</span>
                            )}
                          </span>
                          <span>Bonus Rate: <strong>₹{rule.bonus_per_card} / Card</strong></span>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: C.textMid, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaCalendarAlt style={{ color: C.teal }} /> Active Period: <strong>{new Date(rule.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(rule.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Links Tab View */}
        {activeTab === 'links' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', minHeight: '450px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUniversity style={{ color: C.teal }} /> Employee-Specific Product Referral Links & Fixed Incentives</h2>
            <p style={{ fontSize: '13px', color: C.textMid, marginBottom: '20px' }}>
              Unlike Partner Commission URLs, employee referral links are isolated per employee record using <code>employee_product_links</code>.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                    <th style={{ padding: '12px 16px' }}>Employee</th>
                    <th style={{ padding: '12px 16px' }}>Designation</th>
                    <th style={{ padding: '12px 16px' }}>Active Links Count</th>
                    <th style={{ padding: '12px 16px' }}>Incentives Earned</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800 }}>
                        {emp.full_name} <span style={{ color: C.teal, fontWeight: 900 }}>({emp.employee_id})</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{emp.designation}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800 }}>{emp.active_links_count || 0} Products Assigned</td>
                      <td style={{ padding: '12px 16px', fontWeight: 900, color: '#10B981' }}>₹{emp.total_incentives_earned || 0}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => setLinkModalEmp(emp)} style={{ background: C.teal, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                          + Assign Product Link
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MODAL: 360° Employee View Inspector ── */}
        {selectedEmp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: C.card, borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}` }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: C.teal, textTransform: 'uppercase' }}>Employee 360° Profile Inspector</span>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: C.text }}>{selectedEmp.full_name} ({selectedEmp.employee_id})</h2>
                </div>
                <button onClick={() => setSelectedEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>✕</button>
              </div>

              {loading360 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>Loading 360 details...</div>
              ) : emp360Data && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Profile Summary Card */}
                  <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Mobile Number</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{emp360Data.employee.mobile_number}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Email Address</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{emp360Data.employee.email_id}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Designation</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: C.teal }}>{emp360Data.employee.designation}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Department</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{emp360Data.employee.department}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Offered Salary</div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#10B981' }}>₹{emp360Data.employee.offered_salary || 0} / month</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Joining Date</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{emp360Data.employee.joining_date ? new Date(emp360Data.employee.joining_date).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>

                  {/* Joining Form & KYC Inspection Card */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '14px', color: C.teal, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaUserCircle /> Submitted Joining Form & Verification Details
                    </h3>
                    
                    {emp360Data.joining_details ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>1. Full Name & Email</span>
                          <strong>{emp360Data.joining_details.full_name}</strong>
                          <div style={{ fontSize: '12px', color: C.textMid }}>{emp360Data.joining_details.email_id}</div>
                        </div>

                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>2. Role & Department</span>
                          <strong>{emp360Data.joining_details.designation}</strong>
                          <div style={{ fontSize: '12px', color: C.textMid }}>{emp360Data.joining_details.department}</div>
                        </div>

                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>3. Salary & Joining Date</span>
                          <strong style={{ color: '#10B981' }}>₹{emp360Data.joining_details.offered_salary} / mo</strong>
                          <div style={{ fontSize: '12px', color: C.textMid }}>Joining: {emp360Data.joining_details.joining_date ? new Date(emp360Data.joining_details.joining_date).toLocaleDateString() : 'N/A'}</div>
                        </div>

                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>4. PAN & Aadhaar</span>
                          <strong>PAN: {emp360Data.joining_details.pan_number || 'N/A'}</strong>
                          <div style={{ fontSize: '12px', color: C.textMid }}>Aadhaar: {emp360Data.joining_details.aadhaar_number || 'N/A'}</div>
                        </div>

                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>5. Bank Account Details</span>
                          <strong>A/C: {emp360Data.joining_details.bank_account_number || 'N/A'}</strong>
                          <div style={{ fontSize: '12px', color: C.textMid }}>IFSC: {emp360Data.joining_details.ifsc_code || 'N/A'} ({emp360Data.joining_details.bank_account_holder_name})</div>
                        </div>

                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>6. Qualification & Status</span>
                          <strong>{emp360Data.joining_details.highest_qualification} ({emp360Data.joining_details.experience_type})</strong>
                          <div style={{ fontSize: '12px', color: C.teal, fontWeight: 800 }}>Form Status: {emp360Data.joining_details.form_status}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: C.textMid, fontStyle: 'italic' }}>
                        Joining Details Form has not been submitted by employee yet.
                      </div>
                    )}
                  </div>

                  {/* Submitted KYC & Verification Documents Panel */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: C.teal, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaIdCard /> Submitted KYC Documents & Verification Details
                      </h3>
                      <span style={{
                        padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                        background: emp360Data.kyc?.kyc_status === 'VERIFIED' ? '#D1FAE5' : (emp360Data.kyc?.kyc_status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7'),
                        color: emp360Data.kyc?.kyc_status === 'VERIFIED' ? '#065F46' : (emp360Data.kyc?.kyc_status === 'REJECTED' ? '#991B1B' : '#92400E')
                      }}>
                        KYC STATUS: {emp360Data.kyc?.kyc_status || 'PENDING'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
                      
                      {/* PAN Card Box */}
                      <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>1. PAN Card</span>
                            <span style={{
                              fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                              background: emp360Data.kyc?.pan_status === 'VERIFIED' ? '#D1FAE5' : (emp360Data.kyc?.pan_status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7'),
                              color: emp360Data.kyc?.pan_status === 'VERIFIED' ? '#065F46' : (emp360Data.kyc?.pan_status === 'REJECTED' ? '#991B1B' : '#92400E')
                            }}>
                              {emp360Data.kyc?.pan_status || (emp360Data.kyc?.pan_verified ? 'VERIFIED' : 'PENDING')}
                            </span>
                          </div>
                          <strong style={{ fontSize: '14px', letterSpacing: '0.5px', display: 'block' }}>{emp360Data.kyc?.pan_number || emp360Data.joining_details?.pan_number || 'Not Submitted'}</strong>
                          {emp360Data.kyc?.pan_rejection_reason && (
                            <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px', background: '#FEF2F2', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #EF4444' }}>
                              ⚠️ {emp360Data.kyc.pan_rejection_reason}
                            </div>
                          )}
                          {emp360Data.kyc?.pan_document_url ? (
                            <a href={emp360Data.kyc.pan_document_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: C.card, border: `1px solid ${C.border}`, padding: '6px 10px', borderRadius: '8px', color: C.teal, fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>
                              <FaFileAlt /> View Doc ↗
                            </a>
                          ) : (
                            <div style={{ fontSize: '11px', color: C.textMid, marginTop: '8px' }}>No PAN file attached</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: `1px dashed ${C.border}` }}>
                          <button onClick={() => handleDocVerify(selectedEmp.id, 'pan', 'VERIFIED')} style={{ flex: 1, background: '#10B981', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '11px' }}>
                            ✓ Approve
                          </button>
                          <button onClick={() => handleDocVerify(selectedEmp.id, 'pan', 'REJECTED')} style={{ flex: 1, background: '#EF4444', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '11px' }}>
                            ✕ Reject
                          </button>
                        </div>
                      </div>

                      {/* Aadhaar Card Box */}
                      <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>2. Aadhaar Card</span>
                            <span style={{
                              fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                              background: emp360Data.kyc?.aadhaar_status === 'VERIFIED' ? '#D1FAE5' : (emp360Data.kyc?.aadhaar_status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7'),
                              color: emp360Data.kyc?.aadhaar_status === 'VERIFIED' ? '#065F46' : (emp360Data.kyc?.aadhaar_status === 'REJECTED' ? '#991B1B' : '#92400E')
                            }}>
                              {emp360Data.kyc?.aadhaar_status || (emp360Data.kyc?.aadhaar_verified ? 'VERIFIED' : 'PENDING')}
                            </span>
                          </div>
                          <strong style={{ fontSize: '14px', letterSpacing: '0.5px', display: 'block' }}>{emp360Data.kyc?.aadhaar_number || emp360Data.joining_details?.aadhaar_number || 'Not Submitted'}</strong>
                          {emp360Data.kyc?.aadhaar_rejection_reason && (
                            <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px', background: '#FEF2F2', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #EF4444' }}>
                              ⚠️ {emp360Data.kyc.aadhaar_rejection_reason}
                            </div>
                          )}
                          {emp360Data.kyc?.aadhaar_document_url ? (
                            <a href={emp360Data.kyc.aadhaar_document_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: C.card, border: `1px solid ${C.border}`, padding: '6px 10px', borderRadius: '8px', color: C.teal, fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>
                              <FaFileAlt /> View Doc ↗
                            </a>
                          ) : (
                            <div style={{ fontSize: '11px', color: C.textMid, marginTop: '8px' }}>No Aadhaar file attached</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: `1px dashed ${C.border}` }}>
                          <button onClick={() => handleDocVerify(selectedEmp.id, 'aadhaar', 'VERIFIED')} style={{ flex: 1, background: '#10B981', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '11px' }}>
                            ✓ Approve
                          </button>
                          <button onClick={() => handleDocVerify(selectedEmp.id, 'aadhaar', 'REJECTED')} style={{ flex: 1, background: '#EF4444', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '11px' }}>
                            ✕ Reject
                          </button>
                        </div>
                      </div>

                      {/* Bank Proof Box */}
                      <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>3. Bank Account Proof</span>
                            <span style={{
                              fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                              background: emp360Data.kyc?.bank_status === 'VERIFIED' ? '#D1FAE5' : (emp360Data.kyc?.bank_status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7'),
                              color: emp360Data.kyc?.bank_status === 'VERIFIED' ? '#065F46' : (emp360Data.kyc?.bank_status === 'REJECTED' ? '#991B1B' : '#92400E')
                            }}>
                              {emp360Data.kyc?.bank_status || (emp360Data.kyc?.bank_verified ? 'VERIFIED' : 'PENDING')}
                            </span>
                          </div>
                          <strong style={{ fontSize: '13px' }}>A/C: {emp360Data.kyc?.bank_account_number || emp360Data.joining_details?.bank_account_number || 'N/A'}</strong>
                          <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>IFSC: {emp360Data.kyc?.ifsc_code || emp360Data.joining_details?.ifsc_code || 'N/A'}</div>
                          {emp360Data.kyc?.bank_rejection_reason && (
                            <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px', background: '#FEF2F2', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #EF4444' }}>
                              ⚠️ {emp360Data.kyc.bank_rejection_reason}
                            </div>
                          )}
                          {emp360Data.kyc?.bank_document_url ? (
                            <a href={emp360Data.kyc.bank_document_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: C.card, border: `1px solid ${C.border}`, padding: '6px 10px', borderRadius: '8px', color: C.teal, fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>
                              <FaFileAlt /> View Doc ↗
                            </a>
                          ) : (
                            <div style={{ fontSize: '11px', color: C.textMid, marginTop: '8px' }}>No Bank file attached</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: `1px dashed ${C.border}` }}>
                          <button onClick={() => handleDocVerify(selectedEmp.id, 'bank', 'VERIFIED')} style={{ flex: 1, background: '#10B981', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '11px' }}>
                            ✓ Approve
                          </button>
                          <button onClick={() => handleDocVerify(selectedEmp.id, 'bank', 'REJECTED')} style={{ flex: 1, background: '#EF4444', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '11px' }}>
                            ✕ Reject
                          </button>
                        </div>
                      </div>

                      {/* Verification Video Box */}
                      <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>4. Verification Video</span>
                            <span style={{
                              fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                              background: emp360Data.kyc?.video_status === 'VERIFIED' || emp360Data.checklist?.terms_completed ? '#D1FAE5' : (emp360Data.kyc?.video_status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7'),
                              color: emp360Data.kyc?.video_status === 'VERIFIED' || emp360Data.checklist?.terms_completed ? '#065F46' : (emp360Data.kyc?.video_status === 'REJECTED' ? '#991B1B' : '#92400E')
                            }}>
                              {emp360Data.kyc?.video_status || (emp360Data.checklist?.terms_completed ? 'VERIFIED' : (emp360Data.terms?.video_url ? 'SUBMITTED' : 'PENDING'))}
                            </span>
                          </div>
                          <strong style={{ fontSize: '13px' }}>{emp360Data.terms?.video_url ? '🎥 Recording Submitted' : 'Not Uploaded'}</strong>
                          {emp360Data.kyc?.video_rejection_reason && (
                            <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px', background: '#FEF2F2', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #EF4444' }}>
                              ⚠️ {emp360Data.kyc.video_rejection_reason}
                            </div>
                          )}
                          {emp360Data.terms?.video_url ? (
                            <a href={emp360Data.terms.video_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: C.teal, color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>
                              <FaVideo /> Play Video ↗
                            </a>
                          ) : (
                            <div style={{ fontSize: '11px', color: C.textMid, marginTop: '8px' }}>No video recording</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: `1px dashed ${C.border}` }}>
                          <button onClick={() => handleDocVerify(selectedEmp.id, 'video', 'VERIFIED')} style={{ flex: 1, background: '#10B981', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '11px' }}>
                            ✓ Approve
                          </button>
                          <button onClick={() => handleDocVerify(selectedEmp.id, 'video', 'REJECTED')} style={{ flex: 1, background: '#EF4444', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '11px' }}>
                            ✕ Reject
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Overall KYC Quick Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: `1px dashed ${C.border}`, paddingTop: '14px' }}>
                      <button onClick={() => handleKycVerify(selectedEmp.id, 'VERIFIED')} style={{ background: '#10B981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <FaCheck /> Approve All KYC & Activate Account
                      </button>
                      <button onClick={() => handleKycVerify(selectedEmp.id, 'REJECTED')} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <FaTimesCircle /> Bulk Reject KYC
                      </button>
                    </div>
                  </div>

                  {/* Onboarding Checklist Matrix */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '12px', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheckCircle style={{ color: C.teal }} /> Onboarding & Verification Status Checklist</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      {[
                        { label: 'Interview Completed', status: emp360Data.checklist?.interview_completed },
                        { label: 'Employee Created', status: emp360Data.checklist?.employee_created },
                        { label: 'Terms & Video', status: emp360Data.checklist?.terms_completed },
                        { label: 'Joining Form', status: emp360Data.checklist?.joining_form_completed },
                        { label: 'KYC Verified', status: emp360Data.checklist?.kyc_verified },
                        { label: 'Activated', status: emp360Data.checklist?.activated }
                      ].map((item, i) => (
                        <div key={i} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.status ? <FaCheckCircle style={{ color: '#10B981' }} /> : <FaClock style={{ color: '#F59E0B' }} />}
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '12px', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}><FaFileAlt style={{ color: C.teal }} /> Uploaded Employee Verification Documents</h3>
                    {(() => {
                      const uniqueDocs = [];
                      const seenTypes = new Set();
                      (emp360Data.documents || []).forEach(doc => {
                        const typeKey = (doc.document_type || '').toLowerCase().trim();
                        if (typeKey && !seenTypes.has(typeKey)) {
                          seenTypes.add(typeKey);
                          uniqueDocs.push(doc);
                        }
                      });

                      if (uniqueDocs.length === 0) {
                        return <div style={{ fontSize: '12px', color: C.textMid }}>No verification documents uploaded yet.</div>;
                      }

                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          {uniqueDocs.map(doc => (
                            <a key={doc.id} href={doc.document_url} target="_blank" rel="noopener noreferrer" style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '10px 14px', borderRadius: '10px', textDecoration: 'none', color: C.teal, fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaFileAlt /> {(doc.document_type || 'DOCUMENT').toUpperCase().replace('_', ' ')} ↗
                            </a>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Assigned Product Referral Links */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '12px', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}><FaLink style={{ color: C.teal }} /> Assigned Referral Links & Incentive Rules</h3>
                    {emp360Data.product_links?.length === 0 ? (
                      <div style={{ fontSize: '12px', color: C.textMid }}>No product referral links assigned to this employee.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {emp360Data.product_links.map(pl => (
                          <div key={pl.id} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: 800 }}>{pl.product_name}</span>
                              <div style={{ fontSize: '11px', color: C.textMid }}>URL: {pl.employee_referral_url}</div>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 900, color: '#10B981' }}>
                              ₹{pl.incentive_amount} Incentive ({pl.incentive_type})
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                    <button onClick={() => handleActivateEmployee(selectedEmp.id, selectedEmp.activation_status)} style={{ background: selectedEmp.activation_status === 'APPROVED' ? '#EF4444' : '#10B981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                      {selectedEmp.activation_status === 'APPROVED' ? 'Deactivate Employee' : 'Verify & Activate Account'}
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MODAL: Assign Product Link & Incentive ── */}
        {linkModalEmp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: C.card, borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '520px', border: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '0 0 8px 0' }}>Assign Product Link & Employee Incentive</h2>
              <p style={{ fontSize: '14px', color: C.textMid, marginBottom: '20px' }}>Employee: <strong>{linkModalEmp.full_name} ({linkModalEmp.employee_id})</strong></p>

              <form onSubmit={handleAssignLinkSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Select Product *</label>
                  <select required value={linkForm.product_id} onChange={(e) => setLinkForm({ ...linkForm, product_id: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                    <option value="">Select Product...</option>
                    {productsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Employee Incentive Amount (₹) *</label>
                  <input type="number" required value={linkForm.incentive_amount} onChange={(e) => setLinkForm({ ...linkForm, incentive_amount: e.target.value })} placeholder="e.g. 500" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  <span style={{ fontSize: '11px', color: C.textMid }}>Separate from Partner commission rules.</span>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Custom Referral URL (Optional)</label>
                  <input type="url" value={linkForm.employee_referral_url} onChange={(e) => setLinkForm({ ...linkForm, employee_referral_url: e.target.value })} placeholder={`Auto-generated: https://gharkapaisa.in/apply/...?emp=${linkModalEmp.employee_id}`} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setLinkModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Save & Assign Link</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: Super Admin Create New Employee ── */}
        {createEmpModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: C.card, borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}`, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal, textTransform: 'uppercase' }}>Super Admin Action</span>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: 0 }}>Create New Employee & Assign Hierarchy</h2>
                </div>
                <button onClick={() => setCreateEmpModalOpen(false)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>✕</button>
              </div>

              <form onSubmit={handleCreateEmployeeSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, marginBottom: '6px', color: C.text }}>Full Name *</label>
                    <input type="text" required value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} placeholder="e.g. Ramesh Kumar" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, marginBottom: '6px', color: C.text }}>Mobile Number *</label>
                    <input type="tel" required value={createForm.mobile_number} onChange={(e) => setCreateForm({ ...createForm, mobile_number: e.target.value })} placeholder="10-digit mobile" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, marginBottom: '6px', color: C.text }}>Email Address (Optional)</label>
                    <input type="email" value={createForm.email_id} onChange={(e) => setCreateForm({ ...createForm, email_id: e.target.value })} placeholder="auto-generated if empty" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, marginBottom: '6px', color: C.text }}>Monthly Salary (₹)</label>
                    <input type="number" value={createForm.offered_salary} onChange={(e) => setCreateForm({ ...createForm, offered_salary: e.target.value })} placeholder="25000" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, marginBottom: '6px', color: C.text }}>Hierarchy Level / Role *</label>
                  <select 
                    value={createForm.hierarchy_level} 
                    onChange={(e) => {
                      const level = e.target.value;
                      const mapD = { 'BRANCH_HEAD': 'Branch Head', 'SENIOR_MANAGER': 'Senior Manager', 'MANAGER': 'Manager', 'TEAM_LEADER': 'Team Leader', 'TC': 'TC' };
                      setCreateForm({ ...createForm, hierarchy_level: level, designation: mapD[level] || level });
                    }} 
                    style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px', fontWeight: 800 }}
                  >
                    <option value="BRANCH_HEAD">Level 1: Branch Head</option>
                    <option value="SENIOR_MANAGER">Level 2: Senior Manager</option>
                    <option value="MANAGER">Level 3: Manager</option>
                    <option value="TEAM_LEADER">Level 4: Team Leader (TL)</option>
                    <option value="TC">Level 5: Telecaller (TC)</option>
                  </select>
                </div>

                {/* Reporting Supervisors Fields */}
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: C.teal, display: 'block', marginBottom: '10px' }}>Reporting Chain Setup</span>

                  {createForm.hierarchy_level !== 'BRANCH_HEAD' && (
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Assign Branch Head (Level 1)</label>
                      <select value={createForm.branch_head_id} onChange={(e) => setCreateForm({ ...createForm, branch_head_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '12.5px' }}>
                        <option value="">Direct / No Branch Head</option>
                        {selectBranchHeadsOptions.map(bh => (
                          <option key={bh.id} value={bh.id}>{bh.full_name} ({bh.employee_id})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(createForm.hierarchy_level === 'MANAGER' || createForm.hierarchy_level === 'TEAM_LEADER' || createForm.hierarchy_level === 'TC') && (
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Assign Senior Manager (Level 2)</label>
                      <select value={createForm.senior_manager_id} onChange={(e) => setCreateForm({ ...createForm, senior_manager_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '12.5px' }}>
                        <option value="">No Senior Manager</option>
                        {selectSeniorManagersOptions.map(sm => (
                          <option key={sm.id} value={sm.id}>{sm.full_name} ({sm.employee_id})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(createForm.hierarchy_level === 'TEAM_LEADER' || createForm.hierarchy_level === 'TC') && (
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Assign Reporting Manager (Level 3)</label>
                      <select value={createForm.manager_id} onChange={(e) => setCreateForm({ ...createForm, manager_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '12.5px' }}>
                        <option value="">No Manager</option>
                        {selectManagersOptions.map(m => (
                          <option key={m.id} value={m.id}>{m.full_name} ({m.employee_id})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {createForm.hierarchy_level === 'TC' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Assign Team Leader (Level 4)</label>
                      <select value={createForm.team_leader_id} onChange={(e) => setCreateForm({ ...createForm, team_leader_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '12.5px' }}>
                        <option value="">No Team Leader</option>
                        {selectTlsOptions.map(tl => (
                          <option key={tl.id} value={tl.id}>{tl.full_name} ({tl.employee_id})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setCreateEmpModalOpen(false)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Create Employee</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: Assign Hierarchy / Team (5-Level) ── */}
        {hierarchyModalEmp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: C.card, borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '0 0 4px 0' }}>Assign Team & Employee Hierarchy</h2>
              <p style={{ fontSize: '13.5px', color: C.textMid, marginBottom: '20px' }}>
                Employee: <strong>{hierarchyModalEmp.full_name} ({hierarchyModalEmp.employee_id})</strong>
              </p>

              <form onSubmit={handleAssignHierarchySubmit}>
                {/* 1. Employee Role Selection */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: C.text }}>
                    Employee Hierarchy Level / Role *
                  </label>
                  <select 
                    value={hierarchyForm.hierarchy_level} 
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setHierarchyForm({
                        ...hierarchyForm,
                        hierarchy_level: newRole,
                        selected_sm_ids: [],
                        selected_mgr_ids: [],
                        selected_tl_ids: [],
                        selected_tc_ids: [],
                        tl_tc_mapping: {},
                        branch_head_id: '',
                        senior_manager_id: '',
                        manager_id: '',
                        team_leader_id: ''
                      });
                    }} 
                    style={{ width: '100%', padding: '11px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px', fontWeight: 800 }}
                  >
                    <option value="BRANCH_HEAD">Level 1: BRANCH HEAD</option>
                    <option value="SENIOR_MANAGER">Level 2: SENIOR MANAGER</option>
                    <option value="MANAGER">Level 3: MANAGER</option>
                    <option value="TEAM_LEADER">Level 4: TL (Team Leader)</option>
                    <option value="TC">Level 5: TC (Telecaller)</option>
                  </select>
                </div>

                {/* 2. DYNAMIC REPORTING SUPERVISOR FIELDS */}
                {hierarchyForm.hierarchy_level !== 'BRANCH_HEAD' && (
                  <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px', marginBottom: '18px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: C.teal, display: 'block', marginBottom: '10px' }}>Reporting Supervisors</span>

                    {/* Branch Head (Level 1) */}
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Assign Branch Head (Level 1)</label>
                      <select value={hierarchyForm.branch_head_id} onChange={(e) => setHierarchyForm({ ...hierarchyForm, branch_head_id: e.target.value })} style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '13px' }}>
                        <option value="">Direct / No Branch Head</option>
                        {selectBranchHeadsOptions.map(bh => (
                          <option key={bh.id} value={bh.id}>{bh.full_name} ({bh.employee_id})</option>
                        ))}
                      </select>
                    </div>

                    {/* Senior Manager (Level 2) */}
                    {(hierarchyForm.hierarchy_level === 'MANAGER' || hierarchyForm.hierarchy_level === 'TEAM_LEADER' || hierarchyForm.hierarchy_level === 'TC') && (
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Assign Senior Manager (Level 2)</label>
                        <select value={hierarchyForm.senior_manager_id} onChange={(e) => setHierarchyForm({ ...hierarchyForm, senior_manager_id: e.target.value })} style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '13px' }}>
                          <option value="">No Senior Manager</option>
                          {selectSeniorManagersOptions.map(sm => (
                            <option key={sm.id} value={sm.id}>{sm.full_name} ({sm.employee_id})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Manager (Level 3) */}
                    {(hierarchyForm.hierarchy_level === 'TEAM_LEADER' || hierarchyForm.hierarchy_level === 'TC') && (
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Assign Manager (Level 3)</label>
                        <select value={hierarchyForm.manager_id} onChange={(e) => setHierarchyForm({ ...hierarchyForm, manager_id: e.target.value })} style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '13px' }}>
                          <option value="">No Manager</option>
                          {selectManagersOptions.map(m => (
                            <option key={m.id} value={m.id}>{m.full_name} ({m.employee_id})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Team Leader (Level 4) */}
                    {hierarchyForm.hierarchy_level === 'TC' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Assign Team Leader (Level 4)</label>
                        <select value={hierarchyForm.team_leader_id} onChange={(e) => setHierarchyForm({ ...hierarchyForm, team_leader_id: e.target.value })} style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '13px' }}>
                          <option value="">No Team Leader</option>
                          {selectTlsOptions.map(tl => (
                            <option key={tl.id} value={tl.id}>{tl.full_name} ({tl.employee_id})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. DOWNSTREAM TEAM SELECTION FOR ALL ROLES */}
                {hierarchyForm.hierarchy_level !== 'TC' && (
                  <div style={{ marginBottom: '10px' }}>
                    <input 
                      type="text"
                      placeholder="🔍 Search candidates by name, employee ID, or role..."
                      value={subordinateSearchText}
                      onChange={(e) => setSubordinateSearchText(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12.5px', color: C.text }}
                    />
                  </div>
                )}

                {hierarchyForm.hierarchy_level === 'BRANCH_HEAD' && (() => {
                  const candidateSMs = targetEmployeeList
                    .filter(e => e.id !== hierarchyModalEmp.id)
                    .filter(e => {
                      if (!subordinateSearchText.trim()) return true;
                      const q = subordinateSearchText.toLowerCase().trim();
                      return (e.full_name || '').toLowerCase().includes(q) || (e.employee_id || '').toLowerCase().includes(q) || (e.designation || '').toLowerCase().includes(q);
                    })
                    .sort((a, b) => {
                      const matchA = (a.designation || '').toLowerCase().includes('senior manager') || a.hierarchy_level === 'SENIOR_MANAGER';
                      const matchB = (b.designation || '').toLowerCase().includes('senior manager') || b.hierarchy_level === 'SENIOR_MANAGER';
                      if (matchA && !matchB) return -1;
                      if (!matchA && matchB) return 1;
                      return (a.full_name || '').localeCompare(b.full_name || '');
                    });

                  return (
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '4px', color: C.text }}>
                        Select Senior Manager(s) under this Branch Head ({hierarchyForm.selected_sm_ids?.length || 0} selected)
                      </label>
                      <div style={{ maxHeight: '180px', overflowY: 'auto', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '8px' }}>
                        {candidateSMs.length === 0 ? (
                          <div style={{ fontSize: '12px', color: C.textMid, padding: '12px', textAlign: 'center' }}>No matching candidates found</div>
                        ) : (
                          candidateSMs.map(sm => {
                            const checked = (hierarchyForm.selected_sm_ids || []).includes(sm.id);
                            const currentBh = sm.branch_head_id ? targetEmployeeList.find(e => e.id === sm.branch_head_id) : null;
                            const currentBhName = currentBh ? currentBh.full_name : (sm.branch_head_name || null);
                            const isSelfBh = sm.branch_head_id === hierarchyModalEmp.id;

                            return (
                              <label key={sm.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 10px', fontSize: '12.5px', color: C.text, cursor: 'pointer', borderRadius: '8px', background: checked ? '#EEF2FF' : 'transparent', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input 
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const currentList = hierarchyForm.selected_sm_ids || [];
                                      const newIds = e.target.checked
                                        ? [...currentList, sm.id]
                                        : currentList.filter(id => id !== sm.id);
                                      setHierarchyForm({ ...hierarchyForm, selected_sm_ids: newIds });
                                    }}
                                  />
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0 }}>
                                    {sm.full_name?.charAt(0) || 'S'}
                                  </div>
                                  <div>
                                    <span style={{ fontWeight: checked ? 800 : 600 }}>{sm.full_name} ({sm.employee_id})</span>
                                    <span style={{ fontSize: '11px', color: C.textMid, marginLeft: '6px' }}>— {sm.designation || 'Senior Manager'}</span>
                                  </div>
                                </div>
                                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: isSelfBh ? '#E0E7FF' : currentBhName ? '#FEF3C7' : '#F3F4F6', color: isSelfBh ? '#3730A3' : currentBhName ? '#B45309' : '#6B7280' }}>
                                  {isSelfBh ? '✓ Assigned' : currentBhName ? `Reassign from: ${currentBhName}` : 'Unassigned'}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}

                {hierarchyForm.hierarchy_level === 'SENIOR_MANAGER' && (() => {
                  const candidateMgrs = targetEmployeeList
                    .filter(e => e.id !== hierarchyModalEmp.id)
                    .filter(e => {
                      if (!subordinateSearchText.trim()) return true;
                      const q = subordinateSearchText.toLowerCase().trim();
                      return (e.full_name || '').toLowerCase().includes(q) || (e.employee_id || '').toLowerCase().includes(q) || (e.designation || '').toLowerCase().includes(q);
                    })
                    .sort((a, b) => {
                      const matchA = (a.designation || '').toLowerCase().includes('manager') || a.hierarchy_level === 'MANAGER';
                      const matchB = (b.designation || '').toLowerCase().includes('manager') || b.hierarchy_level === 'MANAGER';
                      if (matchA && !matchB) return -1;
                      if (!matchA && matchB) return 1;
                      return (a.full_name || '').localeCompare(b.full_name || '');
                    });

                  return (
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '4px', color: C.text }}>
                        Select Manager(s) under this Senior Manager ({hierarchyForm.selected_mgr_ids?.length || 0} selected)
                      </label>
                      <div style={{ maxHeight: '180px', overflowY: 'auto', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '8px' }}>
                        {candidateMgrs.length === 0 ? (
                          <div style={{ fontSize: '12px', color: C.textMid, padding: '12px', textAlign: 'center' }}>No matching candidates found</div>
                        ) : (
                          candidateMgrs.map(mgr => {
                            const checked = (hierarchyForm.selected_mgr_ids || []).includes(mgr.id);
                            const currentSm = mgr.senior_manager_id ? targetEmployeeList.find(e => e.id === mgr.senior_manager_id) : null;
                            const currentSmName = currentSm ? currentSm.full_name : (mgr.senior_manager_name || null);
                            const isSelfSm = mgr.senior_manager_id === hierarchyModalEmp.id;

                            return (
                              <label key={mgr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 10px', fontSize: '12.5px', color: C.text, cursor: 'pointer', borderRadius: '8px', background: checked ? '#EDE9FE' : 'transparent', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input 
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const currentList = hierarchyForm.selected_mgr_ids || [];
                                      const newIds = e.target.checked
                                        ? [...currentList, mgr.id]
                                        : currentList.filter(id => id !== mgr.id);
                                      setHierarchyForm({ ...hierarchyForm, selected_mgr_ids: newIds });
                                    }}
                                  />
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0 }}>
                                    {mgr.full_name?.charAt(0) || 'M'}
                                  </div>
                                  <div>
                                    <span style={{ fontWeight: checked ? 800 : 600 }}>{mgr.full_name} ({mgr.employee_id})</span>
                                    <span style={{ fontSize: '11px', color: C.textMid, marginLeft: '6px' }}>— {mgr.designation || 'Manager'}</span>
                                  </div>
                                </div>
                                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: isSelfSm ? '#DDD6FE' : currentSmName ? '#FEF3C7' : '#F3F4F6', color: isSelfSm ? '#5B21B6' : currentSmName ? '#B45309' : '#6B7280' }}>
                                  {isSelfSm ? '✓ Assigned' : currentSmName ? `Reassign from: ${currentSmName}` : 'Unassigned'}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}

                {hierarchyForm.hierarchy_level === 'MANAGER' && (() => {
                  const candidateTLs = targetEmployeeList
                    .filter(e => e.id !== hierarchyModalEmp.id)
                    .filter(e => {
                      if (!subordinateSearchText.trim()) return true;
                      const q = subordinateSearchText.toLowerCase().trim();
                      return (e.full_name || '').toLowerCase().includes(q) || (e.employee_id || '').toLowerCase().includes(q) || (e.designation || '').toLowerCase().includes(q);
                    })
                    .sort((a, b) => {
                      const matchA = (a.designation || '').toLowerCase().includes('team leader') || String(a.designation || '').toUpperCase() === 'TL' || a.hierarchy_level === 'TEAM_LEADER';
                      const matchB = (b.designation || '').toLowerCase().includes('team leader') || String(b.designation || '').toUpperCase() === 'TL' || b.hierarchy_level === 'TEAM_LEADER';
                      if (matchA && !matchB) return -1;
                      if (!matchA && matchB) return 1;
                      return (a.full_name || '').localeCompare(b.full_name || '');
                    });

                  return (
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '4px', color: C.text }}>
                        Select Team Leader(s) under this Manager ({hierarchyForm.selected_tl_ids?.length || 0} selected)
                      </label>
                      <div style={{ maxHeight: '180px', overflowY: 'auto', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '8px' }}>
                        {candidateTLs.length === 0 ? (
                          <div style={{ fontSize: '12px', color: C.textMid, padding: '12px', textAlign: 'center' }}>No matching candidates found</div>
                        ) : (
                          candidateTLs.map(tl => {
                            const checked = (hierarchyForm.selected_tl_ids || []).includes(tl.id);
                            const currentMgr = tl.manager_id ? targetEmployeeList.find(e => e.id === tl.manager_id) : null;
                            const currentMgrName = currentMgr ? currentMgr.full_name : (tl.manager_name || null);
                            const isSelfMgr = tl.manager_id === hierarchyModalEmp.id;

                            return (
                              <label key={tl.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 10px', fontSize: '12.5px', color: C.text, cursor: 'pointer', borderRadius: '8px', background: checked ? '#EFF6FF' : 'transparent', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input 
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const currentList = hierarchyForm.selected_tl_ids || [];
                                      const newIds = e.target.checked
                                        ? [...currentList, tl.id]
                                        : currentList.filter(id => id !== tl.id);
                                      setHierarchyForm({ ...hierarchyForm, selected_tl_ids: newIds });
                                    }}
                                  />
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0 }}>
                                    {tl.full_name?.charAt(0) || 'T'}
                                  </div>
                                  <div>
                                    <span style={{ fontWeight: checked ? 800 : 600 }}>{tl.full_name} ({tl.employee_id})</span>
                                    <span style={{ fontSize: '11px', color: C.textMid, marginLeft: '6px' }}>— {tl.designation || 'Team Leader'}</span>
                                  </div>
                                </div>
                                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: isSelfMgr ? '#DBEAFE' : currentMgrName ? '#FEF3C7' : '#F3F4F6', color: isSelfMgr ? '#1E40AF' : currentMgrName ? '#B45309' : '#6B7280' }}>
                                  {isSelfMgr ? '✓ Assigned' : currentMgrName ? `Reassign from: ${currentMgrName}` : 'Unassigned'}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* TL-TC Mapping for Manager Role */}
                {hierarchyForm.hierarchy_level === 'MANAGER' && hierarchyForm.selected_tl_ids.length > 0 && (
                  <div style={{ marginBottom: '18px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '10px', color: C.text }}>
                      Assign Telecallers to Selected Team Leaders
                    </label>
                    {hierarchyForm.selected_tl_ids.map(tlId => {
                      const tl = targetEmployeeList.find(e => e.id === tlId);
                      if (!tl) return null;
                      const currentTCs = hierarchyForm.tl_tc_mapping[tlId] || [];
                      const candidateTCs = targetEmployeeList
                        .filter(e => e.id !== hierarchyModalEmp.id && e.id !== tlId)
                        .filter(e => {
                          if (!subordinateSearchText.trim()) return true;
                          const q = subordinateSearchText.toLowerCase().trim();
                          return (e.full_name || '').toLowerCase().includes(q) || (e.employee_id || '').toLowerCase().includes(q) || (e.designation || '').toLowerCase().includes(q);
                        })
                        .sort((a, b) => {
                          const matchA = (a.designation || '').toLowerCase().includes('tc') || (a.designation || '').toLowerCase().includes('telecaller') || a.hierarchy_level === 'TC';
                          const matchB = (b.designation || '').toLowerCase().includes('tc') || (b.designation || '').toLowerCase().includes('telecaller') || b.hierarchy_level === 'TC';
                          if (matchA && !matchB) return -1;
                          if (!matchA && matchB) return 1;
                          return (a.full_name || '').localeCompare(b.full_name || '');
                        });

                      return (
                        <div key={tlId} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: C.teal }}>
                            {tl.full_name} ({tl.employee_id}) — ({currentTCs.length} TCs assigned)
                          </div>
                          <div style={{ maxHeight: '140px', overflowY: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '6px' }}>
                            {candidateTCs.length === 0 ? (
                              <div style={{ fontSize: '11px', color: C.textMid, padding: '6px', textAlign: 'center' }}>No Telecallers available</div>
                            ) : (
                              candidateTCs.map(tc => {
                                const checked = currentTCs.includes(tc.id);
                                const currentTl = tc.team_leader_id ? targetEmployeeList.find(e => e.id === tc.team_leader_id) : null;
                                const currentTlName = currentTl ? currentTl.full_name : (tc.team_leader_name || null);
                                const isUnderThisTl = tc.team_leader_id === tlId;

                                return (
                                  <label key={tc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 8px', fontSize: '12px', color: C.text, cursor: 'pointer', borderRadius: '6px', background: checked ? '#ECFDF5' : 'transparent', marginBottom: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input 
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                          const currentMapping = hierarchyForm.tl_tc_mapping || {};
                                          const tlCurrentTCs = currentMapping[tlId] || [];
                                          const newTlTCs = e.target.checked
                                            ? [...tlCurrentTCs, tc.id]
                                            : tlCurrentTCs.filter(id => id !== tc.id);
                                          setHierarchyForm({
                                            ...hierarchyForm,
                                            tl_tc_mapping: {
                                              ...currentMapping,
                                              [tlId]: newTlTCs
                                            }
                                          });
                                        }}
                                      />
                                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px', flexShrink: 0 }}>
                                        {tc.full_name?.charAt(0) || 'T'}
                                      </div>
                                      <div>
                                        <span style={{ fontWeight: checked ? 700 : 600 }}>{tc.full_name} ({tc.employee_id})</span>
                                        <span style={{ fontSize: '10.5px', color: C.textMid, marginLeft: '6px' }}>— {tc.designation || 'TC'}</span>
                                      </div>
                                    </div>
                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: isUnderThisTl ? '#D1FAE5' : currentTlName ? '#FEF3C7' : '#F3F4F6', color: isUnderThisTl ? '#047857' : currentTlName ? '#B45309' : '#6B7280' }}>
                                      {isUnderThisTl ? '✓ Under this TL' : currentTlName ? `Reassign from: ${currentTlName}` : 'Unassigned'}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {hierarchyForm.hierarchy_level === 'TEAM_LEADER' && (() => {
                  const candidateTCs = targetEmployeeList
                    .filter(e => e.id !== hierarchyModalEmp.id)
                    .filter(e => {
                      if (!subordinateSearchText.trim()) return true;
                      const q = subordinateSearchText.toLowerCase().trim();
                      return (e.full_name || '').toLowerCase().includes(q) || (e.employee_id || '').toLowerCase().includes(q) || (e.designation || '').toLowerCase().includes(q);
                    })
                    .sort((a, b) => {
                      const matchA = (a.designation || '').toLowerCase().includes('tc') || (a.designation || '').toLowerCase().includes('telecaller') || a.hierarchy_level === 'TC';
                      const matchB = (b.designation || '').toLowerCase().includes('tc') || (b.designation || '').toLowerCase().includes('telecaller') || b.hierarchy_level === 'TC';
                      if (matchA && !matchB) return -1;
                      if (!matchA && matchB) return 1;
                      return (a.full_name || '').localeCompare(b.full_name || '');
                    });

                  return (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '4px', color: C.text }}>
                        Select Telecaller(s) under this Team Leader ({hierarchyForm.selected_tc_ids?.length || 0} selected)
                      </label>
                      <div style={{ maxHeight: '180px', overflowY: 'auto', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '8px' }}>
                        {candidateTCs.length === 0 ? (
                          <div style={{ fontSize: '12px', color: C.textMid, padding: '12px', textAlign: 'center' }}>No matching candidates found</div>
                        ) : (
                          candidateTCs.map(tc => {
                            const checked = (hierarchyForm.selected_tc_ids || []).includes(tc.id);
                            const currentTl = tc.team_leader_id ? targetEmployeeList.find(e => e.id === tc.team_leader_id) : null;
                            const currentTlName = currentTl ? currentTl.full_name : (tc.team_leader_name || null);
                            const isSelfTl = tc.team_leader_id === hierarchyModalEmp.id;

                            return (
                              <label key={tc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 10px', fontSize: '12.5px', color: C.text, cursor: 'pointer', borderRadius: '8px', background: checked ? '#ECFDF5' : 'transparent', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input 
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const currentList = hierarchyForm.selected_tc_ids || [];
                                      const newIds = e.target.checked
                                        ? [...currentList, tc.id]
                                        : currentList.filter(id => id !== tc.id);
                                      setHierarchyForm({ ...hierarchyForm, selected_tc_ids: newIds });
                                    }}
                                  />
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0 }}>
                                    {tc.full_name?.charAt(0) || 'T'}
                                  </div>
                                  <div>
                                    <span style={{ fontWeight: checked ? 800 : 600 }}>{tc.full_name} ({tc.employee_id})</span>
                                    <span style={{ fontSize: '11px', color: C.textMid, marginLeft: '6px' }}>— {tc.designation || 'TC'}</span>
                                  </div>
                                </div>
                                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: isSelfTl ? '#D1FAE5' : currentTlName ? '#FEF3C7' : '#F3F4F6', color: isSelfTl ? '#047857' : currentTlName ? '#B45309' : '#6B7280' }}>
                                  {isSelfTl ? '✓ Assigned' : currentTlName ? `Reassign from: ${currentTlName}` : 'Unassigned'}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}


                {/* Validation Note for all roles */}
                <div style={{ marginBottom: '18px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E40AF', marginBottom: '4px' }}>
                    <FaExclamationCircle style={{ marginRight: '6px' }} />Single Supervisor Rule
                  </div>
                  <div style={{ fontSize: '11px', color: '#1E40AF' }}>
                    Each employee can have only ONE supervisor at each level (one Branch Head, one Senior Manager, one Manager, one Team Leader). To change supervisors, unassign the current one first.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => setHierarchyModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Save Hierarchy</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: Employee Quick Actions Popup (Manage Depts, Manage Bonus, 360 View, Assign Team) ── */}
        {actionModalEmp && (
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={() => setActionModalEmp(null)}
          >
            <div 
              style={{ 
                background: C.card, 
                border: `1px solid ${C.border}`, 
                borderRadius: '24px', 
                width: '100%', 
                maxWidth: '480px', 
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: isMobile ? '18px 14px' : '24px', 
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `linear-gradient(135deg, ${C.teal} 0%, #0D9488 100%)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '20px' }}>
                    {actionModalEmp.full_name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: C.text }}>{actionModalEmp.full_name}</h3>
                    <div style={{ fontSize: '12px', color: C.teal, fontWeight: 800 }}>ID: {actionModalEmp.employee_id} • {actionModalEmp.designation || 'Employee'}</div>
                  </div>
                </div>
                <button onClick={() => setActionModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: C.textMid, fontWeight: 900 }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
                {/* 1. Manage Depts */}
                <button
                  onClick={() => {
                    const emp = actionModalEmp;
                    setActionModalEmp(null);
                    openDeptModal(emp);
                  }}
                  style={{ width: '100%', padding: '16px 14px', background: `${C.teal}08`, border: `1px solid ${C.teal}30`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', color: C.text, textAlign: 'left', transition: 'all 0.2s ease' }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${C.teal}20`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    <FaBuilding />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>Manage Depts</div>
                    <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>Assign bank & department access</div>
                  </div>
                </button>

                {/* 2. Manage Bonus */}
                <button
                  onClick={() => {
                    const emp = actionModalEmp;
                    setActionModalEmp(null);
                    openBonusModal(emp);
                  }}
                  style={{ width: '100%', padding: '16px 14px', background: '#F59E0B08', border: '1px solid #F59E0B30', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', color: C.text, textAlign: 'left', transition: 'all 0.2s ease' }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F59E0B20', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    <FaCoins />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>Manage Bonus</div>
                    <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>Set card targets & bonus rates</div>
                  </div>
                </button>

                {/* 3. 360 View */}
                <button
                  onClick={() => {
                    const emp = actionModalEmp;
                    setActionModalEmp(null);
                    handleOpen360View(emp);
                  }}
                  style={{ width: '100%', padding: '16px 14px', background: '#3B82F608', border: '1px solid #3B82F630', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', color: C.text, textAlign: 'left', transition: 'all 0.2s ease' }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#3B82F620', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    <FaEye />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>360 View</div>
                    <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>Inspect KYC, links & profile 360</div>
                  </div>
                </button>

                {/* 4. Assign Team */}
                <button
                  onClick={() => {
                    const emp = actionModalEmp;
                    setActionModalEmp(null);
                    openHierarchyModal(emp);
                  }}
                  style={{ width: '100%', padding: '16px 14px', background: '#8B5CF608', border: '1px solid #8B5CF630', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', color: C.text, textAlign: 'left', transition: 'all 0.2s ease' }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#8B5CF620', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    <FaSitemap />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>Assign Team</div>
                    <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>Set reporting hierarchy & team</div>
                  </div>
                </button>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button onClick={() => setActionModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: Employee Performance Dashboard ── */}
        {perfModalEmp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    <FaTrophy />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: C.text }}>Performance Analytics</h3>
                    <div style={{ fontSize: '12px', color: C.teal, fontWeight: 800 }}>{perfModalEmp.full_name} ({perfModalEmp.employee_id})</div>
                  </div>
                </div>
                <button onClick={() => setPerfModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: C.textMid, fontWeight: 900 }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Total Applications</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: C.teal, marginTop: '4px' }}>{perfModalEmp.total_applications || 0}</div>
                  <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>CRM Applications Processed</div>
                </div>

                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Incentives Earned</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>₹{Number(perfModalEmp.total_incentives_earned || 0).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>Completed payout incentives</div>
                </div>

                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Active Product Links</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#3B82F6', marginTop: '4px' }}>{perfModalEmp.active_links_count || 0}</div>
                  <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>Assigned referral URLs</div>
                </div>

                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Onboarding Progress</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#8B5CF6', marginTop: '4px' }}>{perfModalEmp.overall_progress || 20}%</div>
                  <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>Profile setup score</div>
                </div>
              </div>

              <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: C.text }}>Account & KYC Verification Status</span>
                  <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 900, background: perfModalEmp.activation_status === 'APPROVED' ? '#D1FAE5' : '#FEF3C7', color: perfModalEmp.activation_status === 'APPROVED' ? '#065F46' : '#92400E' }}>
                    {perfModalEmp.activation_status || 'PENDING'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: C.textMid }}>
                  KYC Verified: <strong>{perfModalEmp.kyc_verified ? 'Yes ✅' : 'No ⏳'}</strong> | Terms Accepted: <strong>{perfModalEmp.terms_completed ? 'Yes ✅' : 'No ⏳'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setPerfModalEmp(null); handleOpen360View(perfModalEmp); }} style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>View Full Profile</button>
                <button onClick={() => setPerfModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
              </div>

            </div>
          </div>
        )}

        {/* ── MODAL: Manage Departments / Banks Assignment ── */}
        {deptModalEmp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${C.teal}20`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    <FaBuilding />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: C.text }}>Manage Departments / Banks</h3>
                    <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>
                      Employee: <span style={{ color: C.teal, fontWeight: 900 }}>{deptModalEmp.full_name}</span> ({deptModalEmp.employee_id})
                    </div>
                  </div>
                </div>
                <button onClick={() => setDeptModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: C.textMid, fontWeight: 900 }}>✕</button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 800, color: C.textMid, display: 'block', marginBottom: '8px' }}>
                  Assigned Departments / Banks
                </label>
                
                {loadingDepts ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: C.textMid }}>Loading bank departments...</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {deptBanksList.map(bank => {
                      const isChecked = selectedBankIds.includes(bank.bank_id);
                      return (
                        <label 
                          key={bank.bank_id} 
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', 
                            borderRadius: '12px', border: `1px solid ${isChecked ? C.teal : C.border}`,
                            background: isChecked ? `${C.teal}08` : C.bgSecondary, cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBankIds(prev => [...prev, bank.bank_id]);
                              } else {
                                setSelectedBankIds(prev => prev.filter(id => id !== bank.bank_id));
                              }
                            }}
                            style={{ width: '16px', height: '16px', accentColor: C.teal, cursor: 'pointer' }}
                          />
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: isChecked ? C.teal : C.text }}>
                            {bank.bank_name}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  onClick={handleSaveDeptAssignments} 
                  disabled={savingDepts}
                  style={{ 
                    background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', 
                    borderRadius: '10px', fontWeight: 800, cursor: savingDepts ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' 
                  }}
                >
                  {savingDepts ? 'Saving...' : 'Save Assignments'}
                </button>
                <button onClick={() => setDeptModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </div>

            </div>
          </div>
        )}

        {/* ── MODAL: Manage Bonus & Targets ── */}
        {bonusModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', width: '100%', maxWidth: '850px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F59E0B20', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    <FaCoins />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: C.text }}>Manage Employee Bonus & Targets</h3>
                    <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>
                      Configure card targets, date period, and bonus per card per department
                    </div>
                  </div>
                </div>
                <button onClick={() => setBonusModalOpen(false)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: C.textMid, fontWeight: 900 }}>✕</button>
              </div>

              {/* Form Section */}
              <form onSubmit={handleSaveBonusRule} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: C.text, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaBullseye style={{ color: C.teal }} /> Create Target & Bonus Rule
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  
                  {/* Employee */}
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, display: 'block', marginBottom: '6px' }}>Select Employee *</label>
                    <select 
                      value={bonusForm.employee_id} 
                      onChange={(e) => {
                        const empId = e.target.value;
                        setBonusForm({ ...bonusForm, employee_id: empId });
                        fetchEmployeeAssignedBanks(empId);
                      }}
                      style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13px', fontWeight: 700 }}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id || 'N/A'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Department / Bank */}
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, display: 'block', marginBottom: '6px' }}>Department / Bank *</label>
                    <select 
                      value={bonusForm.bank_id} 
                      onChange={(e) => setBonusForm({ ...bonusForm, bank_id: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13px', fontWeight: 700 }}
                      required
                    >
                      <option value="">Select Bank</option>
                      {employeeAssignedBanks.map(b => (
                        <option key={b.bank_id} value={b.bank_id}>{b.bank_name}</option>
                      ))}
                    </select>
                    {employeeAssignedBanks.length === 0 && bonusForm.employee_id && (
                      <div style={{ fontSize: '11px', color: '#D97706', marginTop: '4px' }}>No assigned bank yet. Will auto-assign on submit.</div>
                    )}
                  </div>

                  {/* From Date */}
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, display: 'block', marginBottom: '6px' }}>From Date *</label>
                    <input 
                      type="date" 
                      value={bonusForm.start_date}
                      onChange={(e) => setBonusForm({ ...bonusForm, start_date: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13px' }}
                      required
                    />
                  </div>

                  {/* To Date */}
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, display: 'block', marginBottom: '6px' }}>To Date *</label>
                    <input 
                      type="date" 
                      value={bonusForm.end_date}
                      onChange={(e) => setBonusForm({ ...bonusForm, end_date: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13px' }}
                      required
                    />
                  </div>

                  {/* Target Count */}
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, display: 'block', marginBottom: '6px' }}>Target (Cards) *</label>
                    <input 
                      type="number" 
                      min="1"
                      value={bonusForm.target_count}
                      onChange={(e) => setBonusForm({ ...bonusForm, target_count: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13px', fontWeight: 700 }}
                      required
                    />
                  </div>

                  {/* Bonus Per Card */}
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, display: 'block', marginBottom: '6px' }}>Bonus Per Card (₹) *</label>
                    <input 
                      type="number" 
                      min="0"
                      value={bonusForm.bonus_per_card}
                      onChange={(e) => setBonusForm({ ...bonusForm, bonus_per_card: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13px', fontWeight: 700 }}
                      required
                    />
                  </div>

                </div>

                <div style={{ textAlign: 'right' }}>
                  <button 
                    type="submit" 
                    disabled={savingRule}
                    style={{ 
                      background: C.teal, color: '#fff', border: 'none', padding: '10px 24px', 
                      borderRadius: '10px', fontWeight: 800, cursor: savingRule ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' 
                    }}
                  >
                    {savingRule ? 'Saving Rule...' : 'Assign Bonus Rule'}
                  </button>
                </div>
              </form>

              {/* Rules Progress & History List */}
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 900, color: C.text, marginBottom: '12px' }}>Configured Bonus Targets & Progress</h4>
                
                {loadingRules ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: C.textMid }}>Loading bonus rules...</div>
                ) : bonusRulesList.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: C.textMid, background: C.bgSecondary, borderRadius: '12px' }}>No active or past bonus rules created yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {bonusRulesList.map(rule => (
                      <div key={rule.id} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: 900, color: C.text }}>{rule.employee_name} ({rule.emp_code})</span>
                            <span style={{ marginLeft: '10px', padding: '2px 8px', borderRadius: '8px', background: `${C.teal}15`, color: C.teal, fontSize: '12px', fontWeight: 800 }}>{rule.bank_name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '12px', color: C.textMid }}>
                              Period: <strong>{new Date(rule.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(rule.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                            </span>
                            <button onClick={() => handleDeleteBonusRule(rule.id)} style={{ background: '#EF444415', border: 'none', color: '#EF4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Delete Rule">
                              <FaTrash />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar & Calculation */}
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12.5px', fontWeight: 800 }}>
                            <span>{rule.bank_name} Target: <strong style={{ color: C.teal }}>{rule.approved_count} / {rule.target_count} Cards</strong> ({rule.progress_percentage}%)</span>
                            {rule.target_achieved ? (
                              <span style={{ color: '#10B981', fontWeight: 900 }}>✓ ₹{Number(rule.earned_bonus || 0).toLocaleString('en-IN')} Unlocked</span>
                            ) : (
                              <span style={{ color: '#D97706', fontWeight: 800 }}>🔒 Bonus Locked</span>
                            )}
                          </div>

                          <div style={{ width: '100%', background: C.bgSecondary, height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ width: `${rule.progress_percentage}%`, background: rule.target_achieved ? '#10B981' : '#F59E0B', height: '100%', transition: 'width 0.4s ease' }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: C.textMid }}>
                            <span>{rule.target_achieved ? <strong style={{ color: '#10B981' }}>Target Achieved (Awarded to {rule.employee_name})</strong> : <span style={{ color: '#D97706' }}>Needs {rule.remaining_count} more cards to unlock</span>}</span>
                            <span>Rate: ₹{rule.bonus_per_card}/card</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
