import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { fetchPartnerShareTracking } from '../../services/partner.service';
import { useAuth } from '../../contexts/AuthContext';

interface ShareTrackingStats {
  total_leads: number;
  submitted_leads: number;
  conversion_rate: string;
  recent_leads: any[];
}

const EMPTY_STATS: ShareTrackingStats = {
  total_leads: 0,
  submitted_leads: 0,
  conversion_rate: '0%',
  recent_leads: [],
};

const CONVERTED_STATUSES = ['SUBMITTED', 'APPROVED'];

export default function ShareTrackingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<ShareTrackingStats>(EMPTY_STATS);

  const partnerCode = (user as any)?.partner_code || (user as any)?.employee_code || 'GKP';

  const loadStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetchPartnerShareTracking({ limit: 100 });

      // GET /partner/share-tracking returns a paginated list of leads, not an
      // aggregate: { success, message, data: rows[], pagination, timestamp }.
      const rows: any[] = Array.isArray(res?.data) ? res.data : [];
      const total = res?.pagination?.total ?? rows.length;
      const submitted = rows.filter(
        (r: any) =>
          CONVERTED_STATUSES.includes(String(r.status || '').toUpperCase()) ||
          String(r.pipeline_stage || '').toLowerCase() === 'submitted'
      ).length;

      setStats({
        total_leads: total,
        submitted_leads: submitted,
        conversion_rate: total > 0 ? `${((submitted / total) * 100).toFixed(1)}%` : '0%',
        recent_leads: rows.map((r: any) => ({
          id: r.id,
          product: r.product_name || 'Product',
          customer: r.customer_name || 'Customer',
          city: r.city || null,
          status: String(r.status || 'pending').toUpperCase(),
          date: r.created_at ? new Date(r.created_at).toLocaleString() : '',
        })),
      });
    } catch (e) {
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleShareMasterLink = async () => {
    try {
      const shareUrl = `https://gharkapaisa.in/apply/${partnerCode}`;
      await Share.share({
        title: 'Apply with GharKaPaisa',
        message: `Apply for Credit Cards, Personal Loans & Insurance with instant approvals on GharKaPaisa:\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (err) {
      Alert.alert('Share', 'Could not open share dialog.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadStats(true)} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Share Link Tracking</Text>
            <Text style={styles.subtitle}>Real-time analytics for your promotional links</Text>
          </View>
        </View>

        {/* Master Referral Link Card */}
        <View style={styles.masterCard}>
          <Text style={styles.masterSubtitle}>YOUR MASTER PRODUCT LINK</Text>
          <Text style={styles.masterUrl}>https://gharkapaisa.in/apply/{partnerCode}</Text>

          <TouchableOpacity style={styles.masterShareBtn} onPress={handleShareMasterLink}>
            <Icon name="share-2" size={16} color="#FFFFFF" />
            <Text style={styles.masterShareBtnText}>Share Master Link 📲</Text>
          </TouchableOpacity>
        </View>

        {/* KPI Metrics */}
        <Text style={styles.sectionTitle}>Link Performance</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Shared Leads</Text>
            <Text style={styles.kpiValue}>{stats.total_leads}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Submitted</Text>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{stats.submitted_leads}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Conversion</Text>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>{stats.conversion_rate}</Text>
          </View>
        </View>

        {/* Recent Share Activity */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Live Share Activity</Text>
        {stats.recent_leads.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="link" size={28} color={colors.textLight} />
            <Text style={styles.emptyText}>
              No share activity yet. Generate a product link from the Products screen and share it with a customer.
            </Text>
          </View>
        ) : (
          stats.recent_leads.map((lead: any) => (
            <View key={lead.id} style={styles.clickCard}>
              <View style={styles.clickLeft}>
                <View style={styles.clickIconBg}>
                  <Icon name="link" size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clickProduct}>{lead.product}</Text>
                  <Text style={styles.clickMeta}>
                    {lead.customer}{lead.city ? ` • ${lead.city}` : ''}{lead.date ? ` • ${lead.date}` : ''}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusTag,
                  CONVERTED_STATUSES.includes(lead.status) ? styles.statusTagLead : styles.statusTagClick,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    CONVERTED_STATUSES.includes(lead.status) ? styles.statusTagLeadText : styles.statusTagClickText,
                  ]}
                >
                  {lead.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  masterCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  masterSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  masterUrl: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#38BDF8',
    marginVertical: 8,
  },
  masterShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  masterShareBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.sm,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 4,
    textAlign: 'center',
  },
  kpiValue: {
    fontSize: typography.sizes.md,
    fontWeight: '800',
    color: colors.text,
  },
  clickCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clickLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  clickIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickProduct: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text,
  },
  clickMeta: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagLead: {
    backgroundColor: '#ECFDF5',
  },
  statusTagClick: {
    backgroundColor: '#F1F5F9',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  statusTagLeadText: {
    color: '#059669',
  },
  statusTagClickText: {
    color: '#64748B',
  },
});
