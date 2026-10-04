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
  fetchCommissionRules,
  createCommissionRule,
  fetchCommissionReports,
} from '../../../services/super-admin.service';

export default function SuperAdminCommissionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'RULES' | 'OVERVIEW'>('RULES');
  const [rules, setRules] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Rule Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [productType, setProductType] = useState('CREDIT_CARD');
  const [partnerTier, setPartnerTier] = useState('SILVER');
  const [commissionAmount, setCommissionAmount] = useState('');
  const [commissionType, setCommissionType] = useState<'FLAT' | 'PERCENTAGE'>('FLAT');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [rulesRes, overviewRes] = await Promise.allSettled([
        fetchCommissionRules(),
        fetchCommissionReports(),
      ]);

      if (rulesRes.status === 'fulfilled') {
        const rList = Array.isArray(rulesRes.value) ? rulesRes.value : rulesRes.value.data || rulesRes.value.rules || [];
        setRules(rList);
      }
      if (overviewRes.status === 'fulfilled') {
        setOverview(overviewRes.value);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load commission data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRule = async () => {
    if (!commissionAmount || isNaN(Number(commissionAmount))) {
      Alert.alert('Validation', 'Please enter a valid commission amount or percentage.');
      return;
    }

    setSubmitting(true);
    try {
      await createCommissionRule({
        product_type: productType,
        partner_tier: partnerTier,
        commission_type: commissionType,
        commission_value: Number(commissionAmount),
      });
      Alert.alert('Success', 'Commission rule configured successfully');
      setModalVisible(false);
      setCommissionAmount('');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create commission rule');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRuleCard = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.tierBadge}>
          <Icon name="award" size={14} color="#D97706" />
          <Text style={styles.tierText}>{item.partner_tier || item.tier || 'ALL TIERS'}</Text>
        </View>
        <View style={styles.payoutBadge}>
          <Text style={styles.payoutText}>
            {item.commission_type === 'PERCENTAGE' ? `${item.commission_value || item.rate}%` : `₹${item.commission_value || item.amount || 0}`}
          </Text>
        </View>
      </View>

      <Text style={styles.productName}>{item.product_name || item.product_type || 'Financial Product'}</Text>
      <Text style={styles.subDetail}>Payout Basis: {item.commission_type || 'FLAT'}</Text>

      {item.created_at ? (
        <Text style={styles.dateText}>Effective: {new Date(item.created_at).toLocaleDateString()}</Text>
      ) : null}
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
          <Text style={styles.headerTitle}>Commission Structure</Text>
          <Text style={styles.headerSubtitle}>Configure payout rates & partner rewards</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'RULES' && styles.activeTabBtn]}
          onPress={() => setActiveTab('RULES')}
        >
          <Text style={[styles.tabText, activeTab === 'RULES' && styles.activeTabText]}>Rate Rules</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'OVERVIEW' && styles.activeTabBtn]}
          onPress={() => setActiveTab('OVERVIEW')}
        >
          <Text style={[styles.tabText, activeTab === 'OVERVIEW' && styles.activeTabText]}>Payouts Overview</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading commission data...</Text>
        </View>
      ) : activeTab === 'RULES' ? (
        <View style={styles.flex1}>
          <View style={styles.actionBar}>
            <Text style={styles.sectionHeader}>Active Commission Matrix ({rules.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Icon name="plus" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add Rule</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={rules}
            keyExtractor={(item, index) => item.id || item._id || String(index)}
            renderItem={renderRuleCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Icon name="dollar-sign" size={40} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No rules configured</Text>
                <Text style={styles.emptySub}>Click Add Rule to create commission tiers.</Text>
              </View>
            }
          />
        </View>
      ) : (
        <FlatList
          data={[overview]}
          keyExtractor={() => 'overview'}
          contentContainerStyle={styles.listContent}
          renderItem={() => (
            <View>
              <Card style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Commission Disbursed</Text>
                <Text style={styles.metricValue}>₹{(overview?.total_paid || 0).toLocaleString('en-IN')}</Text>
              </Card>
              <Card style={styles.metricCard}>
                <Text style={styles.metricLabel}>Pending Approval Payouts</Text>
                <Text style={[styles.metricValue, { color: '#D97706' }]}>
                  ₹{(overview?.pending_payouts || 0).toLocaleString('en-IN')}
                </Text>
              </Card>
              <Card style={styles.metricCard}>
                <Text style={styles.metricLabel}>Active Earning Partners</Text>
                <Text style={[styles.metricValue, { color: '#2563EB' }]}>
                  {overview?.active_earners || 0} Partners
                </Text>
              </Card>
            </View>
          )}
        />
      )}

      {/* Add Rule Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Commission Rule</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Product Type</Text>
            <View style={styles.chipRow}>
              {['CREDIT_CARD', 'PERSONAL_LOAN', 'BUSINESS_LOAN', 'HOME_LOAN'].map((pt) => (
                <TouchableOpacity
                  key={pt}
                  style={[styles.chip, productType === pt && styles.activeChip]}
                  onPress={() => setProductType(pt)}
                >
                  <Text style={[styles.chipText, productType === pt && styles.activeChipText]}>
                    {pt.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Partner Tier</Text>
            <View style={styles.chipRow}>
              {['SILVER', 'GOLD', 'DIAMOND', 'PLATINUM'].map((tier) => (
                <TouchableOpacity
                  key={tier}
                  style={[styles.chip, partnerTier === tier && styles.activeChip]}
                  onPress={() => setPartnerTier(tier)}
                >
                  <Text style={[styles.chipText, partnerTier === tier && styles.activeChipText]}>{tier}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Payout Value (₹ or %)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1500 or 1.5"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={commissionAmount}
              onChangeText={setCommissionAmount}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateRule} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Rule</Text>}
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
  flex1: {
    flex: 1,
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
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
    marginBottom: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  payoutBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subDetail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  activeChip: {
    backgroundColor: '#2563EB',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  activeChipText: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: spacing.lg,
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
    minWidth: 90,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
