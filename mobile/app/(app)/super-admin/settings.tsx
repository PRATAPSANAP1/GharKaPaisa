import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Card } from '../../../components/Card';
import { Icon } from '../../../components/Icon';
import {
  fetchWorkingHoursConfig,
  updateWorkingHoursConfig,
  fetchHolidaysList,
  createHolidayItem,
  deleteHolidayItem,
} from '../../../services/super-admin.service';

export default function SuperAdminSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'HOURS' | 'HOLIDAYS'>('HOURS');

  // Working Hours Form
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('18:30');
  const [graceMinutes, setGraceMinutes] = useState('15');
  const [savingHours, setSavingHours] = useState(false);

  // Holidays
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [addingHoliday, setAddingHoliday] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [hoursRes, holidaysRes] = await Promise.allSettled([
        fetchWorkingHoursConfig(),
        fetchHolidaysList(),
      ]);

      if (hoursRes.status === 'fulfilled') {
        const hData = hoursRes.value.data || hoursRes.value;
        if (hData.start_time) setStartTime(hData.start_time);
        if (hData.end_time) setEndTime(hData.end_time);
        if (hData.grace_minutes !== undefined) setGraceMinutes(String(hData.grace_minutes));
      }

      if (holidaysRes.status === 'fulfilled') {
        const list = Array.isArray(holidaysRes.value) ? holidaysRes.value : holidaysRes.value.data || holidaysRes.value.holidays || [];
        setHolidays(list);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      await updateWorkingHoursConfig({
        start_time: startTime,
        end_time: endTime,
        grace_minutes: parseInt(graceMinutes, 10) || 15,
      });
      Alert.alert('Success', 'Working hours and shifts saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update working hours');
    } finally {
      setSavingHours(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayName.trim() || !holidayDate.trim()) {
      Alert.alert('Validation', 'Please provide both holiday title and date (YYYY-MM-DD).');
      return;
    }

    setAddingHoliday(true);
    try {
      await createHolidayItem({
        name: holidayName.trim(),
        date: holidayDate.trim(),
      });
      Alert.alert('Success', 'Holiday added to calendar.');
      setHolidayModalVisible(false);
      setHolidayName('');
      setHolidayDate('');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add holiday');
    } finally {
      setAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    Alert.alert('Confirm Delete', 'Remove this holiday from company calendar?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHolidayItem(id);
            Alert.alert('Success', 'Holiday removed');
            loadData();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete holiday');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>System Configuration</Text>
          <Text style={styles.headerSubtitle}>Operational shifts & company calendar</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'HOURS' && styles.activeTabBtn]}
          onPress={() => setActiveTab('HOURS')}
        >
          <Text style={[styles.tabText, activeTab === 'HOURS' && styles.activeTabText]}>Working Shifts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'HOLIDAYS' && styles.activeTabBtn]}
          onPress={() => setActiveTab('HOLIDAYS')}
        >
          <Text style={[styles.tabText, activeTab === 'HOLIDAYS' && styles.activeTabText]}>Holiday Calendar</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />}
        >
          {activeTab === 'HOURS' ? (
            <View>
              <Card style={styles.card}>
                <Text style={styles.cardHeading}>Office Shift & Timings</Text>
                <Text style={styles.cardSub}>Define working hours enforced during GPS attendance.</Text>

                <Text style={styles.inputLabel}>Shift Start Time (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:30"
                  value={startTime}
                  onChangeText={setStartTime}
                />

                <Text style={styles.inputLabel}>Shift End Time (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="18:30"
                  value={endTime}
                  onChangeText={setEndTime}
                />

                <Text style={styles.inputLabel}>Late Arrival Grace Period (Minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="15"
                  keyboardType="numeric"
                  value={graceMinutes}
                  onChangeText={setGraceMinutes}
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveHours} disabled={savingHours}>
                  {savingHours ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Working Hours</Text>
                  )}
                </TouchableOpacity>
              </Card>
            </View>
          ) : (
            <View>
              <View style={styles.holidayHeader}>
                <Text style={styles.cardHeading}>Official Holidays ({holidays.length})</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setHolidayModalVisible(true)}>
                  <Icon name="plus" size={14} color="#fff" />
                  <Text style={styles.addBtnText}>Add Holiday</Text>
                </TouchableOpacity>
              </View>

              {holidays.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Icon name="calendar" size={40} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No holidays declared</Text>
                  <Text style={styles.emptySub}>Add gazetted and company holidays.</Text>
                </View>
              ) : (
                holidays.map((h, idx) => (
                  <Card key={h.id || h._id || idx} style={styles.holidayCard}>
                    <View style={styles.holidayInfo}>
                      <Text style={styles.holidayTitle}>{h.name || h.title}</Text>
                      <Text style={styles.holidayDateText}>
                        <Icon name="calendar" size={12} color="#64748B" /> {h.date}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteHoliday(h.id || h._id)}
                    >
                      <Icon name="trash-2" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </Card>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Holiday Modal */}
      <Modal visible={holidayModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Calendar Holiday</Text>
              <TouchableOpacity onPress={() => setHolidayModalVisible(false)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Holiday Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Diwali / Republic Day"
              placeholderTextColor="#94A3B8"
              value={holidayName}
              onChangeText={setHolidayName}
            />

            <Text style={styles.inputLabel}>Holiday Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-11-01"
              placeholderTextColor="#94A3B8"
              value={holidayDate}
              onChangeText={setHolidayDate}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setHolidayModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnModal} onPress={handleAddHoliday} disabled={addingHoliday}>
                {addingHoliday ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTabBtn: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#2563EB',
  },
  content: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: spacing.sm,
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  holidayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  holidayCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  holidayInfo: {
    flex: 1,
  },
  holidayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  holidayDateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  modalOverlay: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtnModal: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    minWidth: 80,
    alignItems: 'center',
  },
});
