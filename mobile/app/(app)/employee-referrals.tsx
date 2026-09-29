import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../../components/Icon';
import {
  fetchEmployeeProfile,
  fetchEmployeeCreditCards,
  EmployeeProfileData,
  EmployeeProductLink,
} from '../../services/employee.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function EmployeeReferralsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<EmployeeProfileData | null>(null);
  const [productLinks, setProductLinks] = useState<EmployeeProductLink[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [profileRes, cardsRes] = await Promise.all([
        fetchEmployeeProfile(),
        fetchEmployeeCreditCards(),
      ]);

      if (profileRes) {
        setProfileData(profileRes);
      }

      setProductLinks(cardsRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load referral products and links.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const empCode = profileData?.employee?.employee_id || (user as any)?.emp_code || (user as any)?.employee_id || 'EMP';

  const handleShareLink = async (item: EmployeeProductLink) => {
    try {
      const shareMessage = `Apply for ${item.product_name} (${item.bank_name || 'Partner Bank'}) via GharKaPaisa!\n\nLink: ${item.referral_url}`;
      await Share.share({
        message: shareMessage,
        url: item.referral_url,
        title: `Share ${item.product_name}`,
      });
    } catch (err: any) {
      console.error('Failed to share link:', err);
    }
  };

  const handleCopyCode = (code: string) => {
    setCopiedId('code');
    Alert.alert('Code Copied', `Employee Referral Code: ${code}`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleCopyLink = (url: string, id: string) => {
    setCopiedId(id);
    Alert.alert('Referral Link Copied', url);
    setTimeout(() => setCopiedId(null), 3000);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Referral Links...</Text>
      </View>
    );
  }

  const totalApps = profileData?.total_applications || profileData?.employee?.total_applications || 0;
  const approvedApps = profileData?.approved_applications || profileData?.employee?.approved_applications || 0;
  const totalLeads = profileData?.leads_count || profileData?.employee?.leads_count || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />
      }
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerSubtitle}>PRODUCT REFERRAL HUB</Text>
          <Text style={styles.headerTitle}>Employee Referrals</Text>
          <Text style={styles.designationText}>
            Code: {empCode}
          </Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Icon name="alert-circle" size={18} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Employee Code Card */}
      <View style={styles.codeCard}>
        <View style={styles.codeLeft}>
          <Text style={styles.codeLabel}>My Unique Employee Referral Code</Text>
          <Text style={styles.codeValue}>{empCode}</Text>
        </View>
        <TouchableOpacity
          style={[styles.copyCodeButton, copiedId === 'code' && styles.copiedButton]}
          onPress={() => handleCopyCode(empCode)}
        >
          <Icon name={copiedId === 'code' ? 'check' : 'copy'} size={14} color="#FFFFFF" />
          <Text style={styles.copyCodeText}>{copiedId === 'code' ? 'Copied' : 'Copy Code'}</Text>
        </TouchableOpacity>
      </View>

      {/* Referral Performance KPIs */}
      <Text style={styles.sectionTitle}>Referral Tracking</Text>
      <View style={styles.kpiRow}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiNum}>{totalLeads}</Text>
          <Text style={styles.kpiLabel}>Punched Leads</Text>
        </View>

        <View style={styles.kpiBox}>
          <Text style={[styles.kpiNum, { color: '#0F766E' }]}>{totalApps}</Text>
          <Text style={styles.kpiLabel}>Applications</Text>
        </View>

        <View style={styles.kpiBox}>
          <Text style={[styles.kpiNum, { color: '#166534' }]}>{approvedApps}</Text>
          <Text style={styles.kpiLabel}>Approved Cards</Text>
        </View>
      </View>

      {/* Product Referral Links List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Product Referral Links ({productLinks.length})</Text>
      </View>

      {productLinks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="link-2" size={36} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Product Links Available</Text>
          <Text style={styles.emptyDesc}>Active credit card & loan referral links will appear here once assigned.</Text>
        </View>
      ) : (
        productLinks.map((item) => (
          <View key={item.product_id} style={styles.productCard}>
            <View style={styles.productTop}>
              <View style={styles.productIconBg}>
                <Icon name="credit-card" size={22} color="#0F766E" />
              </View>
              <View style={styles.productMeta}>
                <Text style={styles.productName}>{item.product_name}</Text>
                <Text style={styles.bankName}>{item.bank_name || 'Partner Bank'}</Text>
              </View>
              {item.employee_incentive ? (
                <View style={styles.incentiveBadge}>
                  <Text style={styles.incentiveBadgeText}>+₹{item.employee_incentive}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.urlBox}>
              <Text style={styles.urlText} numberOfLines={1} ellipsizeMode="middle">
                {item.referral_url}
              </Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.copyBtn]}
                onPress={() => handleCopyLink(item.referral_url, item.product_id)}
              >
                <Icon name={copiedId === item.product_id ? 'check' : 'copy'} size={14} color="#0F766E" />
                <Text style={styles.copyBtnText}>
                  {copiedId === item.product_id ? 'Copied' : 'Copy Link'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.shareBtn]}
                onPress={() => handleShareLink(item)}
              >
                <Icon name="share-2" size={14} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: '#64748B',
  },
  headerCard: {
    backgroundColor: '#0F766E',
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#99F6E4',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  designationText: {
    fontSize: 12,
    color: '#CCFBF1',
    marginTop: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    marginTop: spacing.sm,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeLeft: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 2,
    letterSpacing: 1,
  },
  copyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  copiedButton: {
    backgroundColor: '#166534',
  },
  copyCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  kpiBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    width: '31%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: spacing.sm,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  productIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  productMeta: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  bankName: {
    fontSize: 11,
    color: '#64748B',
  },
  incentiveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  incentiveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  urlBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  urlText: {
    fontSize: 11,
    color: '#334155',
    fontFamily: 'monospace',
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  copyBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  shareBtn: {
    backgroundColor: '#0F766E',
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
