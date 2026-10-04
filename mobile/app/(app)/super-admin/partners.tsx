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
  fetchPartnersList,
  updatePartnerStatus,
  approvePartnerKYC,
  rejectPartnerKYC,
} from '../../../services/super-admin.service';

export default function SuperAdminPartnersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [partners, setPartners] = useState<any[]>([]);

  // Status Action Modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadPartners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPartnersList({
        search: searchQuery || undefined,
        status: selectedFilter !== 'ALL' ? selectedFilter.toLowerCase() : undefined,
      });

      const partnerData = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.partners)
        ? res.partners
        : Array.isArray(res)
        ? res
        : [];
      setPartners(partnerData);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load partners directory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedFilter]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPartners();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedPartner) return;
    try {
      setUpdatingStatus(true);
      await updatePartnerStatus(selectedPartner.id || selectedPartner.user_id, newStatus);
      setStatusModalVisible(false);
      Alert.alert('Success', `Partner status updated to ${newStatus}`);
      loadPartners();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update partner status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleKYCAction = async (partnerId: string, partnerName: string, approve: boolean) => {
    Alert.alert(
      approve ? 'Approve KYC' : 'Reject KYC',
      `Are you sure you want to ${approve ? 'approve' : 'reject'} KYC for ${partnerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: approve ? 'Approve' : 'Reject',
          style: approve ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (approve) {
                await approvePartnerKYC(partnerId);
                Alert.alert('Approved', `KYC approved for ${partnerName}`);
              } else {
                await rejectPartnerKYC(partnerId, 'Documents could not be verified');
                Alert.alert('Rejected', `KYC rejected for ${partnerName}`);
              }
              loadPartners();
            } catch (err: any) {
              Alert.alert('Action Failed', err.message || 'Could not perform KYC action');
            }
          },
        },
      ]
    );
  };

  const filterOptions = [
    { key: 'ALL', label: 'All Partners' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'PENDING', label: 'Pending KYC' },
    { key: 'SUSPENDED', label: 'Suspended' },
    { key: 'BLOCKED', label: 'Blocked' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>SUPER ADMIN</Text>
          <Text style={styles.headerTitle}>Partner Management</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search partner name, code, phone, email..."
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

      {/* Filter Tabs */}
      <View style={styles.filterScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {filterOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterPill, selectedFilter === opt.key && styles.activeFilterPill]}
              onPress={() => setSelectedFilter(opt.key)}
            >
              <Text style={[styles.filterText, selectedFilter === opt.key && styles.activeFilterText]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Partner List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading partners...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {partners.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="users" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Partners Found</Text>
              <Text style={styles.emptyDesc}>No partners match the selected filter criteria.</Text>
            </View>
          ) : (
            partners.map((partner) => {
              const status = (partner.status || partner.partner_status || 'ACTIVE').toUpperCase();
              const isKycPending = (partner.kyc_status || '').toUpperCase() === 'PENDING' || (partner.kyc_status || '').toUpperCase() === 'SUBMITTED';

              let badgeColor = '#10B981';
              let badgeBg = '#DCFCE7';
              if (status === 'SUSPENDED' || status === 'BLOCKED') {
                badgeColor = '#EF4444';
                badgeBg = '#FEE2E2';
              } else if (status === 'PENDING') {
                badgeColor = '#F59E0B';
                badgeBg = '#FEF3C7';
              }

              return (
                <Card key={partner.id || partner.user_id} style={styles.partnerCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {(partner.full_name || partner.name || 'P').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.partnerName}>{partner.full_name || partner.name}</Text>
                      <Text style={styles.partnerSub}>
                        {partner.partner_code || partner.referral_code || 'ID: ' + (partner.id || '').substring(0, 8)} • {partner.city || 'India'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{status}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Mobile</Text>
                      <Text style={styles.infoValue}>{partner.mobile || partner.mobile_number || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>KYC Status</Text>
                      <Text
                        style={[
                          styles.infoValue,
                          {
                            color: isKycPending ? '#D97706' : '#059669',
                          },
                        ]}
                      >
                        {partner.kyc_status ? partner.kyc_status.toUpperCase() : 'VERIFIED'}
                      </Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Wallet Balance</Text>
                      <Text style={styles.infoValue}>
                        ₹{(partner.wallet_balance || partner.balance || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* KYC Verification Fast Action (if pending) */}
                  {isKycPending && (
                    <View style={styles.kycActionRow}>
                      <TouchableOpacity
                        style={[styles.kycBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => handleKYCAction(partner.id, partner.full_name || partner.name, true)}
                      >
                        <Icon name="check" size={14} color="#fff" />
                        <Text style={styles.kycBtnText}>Approve KYC</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.kycBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => handleKYCAction(partner.id, partner.full_name || partner.name, false)}
                      >
                        <Icon name="x" size={14} color="#fff" />
                        <Text style={styles.kycBtnText}>Reject KYC</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Actions Row */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setSelectedPartner(partner);
                        setStatusModalVisible(true);
                      }}
                    >
                      <Icon name="settings" size={14} color={colors.textMid} />
                      <Text style={styles.actionBtnText}>Change Status</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Status Modal */}
      <Modal visible={statusModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Manage Partner Access</Text>
            <Text style={styles.modalSub}>
              Update account status for {selectedPartner?.full_name || selectedPartner?.name}.
            </Text>

            <TouchableOpacity
              style={[styles.statusOption, { borderColor: '#10B981', backgroundColor: '#F0FDF4' }]}
              onPress={() => handleStatusChange('ACTIVE')}
              disabled={updatingStatus}
            >
              <Icon name="check-circle" size={20} color="#10B981" />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[styles.statusOptionTitle, { color: '#15803D' }]}>Active</Text>
                <Text style={styles.statusOptionDesc}>Full access to dashboard, payouts and links</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]}
              onPress={() => handleStatusChange('SUSPENDED')}
              disabled={updatingStatus}
            >
              <Icon name="alert-triangle" size={20} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[styles.statusOptionTitle, { color: '#B45309' }]}>Suspend Account</Text>
                <Text style={styles.statusOptionDesc}>Temporarily hold payouts and lead submissions</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}
              onPress={() => handleStatusChange('BLOCKED')}
              disabled={updatingStatus}
            >
              <Icon name="x-circle" size={20} color="#EF4444" />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[styles.statusOptionTitle, { color: '#B91C1C' }]}>Block Partner</Text>
                <Text style={styles.statusOptionDesc}>Permanently block login and commission access</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setStatusModalVisible(false)}
              disabled={updatingStatus}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
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
  filterScrollWrapper: {
    maxHeight: 46,
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilterPill: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMid,
  },
  activeFilterText: {
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
  partnerCard: {
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
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  partnerSub: {
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
  kycActionRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  kycBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  kycBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  cardActions: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMid,
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
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  statusOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusOptionDesc: {
    fontSize: 11,
    color: colors.textMid,
    marginTop: 2,
  },
  modalCloseBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: spacing.xs,
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMid,
  },
});
