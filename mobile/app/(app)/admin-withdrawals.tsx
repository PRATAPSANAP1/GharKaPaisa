import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Withdrawal {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_email: string;
  amount: number;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  status: string;
  requested_at: string;
  processed_at?: string;
  remarks?: string;
}

export default function AdminWithdrawalsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await apiClient.get('/admin/withdrawals', { params });
      setWithdrawals(response.data || []);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
      Alert.alert('Error', 'Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    Alert.alert(
      'Confirm Approval',
      'Are you sure you want to approve this withdrawal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await apiClient.patch(`/admin/withdrawals/${withdrawalId}`, {
                status: 'approved',
                processed_at: new Date().toISOString()
              });
              fetchWithdrawals();
              Alert.alert('Success', 'Withdrawal approved successfully');
            } catch (error) {
              console.error('Failed to approve withdrawal:', error);
              Alert.alert('Error', 'Failed to approve withdrawal');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (withdrawalId: string) => {
    Alert.alert(
      'Confirm Rejection',
      'Are you sure you want to reject this withdrawal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.patch(`/admin/withdrawals/${withdrawalId}`, {
                status: 'rejected',
                processed_at: new Date().toISOString(),
                remarks: 'Rejected by admin'
              });
              fetchWithdrawals();
              Alert.alert('Success', 'Withdrawal rejected successfully');
            } catch (error) {
              console.error('Failed to reject withdrawal:', error);
              Alert.alert('Error', 'Failed to reject withdrawal');
            }
          },
        },
      ]
    );
  };

  const handleViewPartner = (partnerId: string) => {
    router.push({
      pathname: '/customer-details',
      params: { id: partnerId, type: 'partner' }
    });
  };

  const filteredWithdrawals = withdrawals.filter(w =>
    statusFilter === 'all' || w.status === statusFilter
  );

  const statusOptions = ['all', 'pending', 'approved', 'rejected', 'processing'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading withdrawals...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Withdrawal Management</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.filterChipActive
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.withdrawalsContainer}>
        {filteredWithdrawals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No withdrawals found</Text>
          </View>
        ) : (
          filteredWithdrawals.map((withdrawal) => (
            <View key={withdrawal.id} style={styles.withdrawalCard}>
              <View style={styles.withdrawalHeader}>
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{withdrawal.partner_name}</Text>
                  <Text style={styles.partnerEmail}>{withdrawal.partner_email}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(withdrawal.status) }
                  ]}
                >
                  <Text style={styles.statusText}>
                    {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Withdrawal Amount</Text>
                <Text style={styles.amountValue}>₹{withdrawal.amount.toLocaleString()}</Text>
              </View>

              <View style={styles.bankDetails}>
                <Text style={styles.bankLabel}>Bank Account Details</Text>
                <Text style={styles.bankName}>{withdrawal.bank_name}</Text>
                <Text style={styles.accountNumber}>A/C: {withdrawal.account_number}</Text>
                <Text style={styles.ifscCode}>IFSC: {withdrawal.ifsc_code}</Text>
              </View>

              <View style={styles.timestamps}>
                <Text style={styles.timestampLabel}>
                  Requested: {new Date(withdrawal.requested_at).toLocaleDateString()}
                </Text>
                {withdrawal.processed_at && (
                  <Text style={styles.timestampLabel}>
                    Processed: {new Date(withdrawal.processed_at).toLocaleDateString()}
                  </Text>
                )}
              </View>

              {withdrawal.status === 'pending' && (
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(withdrawal.id)}
                  >
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(withdrawal.id)}
                  >
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.viewPartnerButton}
                onPress={() => handleViewPartner(withdrawal.partner_id)}
              >
                <Text style={styles.viewPartnerButtonText}>View Partner Details</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return '#10B981';
    case 'rejected': return '#EF4444';
    case 'processing': return '#3B82F6';
    case 'pending': return '#F59E0B';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: typography.sizes.sm,
  },
  header: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.card,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  withdrawalsContainer: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textLight,
  },
  withdrawalCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  partnerEmail: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  amountContainer: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  bankDetails: {
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bankLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 4,
  },
  bankName: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.semiBold,
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginBottom: 2,
  },
  ifscCode: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
  timestamps: {
    marginBottom: 12,
  },
  timestampLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  viewPartnerButton: {
    backgroundColor: colors.background,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewPartnerButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
  },
});
