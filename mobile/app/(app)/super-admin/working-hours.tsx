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
  SafeAreaView,
  Switch,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../../components/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import {
  fetchWorkingHoursConfig,
  updateWorkingHours,
  extendWorkingHours,
  fetchExtensionHistory,
  revokeExtension,
  fetchPolicies,
  savePolicy,
  deletePolicy,
  fetchHolidays,
  saveHoliday,
  deleteHoliday,
  type WorkingHoursConfig,
  type ExtensionItem,
  type DepartmentPolicyItem,
  type HolidayItem,
  type WorkingDaySchedule,
} from '../../../services/working-hours.service';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const DEFAULT_SCHEDULE: Record<string, WorkingDaySchedule> = {
  monday: { is_working: true, start_time: '09:00 AM', end_time: '06:00 PM' },
  tuesday: { is_working: true, start_time: '09:00 AM', end_time: '06:00 PM' },
  wednesday: { is_working: true, start_time: '09:00 AM', end_time: '06:00 PM' },
  thursday: { is_working: true, start_time: '09:00 AM', end_time: '06:00 PM' },
  friday: { is_working: true, start_time: '09:00 AM', end_time: '06:00 PM' },
  saturday: { is_working: false, start_time: '09:00 AM', end_time: '06:00 PM' },
  sunday: { is_working: false, start_time: '09:00 AM', end_time: '06:00 PM' },
};

