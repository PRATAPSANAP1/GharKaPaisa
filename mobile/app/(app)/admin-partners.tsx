import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Partner {
  id: string;
  partner_code?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email?: string;
  mobile?: string;
  status: string;
  kyc_status?: string;
  parent_code?: string;
  created_at?: string;
}

export default function AdminPartnersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchPartners();
  }, [statusFilter]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: '100' };
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await apiClient.get('/admin/partners', { params });
      setPartners(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      Alert.alert('Error', 'Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const handleKycDecision = async (partnerId: string, approved: boolean) => {
    Alert.alert(
      approved ? 'Approve KYC' : 'Reject KYC',
      `Are you sure you want to ${approved ? 'approve' : 'reject'} this partner's KYC?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: approved ? 'Approve' : 'Reject',
          style: approved ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await apiClient.post('/admin/approve-kyc', {
                partnerId,
                approved,
                ...(approved ? {} : { rejection_reason: 'Rejected by admin' }),
              });
              fetchPartners();
              Alert.alert('Success', `KYC ${approved ? 'approved' : 'rejected'} successfully`);
            } catch (error) {
              console.error('Failed to update KYC:', error);
              Alert.alert('Error', 'Failed to update KYC status');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (partnerId: string) => {
    router.push({
      pathname: '/customer-details',
      params: { id: partnerId, type: 'partner' }
    });
  };

  const filteredPartners = partners.filter(p => {
    const haystack = [
      p.first_name,
      p.last_name,
      p.email,
      p.mobile,
      p.partner_code,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchText.toLowerCase());
  });

  const statusOptions = ['all', 'active', 'inactive', 'pending', 'suspended'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading partners...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Partner Management</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search partners..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={colors.textLight}
        />
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

      <View style={styles.partnersContainer}>
        {filteredPartners.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No partners found</Text>
          </View>
        ) : (
          filteredPartners.map((partner) => {
            const kycDecided = partner.kyc_status === 'approved' || partner.kyc_status === 'rejected';
            return (
            <View key={partner.id} style={styles.partnerCard}>
              <View style={styles.partnerHeader}>
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>
                    {`${partner.first_name || 'Partner'} ${partner.last_name || ''}`.trim()}
                  </Text>
                  <Text style={styles.partnerEmail}>{partner.email || '—'}</Text>
                  <Text style={styles.partnerPhone}>{partner.mobile || ''}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(partner.status) }
                  ]}
                >
                  <Text style={styles.statusText}>
                    {(partner.status || 'unknown').charAt(0).toUpperCase() + (partner.status || 'unknown').slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.partnerStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{partner.partner_code || '—'}</Text>
                  <Text style={styles.statLabel}>Partner Code</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue} numberOfLines={1}>{partner.company_name || '—'}</Text>
                  <Text style={styles.statLabel}>Company</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{partner.parent_code || '—'}</Text>
                  <Text style={styles.statLabel}>Parent</Text>
                </View>
              </View>

              <View style={styles.kycContainer}>
                <Text style={styles.kycLabel}>KYC Status:</Text>
                <Text
                  style={[
                    styles.kycStatus,
                    { color: partner.kyc_status === 'approved' ? '#10B981' : partner.kyc_status === 'rejected' ? '#EF4444' : '#F59E0B' }
                  ]}
                >
                  {(partner.kyc_status || 'pending').charAt(0).toUpperCase() + (partner.kyc_status || 'pending').slice(1)}
                </Text>
              </View>

              {!kycDecided && (
                <View style={styles.kycActions}>
                  <TouchableOpacity
                    style={[styles.kycButton, styles.kycApproveButton]}
                    onPress={() => handleKycDecision(partner.id, true)}
                  >
                    <Text style={styles.kycButtonText}>Approve KYC</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.kycButton, styles.kycRejectButton]}
                    onPress={() => handleKycDecision(partner.id, false)}
                  >
                    <Text style={styles.kycButtonText}>Reject KYC</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => handleViewDetails(partner.id)}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return '#10B981';
    case 'inactive': return '#6B7280';
    case 'pending': return '#F59E0B';
    case 'suspended': return '#EF4444';
    default: return '#6B7280';
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
  searchContainer: {
    padding: 16,
    backgroundColor: colors.card,
  },
  searchInput: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 12,
    fontSize: typography.sizes.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bg,
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
  partnersContainer: {
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
  partnerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partnerHeader: {
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
    marginBottom: 2,
  },
  partnerPhone: {
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
  partnerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  kycContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  kycLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginRight: 8,
  },
  kycStatus: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  kycActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  kycButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  kycApproveButton: {
    backgroundColor: '#10B981',
  },
  kycRejectButton: {
    backgroundColor: '#EF4444',
  },
  kycButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  viewButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
