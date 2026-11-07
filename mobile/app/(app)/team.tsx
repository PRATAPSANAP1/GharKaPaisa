import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../../components/Icon';
import { fetchPartnerTeamMembers, fetchPartnerTeamDashboard } from '../../services/partner.service';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function TeamScreen() {
  const { user } = useAuth();

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamSummary, setTeamSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [submittingInvite, setSubmittingInvite] = useState<boolean>(false);
  const [inviteForm, setInviteForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
  });
  const [inviteResult, setInviteResult] = useState<any>(null);

  const loadTeamData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [membersRes, dashRes] = await Promise.allSettled([
        fetchPartnerTeamMembers(),
        fetchPartnerTeamDashboard(),
      ]);

      if (membersRes.status === 'fulfilled' && membersRes.value.success) {
        setTeamMembers(membersRes.value.data || membersRes.value.members || []);
      }
      if (dashRes.status === 'fulfilled' && dashRes.value.success) {
        setTeamSummary(dashRes.value.data || dashRes.value);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load team details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const handleAddMember = async () => {
    // Validation
    if (!inviteForm.first_name.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return;
    }
    if (!inviteForm.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }
    if (!inviteForm.mobile.trim()) {
      Alert.alert('Validation Error', 'Mobile number is required');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(inviteForm.mobile.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    try {
      setSubmittingInvite(true);
      const response = await apiClient.post('/partner/team/invite', {
        first_name: inviteForm.first_name.trim(),
        last_name: inviteForm.last_name.trim(),
        email: inviteForm.email.trim(),
        mobile: inviteForm.mobile.trim(),
      });

      if (response.data?.success) {
        setInviteResult(response.data);
        Alert.alert(
          'Invitation Sent!',
          'Team member has been invited successfully. You can share the invite link via WhatsApp.',
          [
            { text: 'OK', onPress: () => {
              setShowAddMemberModal(false);
              setInviteForm({ first_name: '', last_name: '', email: '', mobile: '' });
              setInviteResult(null);
              loadTeamData(true);
            }},
            { text: 'Share WhatsApp', onPress: () => {
              if (response.data?.whatsapp_link) {
                Linking.openURL(response.data.whatsapp_link);
              }
            }},
          ]
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to send invitation. Please try again.'
      );
    } finally {
      setSubmittingInvite(false);
    }
  };

  const renderMemberCard = ({ item }: { item: any }) => {
    const name = item.full_name || item.name || 'Team Member';
    const role = item.role || item.designation || 'Member';
    const code = item.employee_code || item.partner_code || item.code || 'N/A';
    const status = item.status || (item.is_active ? 'ACTIVE' : 'INACTIVE');

    return (
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarBg}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{name}</Text>
            <Text style={styles.memberMeta}>Code: {code} • {role}</Text>
          </View>
          <View style={[styles.statusBadge, status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, status === 'ACTIVE' ? styles.statusTextActive : styles.statusTextInactive]}>
              {status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>My Team</Text>
          <Text style={styles.subtitle}>Direct Network & Team Members</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddMemberModal(true)}
        >
          <Icon name="user-plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Banner if available */}
      {teamSummary ? (
        <View style={styles.summaryBar}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Total Members</Text>
            <Text style={styles.summaryValue}>{teamSummary.total_members || teamMembers.length}</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Active</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>
              {teamSummary.active_members || teamMembers.filter((m: any) => m.is_active || m.status === 'ACTIVE').length}
            </Text>
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={teamMembers}
          keyExtractor={(item, idx) => item.id || String(idx)}
          renderItem={renderMemberCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadTeamData(true)} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="users" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>No team members found.</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => setShowAddMemberModal(true)}
              >
                <Text style={styles.emptyButtonText}>Add Your First Team Member</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Team Member</Text>
              <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.formLabel}>First Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter first name"
                value={inviteForm.first_name}
                onChangeText={(text) => setInviteForm({ ...inviteForm, first_name: text })}
              />

              <Text style={styles.formLabel}>Last Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter last name (optional)"
                value={inviteForm.last_name}
                onChangeText={(text) => setInviteForm({ ...inviteForm, last_name: text })}
              />

              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={inviteForm.email}
                onChangeText={(text) => setInviteForm({ ...inviteForm, email: text })}
              />

              <Text style={styles.formLabel}>Mobile Number *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter 10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
                value={inviteForm.mobile}
                onChangeText={(text) => setInviteForm({ ...inviteForm, mobile: text.replace(/\D/g, '') })}
              />

              <View style={styles.infoBox}>
                <Icon name="info" size={16} color="#3B82F6" />
                <Text style={styles.infoText}>
                  An invitation with login credentials will be sent to the team member via SMS and email.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddMember}
                disabled={submittingInvite}
              >
                {submittingInvite ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Send Invitation</Text>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  summaryCol: {
    marginRight: spacing.xl,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#065F46',
  },
  statusTextInactive: {
    color: '#4B5563',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: '#64748B',
  },
  emptyButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: typography.sizes.sm,
    color: '#0F172A',
    marginBottom: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#64748B',
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