export default function AdminWorkingHoursScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'schedule' | 'extensions' | 'policies' | 'holidays'>('schedule');

  // Loading & refresh
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Schedule state
  const [schedule, setSchedule] = useState<Record<string, WorkingDaySchedule>>(DEFAULT_SCHEDULE);
  const [gracePeriod, setGracePeriod] = useState<number>(15);
  const [enforceStrict, setEnforceStrict] = useState<boolean>(true);

  // Extensions state
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendReason, setExtendReason] = useState('');
  const [extendUntil, setExtendUntil] = useState('08:00 PM');
  const [extendTarget, setExtendTarget] = useState<'ALL' | 'DEPARTMENT' | 'USER'>('ALL');
  const [submittingExtension, setSubmittingExtension] = useState(false);

  // Policies state
  const [policies, setPolicies] = useState<DepartmentPolicyItem[]>([]);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyDepartment, setPolicyDepartment] = useState('');
  const [policyStartTime, setPolicyStartTime] = useState('09:30 AM');
  const [policyEndTime, setPolicyEndTime] = useState('06:30 PM');
  const [policyGrace, setPolicyGrace] = useState('15');
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Holidays state
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayDate, setHolidayDate] = useState(new Date().toISOString().split('T')[0]);
  const [holidayOptional, setHolidayOptional] = useState(false);
  const [savingHoliday, setSavingHoliday] = useState(false);

  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [cfgRes, extRes, polRes, holRes] = await Promise.allSettled([
        fetchWorkingHoursConfig(),
        fetchExtensionHistory(),
        fetchPolicies(),
        fetchHolidays(),
      ]);

      if (cfgRes.status === 'fulfilled' && cfgRes.value) {
        if (cfgRes.value.schedule) {
          setSchedule({ ...DEFAULT_SCHEDULE, ...cfgRes.value.schedule });
        }
        if (typeof cfgRes.value.allow_grace_period_mins === 'number') {
          setGracePeriod(cfgRes.value.allow_grace_period_mins);
        }
        if (typeof cfgRes.value.enforce_strict_hours === 'boolean') {
          setEnforceStrict(cfgRes.value.enforce_strict_hours);
        }
      }

      if (extRes.status === 'fulfilled') {
        setExtensions(extRes.value);
      }
      if (polRes.status === 'fulfilled') {
        setPolicies(polRes.value);
      }
      if (holRes.status === 'fulfilled') {
        setHolidays(holRes.value);
      }
    } catch (e) {
      console.warn('Error loading working hours data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Toggle Day Working
  const handleToggleDay = (dayKey: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        is_working: !prev[dayKey]?.is_working,
      },
    }));
  };

  // Update Day Time
  const handleUpdateTime = (dayKey: string, field: 'start_time' | 'end_time', value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  // Save Schedule
  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await updateWorkingHours({
        schedule,
        allow_grace_period_mins: gracePeriod,
        enforce_strict_hours: enforceStrict,
      });
      Alert.alert('Saved ✓', 'Weekly working hours configuration updated successfully.');
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update working hours.');
    } finally {
      setSavingSchedule(false);
    }
  };

  // Grant Extension
  const handleCreateExtension = async () => {
    if (!extendReason || extendReason.trim().length < 4) {
      Alert.alert('Validation Error', 'Please enter a valid reason for granting the extension.');
      return;
    }
    setSubmittingExtension(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await extendWorkingHours({
        target_type: extendTarget,
        extension_date: todayStr,
        extended_until: extendUntil,
        reason: extendReason.trim(),
      });
      Alert.alert('Extension Granted ⏰', `Working hours extended until ${extendUntil} for today.`);
      setShowExtendModal(false);
      setExtendReason('');
      loadAllData();
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Could not grant working hours extension.');
    } finally {
      setSubmittingExtension(false);
    }
  };

  // Revoke Extension
  const handleRevokeExtension = (id: string) => {
    Alert.alert('Revoke Extension', 'Are you sure you want to cancel this temporary working hours extension?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await revokeExtension(id);
            Alert.alert('Revoked', 'Extension cancelled successfully.');
            loadAllData();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Could not revoke extension.');
          }
        },
      },
    ]);
  };

  // Add Policy
  const handleSavePolicy = async () => {
    if (!policyDepartment.trim()) {
      Alert.alert('Validation Error', 'Please enter department name.');
      return;
    }
    setSavingPolicy(true);
    try {
      await savePolicy({
        department: policyDepartment.trim(),
        start_time: policyStartTime,
        end_time: policyEndTime,
        grace_period_mins: parseInt(policyGrace, 10) || 15,
        is_active: true,
      });
      Alert.alert('Policy Saved ✓', `Shift schedule created for ${policyDepartment}.`);
      setShowPolicyModal(false);
      setPolicyDepartment('');
      loadAllData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save policy.');
    } finally {
      setSavingPolicy(false);
    }
  };

  // Delete Policy
  const handleDeletePolicy = (id: string, name: string) => {
    Alert.alert('Delete Policy', `Remove shift policy for ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePolicy(id);
            loadAllData();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Could not delete policy.');
          }
        },
      },
    ]);
  };

  // Add Holiday
  const handleSaveHoliday = async () => {
    if (!holidayTitle.trim() || !holidayDate.trim()) {
      Alert.alert('Validation Error', 'Please enter holiday name and date.');
      return;
    }
    setSavingHoliday(true);
    try {
      await saveHoliday({
        title: holidayTitle.trim(),
        holiday_date: holidayDate.trim(),
        is_optional: holidayOptional,
      });
      Alert.alert('Holiday Added ✓', `${holidayTitle} scheduled for ${holidayDate}.`);
      setShowHolidayModal(false);
      setHolidayTitle('');
      loadAllData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not add holiday.');
    } finally {
      setSavingHoliday(false);
    }
  };

  // Delete Holiday
  const handleDeleteHoliday = (id: string, title: string) => {
    Alert.alert('Delete Holiday', `Remove ${title} from holiday calendar?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHoliday(id);
            loadAllData();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Could not delete holiday.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Working Hours & Shifts</Text>
          <Text style={styles.headerSub}>Admin schedule & operating policy controls</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'schedule' && styles.tabItemActive]}
          onPress={() => setActiveTab('schedule')}
        >
          <Icon name="clock" size={15} color={activeTab === 'schedule' ? colors.primary : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'schedule' && styles.tabLabelActive]}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'extensions' && styles.tabItemActive]}
          onPress={() => setActiveTab('extensions')}
        >
          <Icon name="zap" size={15} color={activeTab === 'extensions' ? colors.primary : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'extensions' && styles.tabLabelActive]}>
            Extensions ({extensions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'policies' && styles.tabItemActive]}
          onPress={() => setActiveTab('policies')}
        >
          <Icon name="briefcase" size={15} color={activeTab === 'policies' ? colors.primary : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'policies' && styles.tabLabelActive]}>
            Shifts ({policies.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'holidays' && styles.tabItemActive]}
          onPress={() => setActiveTab('holidays')}
        >
          <Icon name="calendar" size={15} color={activeTab === 'holidays' ? colors.primary : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'holidays' && styles.tabLabelActive]}>
            Holidays ({holidays.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAllData(true)} colors={[colors.primary]} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.subtleText}>Loading working hours settings...</Text>
          </View>
        ) : (
          <>
            {/* TAB 1: WEEKLY SCHEDULE */}
            {activeTab === 'schedule' && (
              <View>
                {/* Global Rules Card */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Global Working Hours Policy</Text>
                  <Text style={styles.subtleText}>
                    Enforces strict check-in windows, late-arrival markers, and automatic checkout cutoffs.
                  </Text>

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleLabel}>Enforce Strict Attendance Hours</Text>
                      <Text style={styles.toggleSub}>Mark employees late after scheduled shift start</Text>
                    </View>
                    <Switch
                      value={enforceStrict}
                      onValueChange={setEnforceStrict}
                      trackColor={{ false: '#334155', true: colors.primary }}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Grace Period Allowance (minutes)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={String(gracePeriod)}
                      onChangeText={(val) => setGracePeriod(parseInt(val, 10) || 0)}
                    />
                  </View>
                </View>

                {/* Day-by-Day Working Hours List */}
                <Text style={styles.sectionHeading}>Weekly Working Days</Text>
                {DAYS_OF_WEEK.map((day) => {
                  const dayCfg = schedule[day.key] || { is_working: false, start_time: '09:00 AM', end_time: '06:00 PM' };
                  return (
                    <View key={day.key} style={[styles.dayCard, !dayCfg.is_working && styles.dayCardOff]}>
                      <View style={styles.dayTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View
                            style={[
                              styles.dayIndicator,
                              { backgroundColor: dayCfg.is_working ? '#10B981' : '#64748B' },
                            ]}
                          />
                          <Text style={styles.dayLabel}>{day.label}</Text>
                        </View>
                        <Switch
                          value={dayCfg.is_working}
                          onValueChange={() => handleToggleDay(day.key)}
                          trackColor={{ false: '#334155', true: colors.primary }}
                        />
                      </View>

                      {dayCfg.is_working ? (
                        <View style={styles.timeInputsRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.timeLabel}>Start Shift</Text>
                            <TextInput
                              style={styles.timeInput}
                              value={dayCfg.start_time}
                              onChangeText={(v) => handleUpdateTime(day.key, 'start_time', v)}
                              placeholder="09:00 AM"
                              placeholderTextColor="#64748B"
                            />
                          </View>
                          <View style={{ justifyContent: 'center', paddingTop: 16 }}>
                            <Text style={{ color: '#64748B', fontWeight: '700' }}>→</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.timeLabel}>End Shift</Text>
                            <TextInput
                              style={styles.timeInput}
                              value={dayCfg.end_time}
                              onChangeText={(v) => handleUpdateTime(day.key, 'end_time', v)}
                              placeholder="06:00 PM"
                              placeholderTextColor="#64748B"
                            />
                          </View>
                        </View>
                      ) : (
                        <Text style={styles.offDayNotice}>Non-working weekend / designated off-day</Text>
                      )}
                    </View>
                  );
                })}

                {/* Save Button */}
                <TouchableOpacity
                  style={[styles.saveBtn, savingSchedule && { opacity: 0.7 }]}
                  onPress={handleSaveSchedule}
                  disabled={savingSchedule}
                >
                  {savingSchedule ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="check" size={16} color="#fff" />
                      <Text style={styles.saveBtnText}>Save Working Hours Schedule</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 2: EXTENSIONS */}
            {activeTab === 'extensions' && (
              <View>
                <View style={styles.actionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionHeading}>Daily Overtime Extensions</Text>
                    <Text style={styles.subtleText}>Extend system check-out cutoffs for operations or sales pushes.</Text>
                  </View>
                  <TouchableOpacity style={styles.addBtn} onPress={() => setShowExtendModal(true)}>
                    <Icon name="plus" size={14} color="#fff" />
                    <Text style={styles.addBtnText}>Grant Extension</Text>
                  </TouchableOpacity>
                </View>

                {extensions.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <Icon name="clock" size={42} color="#64748B" />
                    <Text style={styles.emptyTitle}>No Active Extensions</Text>
                    <Text style={styles.emptySubText}>
                      No temporary daily overtime hours currently active for staff.
                    </Text>
                  </View>
                ) : (
                  extensions.map((ext) => (
                    <View key={ext.id} style={styles.itemCard}>
                      <View style={styles.itemTopRow}>
                        <View>
                          <Text style={styles.itemTitle}>Extended until {ext.extended_until}</Text>
                          <Text style={styles.itemDate}>
                            Date: {ext.extension_date} • Target: {ext.target_type}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteSmallBtn}
                          onPress={() => handleRevokeExtension(ext.id)}
                        >
                          <Icon name="trash" size={14} color="#EF4444" />
                          <Text style={styles.deleteSmallText}>Revoke</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.itemReason}>"{ext.reason}"</Text>
                      {ext.granted_by_name && (
                        <Text style={styles.itemMeta}>Authorized by: {ext.granted_by_name}</Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 3: POLICIES */}
            {activeTab === 'policies' && (
              <View>
                <View style={styles.actionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionHeading}>Department Shift Policies</Text>
                    <Text style={styles.subtleText}>Custom working schedules for Support, Operations, KYC & Sales.</Text>
                  </View>
                  <TouchableOpacity style={styles.addBtn} onPress={() => setShowPolicyModal(true)}>
                    <Icon name="plus" size={14} color="#fff" />
                    <Text style={styles.addBtnText}>Add Shift</Text>
                  </TouchableOpacity>
                </View>

                {policies.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <Icon name="briefcase" size={42} color="#64748B" />
                    <Text style={styles.emptyTitle}>No Department Shifts</Text>
                    <Text style={styles.emptySubText}>
                      All departments currently follow the default global company schedule.
                    </Text>
                  </View>
                ) : (
                  policies.map((p) => (
                    <View key={p.id} style={styles.itemCard}>
                      <View style={styles.itemTopRow}>
                        <View>
                          <Text style={styles.itemTitle}>{p.department}</Text>
                          <Text style={styles.itemDate}>
                            Shift Hours: {p.start_time} - {p.end_time}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteSmallBtn}
                          onPress={() => handleDeletePolicy(p.id, p.department)}
                        >
                          <Icon name="trash" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.itemMeta}>Grace period: {p.grace_period_mins} mins</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 4: HOLIDAYS */}
            {activeTab === 'holidays' && (
              <View>
                <View style={styles.actionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionHeading}>Company & Bank Holidays</Text>
                    <Text style={styles.subtleText}>Automatic attendance exemptions and holiday calendar.</Text>
                  </View>
                  <TouchableOpacity style={styles.addBtn} onPress={() => setShowHolidayModal(true)}>
                    <Icon name="plus" size={14} color="#fff" />
                    <Text style={styles.addBtnText}>Add Holiday</Text>
                  </TouchableOpacity>
                </View>

                {holidays.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <Icon name="calendar" size={42} color="#64748B" />
                    <Text style={styles.emptyTitle}>No Holidays Configured</Text>
                    <Text style={styles.emptySubText}>Add official holidays to exempt staff from check-ins.</Text>
                  </View>
                ) : (
                  holidays.map((h) => (
                    <View key={h.id} style={styles.itemCard}>
                      <View style={styles.itemTopRow}>
                        <View>
                          <Text style={styles.itemTitle}>{h.title}</Text>
                          <Text style={styles.itemDate}>📅 {h.holiday_date}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteSmallBtn}
                          onPress={() => handleDeleteHoliday(h.id, h.title)}
                        >
                          <Icon name="trash" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                      {h.is_optional && <Text style={styles.optionalBadge}>Optional / Restricted Holiday</Text>}
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* MODAL 1: GRANT EXTENSION */}
      <Modal visible={showExtendModal} transparent animationType="fade" onRequestClose={() => setShowExtendModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Grant Daily Extension</Text>
              <TouchableOpacity onPress={() => setShowExtendModal(false)}>
                <Icon name="x" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Extended Until Time *</Text>
            <TextInput
              style={styles.textInput}
              value={extendUntil}
              onChangeText={setExtendUntil}
              placeholder="e.g. 08:30 PM"
              placeholderTextColor="#64748B"
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Target Scope</Text>
            <View style={styles.scopeRow}>
              {(['ALL', 'DEPARTMENT', 'USER'] as const).map((sc) => (
                <TouchableOpacity
                  key={sc}
                  style={[styles.scopeBtn, extendTarget === sc && styles.scopeBtnActive]}
                  onPress={() => setExtendTarget(sc)}
                >
                  <Text style={[styles.scopeBtnText, extendTarget === sc && styles.scopeBtnTextActive]}>{sc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Reason / Justification *</Text>
            <TextInput
              style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
              value={extendReason}
              onChangeText={setExtendReason}
              placeholder="e.g. Month-end disbursement drive"
              placeholderTextColor="#64748B"
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowExtendModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, submittingExtension && { opacity: 0.7 }]}
                onPress={handleCreateExtension}
                disabled={submittingExtension}
              >
                {submittingExtension ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Authorize Extension</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ADD SHIFT POLICY */}
      <Modal visible={showPolicyModal} transparent animationType="fade" onRequestClose={() => setShowPolicyModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Department Shift</Text>
              <TouchableOpacity onPress={() => setShowPolicyModal(false)}>
                <Icon name="x" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Department Name *</Text>
            <TextInput
              style={styles.textInput}
              value={policyDepartment}
              onChangeText={setPolicyDepartment}
              placeholder="e.g. Customer Support"
              placeholderTextColor="#64748B"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TextInput
                  style={styles.textInput}
                  value={policyStartTime}
                  onChangeText={setPolicyStartTime}
                  placeholder="09:30 AM"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TextInput
                  style={styles.textInput}
                  value={policyEndTime}
                  onChangeText={setPolicyEndTime}
                  placeholder="06:30 PM"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Grace Period (minutes)</Text>
            <TextInput
              style={styles.textInput}
              value={policyGrace}
              onChangeText={setPolicyGrace}
              keyboardType="numeric"
              placeholder="15"
              placeholderTextColor="#64748B"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPolicyModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingPolicy && { opacity: 0.7 }]}
                onPress={handleSavePolicy}
                disabled={savingPolicy}
              >
                {savingPolicy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitText}>Save Shift</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: ADD HOLIDAY */}
      <Modal visible={showHolidayModal} transparent animationType="fade" onRequestClose={() => setShowHolidayModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Holiday</Text>
              <TouchableOpacity onPress={() => setShowHolidayModal(false)}>
                <Icon name="x" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Holiday Name *</Text>
            <TextInput
              style={styles.textInput}
              value={holidayTitle}
              onChangeText={setHolidayTitle}
              placeholder="e.g. Diwali / Republic Day"
              placeholderTextColor="#64748B"
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.textInput}
              value={holidayDate}
              onChangeText={setHolidayDate}
              placeholder="2026-11-12"
              placeholderTextColor="#64748B"
            />

            <View style={[styles.toggleRow, { marginTop: 12 }]}>
              <Text style={styles.toggleLabel}>Optional / Restricted Holiday</Text>
              <Switch
                value={holidayOptional}
                onValueChange={setHolidayOptional}
                trackColor={{ false: '#334155', true: colors.primary }}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowHolidayModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingHoliday && { opacity: 0.7 }]}
                onPress={handleSaveHoliday}
                disabled={savingHoliday}
              >
                {savingHoliday ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitText}>Add Holiday</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
    marginRight: spacing.sm,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  subtleText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  inputGroup: {
    marginTop: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    color: '#FFFFFF',
    fontSize: 13,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  dayCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  dayCardOff: {
    backgroundColor: '#1E293B80',
    borderColor: '#33415560',
  },
  dayTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 8,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  offDayNotice: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    fontStyle: 'italic',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  itemReason: {
    fontSize: 12,
    color: '#E2E8F0',
    fontStyle: 'italic',
    marginTop: 8,
  },
  itemMeta: {
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 6,
  },
  deleteSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#EF444415',
  },
  deleteSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  optionalBadge: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scopeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scopeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  scopeBtnTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: spacing.lg,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  modalSubmitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
