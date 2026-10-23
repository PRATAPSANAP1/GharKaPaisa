import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Commission {
  id: string;
  amount: number;
  credit: number;
  status: string;
  description?: string;
  partner_id?: string;
  partner_code?: string;
  user_name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  app_number?: string;
  product_name?: string;
  created_at: string;
}

export default function ManageCommissionsScreen() {
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/wallet/admin/commissions/pending', {
        params: { limit: 100 },
      });
      setCommissions(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
      Alert.alert('Error', 'Failed to load pending commissions');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessCommission = async (commissionId: string, action: 'release' | 'reject') => {
    try {
      await apiClient.post(`/wallet/admin/commissions/${commissionId}/${action}`, {});
      fetchCommissions();
      Alert.alert(
        'Success',
        action === 'release' ? 'Commission released successfully' : 'Commission rejected successfully'
      );
    } catch (error) {
      console.error(`Failed to ${action} commission:`, error);
      Alert.alert('Error', `Failed to ${action} commission`);
    }
  };

  const getBeneficiaryName = (commission: Commission) =>
    commission.user_name ||
    `${commission.first_name || ''} ${commission.last_name || ''}`.trim() ||
    commission.partner_code ||
    'Beneficiary Member';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading commissions...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Commissions</Text>
        <Text style={styles.subtitle}>Pending commission approvals</Text>
      </View>

      <View style={styles.commissionsContainer}>
        {commissions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending commissions</Text>
          </View>
        ) : (
          commissions.map((commission) => (
            <View key={commission.id} style={styles.commissionCard}>
              <View style={styles.commissionHeader}>
                <View style={styles.commissionInfo}>
                  <Text style={styles.partnerName}>{getBeneficiaryName(commission)}</Text>
                  <Text style={styles.productName}>
                    {commission.product_name || 'Credit Product'}
                    {commission.partner_code ? ` • ${commission.partner_code}` : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(commission.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{formatStatus(commission.status)}</Text>
                </View>
              </View>

              <View style={styles.commissionDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>
                    ₹{Number(commission.amount || commission.credit || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Application</Text>
                  <Text style={styles.detailValue}>{commission.app_number || 'N/A'}</Text>
                </View>
                {commission.role && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Role</Text>
                    <Text style={styles.detailValue}>{commission.role}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.dateText}>
                Created: {new Date(commission.created_at).toLocaleDateString()}
              </Text>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleProcessCommission(commission.id, 'release')}
                >
                  <Text style={styles.actionButtonText}>Release</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleProcessCommission(commission.id, 'reject')}
                >
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const formatStatus = (status?: string) =>
  (status || 'pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

const getStatusColor = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'pending':
    case 'pending approval':
      return '#F59E0B';
    case 'on_hold':
    case 'held':
      return '#EF4444';
    case 'processing':
      return '#3B82F6';
    default:
      return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
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
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginTop: 4,
  },
  commissionsContainer: {
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
  commissionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commissionInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  productName: {
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
  commissionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
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
});
