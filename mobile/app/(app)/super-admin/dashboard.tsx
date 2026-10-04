import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import {
  fetchSuperAdminDashboard,
  fetchBusinessStats,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '../../../services/super-admin.service';

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  path: string;
}

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: string;
  designation: string;
  status: string;
  bank_ids: string[];
  created_at: string;
}

export default function SuperAdminDashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [businessStats, setBusinessStats] = useState<any>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Form states
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    role: 'ADMIN',
    designation: '',
    password: '',
    confirmPassword: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [metricsRes, statsRes, adminsRes] = await Promise.allSettled([
        fetchSuperAdminDashboard(),
        fetchBusinessStats(),
        fetchAdminUsers(),
      ]);

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value);
      }
      if (statsRes.status === 'fulfilled') {
        setBusinessStats(statsRes.value);
      }
      if (adminsRes.status === 'fulfilled') {
        setAdmins(adminsRes.value.admins || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleCreateAdmin = async () => {
    setFormError('');
    
    // Validation
    if (!form.fullName || !form.email || !form.mobile || !form.designation || !form.password) {
      return setFormError('All fields are required');
    }
    if (form.password !== form.confirmPassword) {
      return setFormError('Passwords do not match');
    }
    if (form.password.length < 8) {
      return setFormError('Password must be at least 8 characters');
    }

    setFormLoading(true);
    try {
      await createAdminUser({
        fullName: form.fullName,
        email: form.email,
        mobile: form.mobile,
        role: form.role,
        designation: form.designation,
        password: form.password,
        bank_ids: [],
      });
      Alert.alert('Success', 'Admin created successfully');
      setShowCreateModal(false);
      setForm({
        fullName: '',
        email: '',
        mobile: '',
        role: 'ADMIN',
        designation: '',
        password: '',
        confirmPassword: '',
      });
      loadDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create admin');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditAdmin = async () => {
    if (!editingAdmin) return;
    setFormLoading(true);
    try {
      await updateAdminUser(editingAdmin.id, {
        fullName: form.fullName,
        email: form.email,
        mobile: form.mobile,
        designation: form.designation,
        status: editingAdmin.status,
        bank_ids: editingAdmin.bank_ids || [],
      });
      Alert.alert('Success', 'Admin updated successfully');
      setShowEditModal(false);
      setEditingAdmin(null);
      loadDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update admin');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    Alert.alert(
      'Delete Admin',
      'Are you sure you want to permanently delete this administrator?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdminUser(adminId);
              Alert.alert('Success', 'Admin deleted successfully');
              loadDashboardData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete admin');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setForm({
      fullName: admin.fullName,
      email: admin.email,
      mobile: admin.mobile,
      role: admin.role,
      designation: admin.designation,
      password: '',
      confirmPassword: '',
    });
    setShowEditModal(true);
  };

  const statCards: StatCard[] = [
    { label: 'Total Admins', value: admins.length, icon: 'users', color: '#3B82F6', path: '/super-admin/dashboard' },
    { label: 'Active Admins', value: admins.filter(a => a.status === 'active').length, icon: 'check-circle', color: '#10B981', path: '/super-admin/dashboard' },
    { label: 'Pending KYC', value: businessStats?.Partners?.pending_kyc || 0, icon: 'clock', color: '#F59E0B', path: '/super-admin/partners' },
    { label: 'Total Leads', value: businessStats?.leads?.total_leads || 0, icon: 'list', color: '#8B5CF6', path: '/super-admin/leads' },
    { label: 'Commission Paid', value: `₹${(businessStats?.withdrawal?.total_commission_paid || 0).toLocaleString('en-IN')}`, icon: 'credit-card', color: '#10B981', path: '/super-admin/commissions' },
    { label: 'Total Banks', value: businessStats?.banks?.total_banks || 0, icon: 'shield', color: '#3B82F6', path: '/super-admin/banks' },
  ];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Super Admin Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.roleBadge}>SUPER ADMIN</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>{user?.full_name || 'Administrator'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/(auth)/login')}>
          <Icon name="x" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={18} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.statCard, { borderLeftColor: stat.color }]}
            onPress={() => router.push(stat.path as any)}
          >
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Admin Management Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Admin Management</Text>
          <Button
            title="Add Admin"
            onPress={() => setShowCreateModal(true)}
            style={styles.addBtn}
          />
        </View>

        {admins.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No administrators found</Text>
          </Card>
        ) : (
          admins.map((admin) => (
            <Card key={admin.id} style={styles.adminCard}>
              <View style={styles.adminHeader}>
                <View style={styles.adminInfo}>
                  <Text style={styles.adminName}>{admin.fullName}</Text>
                  <Text style={styles.adminEmail}>{admin.email}</Text>
                  <Text style={styles.adminMobile}>{admin.mobile}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: admin.status === 'active' ? '#D1FAE5' : '#FEE2E2' }]}>
                  <Text style={[styles.statusText, { color: admin.status === 'active' ? '#065F46' : '#991B1B' }]}>
                    {admin.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.adminDetails}>
                <Text style={styles.adminDetail}>{admin.designation}</Text>
                <Text style={styles.adminDetail}>{admin.role}</Text>
              </View>
              <View style={styles.adminActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => openEditModal(admin)}
                >
                  <Icon name="check-circle" size={16} color={colors.primary} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDeleteAdmin(admin.id)}
                >
                  <Icon name="x-circle" size={16} color={colors.error} />
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Create Admin Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Admin</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={form.fullName}
                onChangeText={(text) => setForm({ ...form, fullName: text })}
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
              />

              <Text style={styles.label}>Mobile *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
                value={form.mobile}
                onChangeText={(text) => setForm({ ...form, mobile: text })}
              />

              <Text style={styles.label}>Designation *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Operational Head"
                value={form.designation}
                onChangeText={(text) => setForm({ ...form, designation: text })}
              />

              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 8 characters"
                secureTextEntry
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
              />

              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                secureTextEntry
                value={form.confirmPassword}
                onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
              />

              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

              <Button
                title={formLoading ? 'Creating...' : 'Create Admin'}
                onPress={handleCreateAdmin}
                loading={formLoading}
                style={styles.modalButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Admin</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Icon name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={form.fullName}
                onChangeText={(text) => setForm({ ...form, fullName: text })}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
              />

              <Text style={styles.label}>Mobile</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={form.mobile}
                onChangeText={(text) => setForm({ ...form, mobile: text })}
              />

              <Text style={styles.label}>Designation</Text>
              <TextInput
                style={styles.input}
                value={form.designation}
                onChangeText={(text) => setForm({ ...form, designation: text })}
              />

              <Text style={styles.label}>New Password (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Leave blank to keep current"
                secureTextEntry
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
              />

              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

              <Button
                title={formLoading ? 'Updating...' : 'Update Admin'}
                onPress={handleEditAdmin}
                loading={formLoading}
                style={styles.modalButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMid,
    marginTop: spacing.sm,
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 2,
  },
  logoutBtn: {
    padding: spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMid,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  addBtn: {
    paddingHorizontal: spacing.md,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMid,
  },
  adminCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  adminEmail: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 2,
  },
  adminMobile: {
    fontSize: 12,
    color: colors.textMid,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  adminDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  adminDetail: {
    fontSize: 11,
    color: colors.textMid,
  },
  adminActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  deleteBtn: {
    marginLeft: 'auto',
  },
  deleteText: {
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButton: {
    marginTop: spacing.md,
  },
});
