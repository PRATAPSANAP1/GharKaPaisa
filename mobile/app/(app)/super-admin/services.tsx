import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../../components/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import apiClient from '../../../services/api';

interface ServiceItem {
  id: number | string;
  name: string;
  icon?: string;
  route?: string;
  status: 'active' | 'inactive';
  display_order: number;
  clicks?: number;
  created_at?: string;
  updated_at?: string;
}

const COMMON_ICONS = [
  'zap',
  'credit-card',
  'smartphone',
  'dollar-sign',
  'activity',
  'shield',
  'compass',
  'file-text',
  'shopping-bag',
  'briefcase',
  'award',
  'layers',
];

export default function ManageServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('zap');
  const [routePath, setRoutePath] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  const loadServices = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await apiClient.get('/service-catalog');
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setServices(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.warn('Failed to load service catalog:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Could not load services.');
      setServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleOpenCreate = () => {
    setEditingService(null);
    setName('');
    setIcon('zap');
    setRoutePath('');
    setDisplayOrder(String((services.length + 1) * 10));
    setStatus('active');
    setModalVisible(true);
  };

  const handleOpenEdit = (svc: ServiceItem) => {
    setEditingService(svc);
    setName(svc.name || '');
    setIcon(svc.icon || 'zap');
    setRoutePath(svc.route || '');
    setDisplayOrder(String(svc.display_order ?? 1));
    setStatus(svc.status || 'active');
    setModalVisible(true);
  };

  const handleToggleStatus = async (svc: ServiceItem) => {
    const nextStatus = svc.status === 'active' ? 'inactive' : 'active';
    try {
      // Optimistic update
      setServices((prev) =>
        prev.map((s) => (s.id === svc.id ? { ...s, status: nextStatus } : s))
      );
      await apiClient.put(`/service-catalog/${svc.id}`, { status: nextStatus });
    } catch (err: any) {
      console.warn('Toggle service status failed:', err);
      // Revert on error
      setServices((prev) =>
        prev.map((s) => (s.id === svc.id ? { ...s, status: svc.status } : s))
      );
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update service status.');
    }
  };

  const handleDelete = (svc: ServiceItem) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${svc.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/service-catalog/${svc.id}`);
              setServices((prev) => prev.filter((s) => s.id !== svc.id));
              Alert.alert('Success', `"${svc.name}" has been deleted.`);
            } catch (err: any) {
              console.warn('Delete service failed:', err);
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete service.');
            }
          },
        },
      ]
    );
  };

  const handleSaveService = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Service name is required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        icon: icon.trim() || 'zap',
        route: routePath.trim() || null,
        display_order: parseInt(displayOrder, 10) || 1,
        status,
      };

      if (editingService) {
        const res = await apiClient.put(`/service-catalog/${editingService.id}`, payload);
        const updated = res.data?.data || res.data;
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? { ...s, ...updated } : s))
        );
        Alert.alert('Success', 'Service updated successfully.');
      } else {
        const res = await apiClient.post('/service-catalog', payload);
        const created = res.data?.data || res.data;
        if (created) {
          setServices((prev) => [...prev, created]);
        } else {
          loadServices();
        }
        Alert.alert('Success', 'New service added to catalog.');
      }

      setModalVisible(false);
    } catch (err: any) {
      console.warn('Save service failed:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = services.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.route?.toLowerCase().includes(q) ||
      s.icon?.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Services Catalog</Text>
            <Text style={styles.headerSubtitle}>Manage Homepage & Portal Service Offerings</Text>
          </View>
          <TouchableOpacity onPress={handleOpenCreate} style={styles.addButton}>
            <Icon name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services by title or route..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Summary Badges */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeLabel}>Total</Text>
            <Text style={styles.summaryBadgeValue}>{services.length}</Text>
          </View>
          <View style={[styles.summaryBadge, { borderColor: '#10B98133' }]}>
            <Text style={[styles.summaryBadgeLabel, { color: '#10B981' }]}>Active</Text>
            <Text style={[styles.summaryBadgeValue, { color: '#10B981' }]}>
              {services.filter((s) => s.status === 'active').length}
            </Text>
          </View>
          <View style={[styles.summaryBadge, { borderColor: '#F59E0B33' }]}>
            <Text style={[styles.summaryBadgeLabel, { color: '#F59E0B' }]}>Inactive</Text>
            <Text style={[styles.summaryBadgeValue, { color: '#F59E0B' }]}>
              {services.filter((s) => s.status === 'inactive').length}
            </Text>
          </View>
        </View>

        {/* List Content */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading catalog services...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadServices(true)}
                tintColor={colors.primary}
              />
            }
          >
            {filteredServices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="layers" size={48} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No Services Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'No service matches your search query.'
                    : 'Get started by creating your first service entry.'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenCreate}>
                    <Text style={styles.emptyAddBtnText}>+ Add Service</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredServices.map((svc) => (
                <View key={String(svc.id)} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconCircle}>
                      <Icon name={(svc.icon as any) || 'zap'} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.cardTitle}>{svc.name}</Text>
                      <Text style={styles.cardRoute}>{svc.route || 'No route defined'}</Text>
                    </View>
                    <Switch
                      value={svc.status === 'active'}
                      onValueChange={() => handleToggleStatus(svc)}
                      trackColor={{ false: '#334155', true: '#10B981' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Order</Text>
                      <Text style={styles.metaValue}>#{svc.display_order}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Clicks</Text>
                      <Text style={styles.metaValue}>{svc.clicks ?? 0}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Status</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              svc.status === 'active' ? '#10B98120' : '#64748B20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: svc.status === 'active' ? '#10B981' : '#94A3B8',
                            },
                          ]}
                        >
                          {svc.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionBtnEdit}
                      onPress={() => handleOpenEdit(svc)}
                    >
                      <Icon name="edit-2" size={15} color="#3B82F6" />
                      <Text style={styles.actionBtnEditText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnDelete}
                      onPress={() => handleDelete(svc)}
                    >
                      <Icon name="trash-2" size={15} color="#EF4444" />
                      <Text style={styles.actionBtnDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Modal for Create / Edit Service */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="x" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                {/* Service Name */}
                <Text style={styles.inputLabel}>Service Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mobile Recharge, Personal Loan"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={setName}
                />

                {/* Route Path */}
                <Text style={styles.inputLabel}>Application / Web Route</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. /recharge, /loans/personal"
                  placeholderTextColor={colors.textLight}
                  value={routePath}
                  onChangeText={setRoutePath}
                  autoCapitalize="none"
                />

                {/* Display Order */}
                <Text style={styles.inputLabel}>Display Order (Priority)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10"
                  placeholderTextColor={colors.textLight}
                  value={displayOrder}
                  onChangeText={setDisplayOrder}
                  keyboardType="numeric"
                />

                {/* Icon Selection */}
                <Text style={styles.inputLabel}>Icon Symbol</Text>
                <View style={styles.iconPickerRow}>
                  {COMMON_ICONS.map((ic) => (
                    <TouchableOpacity
                      key={ic}
                      style={[
                        styles.iconChip,
                        icon === ic && styles.iconChipSelected,
                      ]}
                      onPress={() => setIcon(ic)}
                    >
                      <Icon
                        name={ic as any}
                        size={18}
                        color={icon === ic ? '#FFFFFF' : colors.textMid}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Status Toggle */}
                <View style={styles.statusToggleRow}>
                  <Text style={styles.statusToggleLabel}>Publish / Activate</Text>
                  <Switch
                    value={status === 'active'}
                    onValueChange={(val) => setStatus(val ? 'active' : 'inactive')}
                    trackColor={{ false: '#334155', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </ScrollView>

              {/* Modal Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveService}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingService ? 'Save Changes' : 'Create Service'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    padding: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.md,
    gap: 12,
  },
  summaryBadge: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  summaryBadgeLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  summaryBadgeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: spacing.md,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: spacing.xl,
  },
  emptyAddBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3B82F620',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  cardRoute: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#3B82F615',
    borderRadius: 6,
  },
  actionBtnEditText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EF444415',
    borderRadius: 6,
  },
  actionBtnDeleteText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
    color: '#F8FAFC',
  },
  modalForm: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  iconPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  statusToggleLabel: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
