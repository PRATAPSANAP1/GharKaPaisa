import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
  fetchBanksList,
  assignBankOperationHead,
  fetchAdminUsers,
} from '../../../services/super-admin.service';

export default function SuperAdminBanksScreen() {
  const router = useRouter();
  const [banks, setBanks] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Assign Modal
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [banksRes, adminsRes] = await Promise.allSettled([
        fetchBanksList(),
        fetchAdminUsers(),
      ]);

      if (banksRes.status === 'fulfilled') {
        const bList = Array.isArray(banksRes.value) ? banksRes.value : banksRes.value.data || banksRes.value.banks || [];
        setBanks(bList);
      }
      if (adminsRes.status === 'fulfilled') {
        const val: any = adminsRes.value;
        const aList = Array.isArray(val) ? val : val?.admins || val?.data || [];
        setAdmins(aList);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load banks directory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignHead = async () => {
    if (!selectedBank || !selectedAdminId) {
      Alert.alert('Validation', 'Please select an administrator to assign as operation head.');
      return;
    }

    setAssigning(true);
    try {
      await assignBankOperationHead(selectedBank.id || selectedBank._id, selectedAdminId);
      Alert.alert('Success', 'Operation head assigned successfully.');
      setAssignModalVisible(false);
      setSelectedBank(null);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to assign operation head');
    } finally {
      setAssigning(false);
    }
  };

  const filteredBanks = banks.filter((b) => {
    if (!search.trim()) return true;
    const name = b.name || b.bank_name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const renderBankCard = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.bankNameWrap}>
          <Icon name="shield" size={18} color="#2563EB" />
          <Text style={styles.bankName}>{item.name || item.bank_name || 'Partner Bank'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.is_active !== false ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[styles.statusText, { color: item.is_active !== false ? '#15803D' : '#991B1B' }]}>
            {item.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailCol}>
          <Text style={styles.label}>Operation Head</Text>
          <Text style={styles.val}>{item.operation_head_name || item.head_name || 'Unassigned'}</Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.label}>Active Products</Text>
          <Text style={styles.val}>{item.product_count || item.products?.length || 0} Products</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.assignBtn}
          onPress={() => {
            setSelectedBank(item);
            setSelectedAdminId(item.operation_head_id || '');
            setAssignModalVisible(true);
          }}
        >
          <Icon name="user-check" size={14} color="#2563EB" />
          <Text style={styles.assignBtnText}>Assign Operation Head</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Bank Partners</Text>
          <Text style={styles.headerSubtitle}>Manage bank integrations & operation heads</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchInputWrap}>
          <Icon name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search banks..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching partner banks...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBanks}
          keyExtractor={(item, index) => item.id || item._id || String(index)}
          renderItem={renderBankCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Icon name="briefcase" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No banks found</Text>
              <Text style={styles.emptySub}>No banks match your search criteria.</Text>
            </View>
          }
        />
      )}

      {/* Assign Operation Head Modal */}
      <Modal visible={assignModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Operation Head</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Bank: <Text style={styles.bold}>{selectedBank?.name || selectedBank?.bank_name}</Text>
            </Text>

            <Text style={styles.selectLabel}>Select Administrator:</Text>
            <FlatList
              data={admins}
              keyExtractor={(item) => item.id || item._id}
              style={styles.adminList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.adminItem, selectedAdminId === (item.id || item._id) && styles.activeAdminItem]}
                  onPress={() => setSelectedAdminId(item.id || item._id)}
                >
                  <View>
                    <Text style={[styles.adminItemName, selectedAdminId === (item.id || item._id) && styles.activeAdminText]}>
                      {item.fullName || item.name}
                    </Text>
                    <Text style={styles.adminItemSub}>{item.designation || item.role}</Text>
                  </View>
                  {selectedAdminId === (item.id || item._id) ? (
                    <Icon name="check" size={16} color="#2563EB" />
                  ) : null}
                </TouchableOpacity>
              )}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAssignModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAssignHead} disabled={assigning}>
                {assigning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Assign Head</Text>}
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
  searchBarWrap: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: spacing.xs,
    fontSize: 14,
    color: '#1E293B',
  },
  listContent: {
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
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bankNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailCol: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  val: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.xs,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  assignBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: spacing.md,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  adminList: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  adminItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  activeAdminItem: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  adminItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  activeAdminText: {
    color: '#2563EB',
  },
  adminItemSub: {
    fontSize: 11,
    color: '#64748B',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
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
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    minWidth: 110,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
