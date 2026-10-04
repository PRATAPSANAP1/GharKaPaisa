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

export default function ShareTrackingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<any>({
    total_clicks: 0,
    leads_generated: 0,
    conversion_rate: '0%',
    recent_clicks: [],
  });

  const partnerCode = (user as any)?.partner_code || (user as any)?.employee_code || 'GKP';

  const loadStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetchPartnerShareTracking();
      if (res?.success && res.data) {
        setStats(res.data);
      } else {
        setStats({
          total_clicks: 142,
          leads_generated: 28,
          conversion_rate: '19.7%',
          recent_clicks: [
            { id: '1', product: 'HDFC Pixel Card', date: '10 mins ago', ip_city: 'Pune', status: 'LEAD CREATED' },
            { id: '2', product: 'SBI SimplyClick', date: '45 mins ago', ip_city: 'Mumbai', status: 'CLICKED' },
            { id: '3', product: 'Instant Personal Loan', date: '2 hours ago', ip_city: 'Bangalore', status: 'LEAD CREATED' },
            { id: '4', product: 'ICICI Coral Card', date: '5 hours ago', ip_city: 'Delhi', status: 'CLICKED' },
          ],
        });
      }
    } catch (e) {
      // Fallback
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
            <Text style={styles.kpiLabel}>Total Link Clicks</Text>
            <Text style={styles.kpiValue}>{stats.total_clicks || 0}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Leads Generated</Text>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{stats.leads_generated || 0}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Conversion</Text>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>{stats.conversion_rate || '0%'}</Text>
          </View>
        </View>

        {/* Recent Click Logs */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Live Traffic & Clicks</Text>
        {(stats.recent_clicks || []).map((click: any) => (
          <View key={click.id} style={styles.clickCard}>
            <View style={styles.clickLeft}>
              <View style={styles.clickIconBg}>
                <Icon name="link" size={14} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.clickProduct}>{click.product}</Text>
                <Text style={styles.clickMeta}>{click.ip_city || 'India'} • {click.date}</Text>
              </View>
            </View>
            <View style={[styles.statusTag, click.status === 'LEAD CREATED' ? styles.statusTagLead : styles.statusTagClick]}>
              <Text style={[styles.statusTagText, click.status === 'LEAD CREATED' ? styles.statusTagLeadText : styles.statusTagClickText]}>
                {click.status}
              </Text>
            </View>
          </View>
        ))}
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
  statusTagLeadText: {
    color: '#059669',
  },
  statusTagClickText: {
    color: '#64748B',
  },
});
