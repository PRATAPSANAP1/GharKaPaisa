import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card, Button, StatusBadge, LoadingState, ErrorState } from '../../components';
import { fetchLeadDetails } from '../../services/lead.service';

const maskPan = (pan?: string) => {
  if (!pan || pan.length < 10) return pan || 'N/A';
  return `${pan.substring(0, 2)}XXXX${pan.substring(6)}`;
};

const maskMobile = (mobile?: string) => {
  if (!mobile || mobile.length < 10) return mobile || 'N/A';
  return `${mobile.substring(0, 2)}XXXXXX${mobile.substring(8)}`;
};

export default function LeadDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [leadData, setLeadData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const isFetchingRef = useRef(false);

  const loadData = useCallback(async (leadId: string, isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isRefresh) {
      setLoading(true);
      // Clear previous state so stale Lead A data never displays while B is loading
      setLeadData(null);
    }

    setError(null);
    setStatusCode(null);

    try {
      const res = await fetchLeadDetails(leadId);
      if (res?.success && res?.data) {
        setLeadData(res.data);
      } else {
        setError(res?.message || 'Lead details not found');
        setStatusCode(404);
      }
    } catch (err: any) {
      const code = err?.status || err?.statusCode || (err?.response ? err.response.status : null);
      setStatusCode(code);

      if (code === 404) {
        setError('Lead not found');
      } else if (code === 403) {
        setError('Access denied: You do not have permission to view this lead.');
      } else if (code === 429 || (typeof err?.message === 'string' && err.message.includes('429'))) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err?.message || 'Failed to fetch lead details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id, loadData]);

  const handleRefresh = () => {
    if (id && !isFetchingRef.current) {
      setRefreshing(true);
      loadData(id, true);
    }
  };

  if (loading) return <LoadingState message="Fetching lead details..." />;

  if (error || !leadData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lead Details</Text>
        </View>
        <ErrorState
          message={error || 'Lead data unavailable'}
          onRetry={statusCode === 429 ? undefined : () => id && loadData(id)}
        />
      </View>
    );
  }

  const overview = leadData.overview || leadData;
  const timeline = leadData.timeline || [];
  const customerCards = leadData.customer_cards || [];

  // Find associated application ID if converted
  const relatedApp = customerCards.find((c: any) => c.app_number && c.app_number.startsWith('APP'));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{overview.lead_number || 'LEAD'}</Text>
          <Text style={styles.headerSubtitle}>
            {overview.customer_name} • {overview.bank_name || 'Bank'}
          </Text>
        </View>
        <StatusBadge status={overview.status || 'pending'} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Customer Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Customer Information</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Full Name:</Text>
            <Text style={styles.val}>{overview.customer_name || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Mobile:</Text>
            <Text style={styles.val}>{maskMobile(overview.mobile)}</Text>
          </View>

          {overview.customer_email ? (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.val}>{overview.customer_email}</Text>
            </View>
          ) : null}

          {overview.pan_number ? (
            <View style={styles.row}>
              <Text style={styles.label}>PAN Number:</Text>
              <Text style={styles.val}>{maskPan(overview.pan_number)}</Text>
            </View>
          ) : null}

          {overview.city ? (
            <View style={styles.row}>
              <Text style={styles.label}>City:</Text>
              <Text style={styles.val}>{overview.city}</Text>
            </View>
          ) : null}
        </Card>

        {/* Lead Metadata */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Lead Metadata</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Lead ID:</Text>
            <Text style={[styles.val, styles.highlightText]}>{overview.lead_number || overview.id}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Lead Status:</Text>
            <StatusBadge status={overview.status || 'pending'} />
          </View>

          {overview.priority ? (
            <View style={styles.row}>
              <Text style={styles.label}>Priority:</Text>
              <Text style={styles.val}>{overview.priority.toUpperCase()}</Text>
            </View>
          ) : null}

          {overview.source ? (
            <View style={styles.row}>
              <Text style={styles.label}>Source:</Text>
              <Text style={styles.val}>{overview.source}</Text>
            </View>
          ) : null}

          {overview.process_type ? (
            <View style={styles.row}>
              <Text style={styles.label}>Process Type:</Text>
              <Text style={styles.val}>{overview.process_type.replace(/_/g, ' ')}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Text style={styles.label}>Created At:</Text>
            <Text style={styles.val}>{new Date(overview.created_at).toLocaleString()}</Text>
          </View>
        </Card>

        {/* Product & Bank Details */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Product & Bank</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Product:</Text>
            <Text style={styles.val}>{overview.product_name || 'Credit Card'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Bank:</Text>
            <Text style={styles.val}>
              {overview.bank_name || 'Bank'} {overview.bank_code ? `(${overview.bank_code})` : ''}
            </Text>
          </View>
        </Card>

        {/* Related Application Navigation (PART 7) */}
        {relatedApp ? (
          <Card style={[styles.sectionCard, styles.appLinkCard]}>
            <Text style={styles.cardHeaderTitle}>Converted Application</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Application #:</Text>
              <Text style={[styles.val, styles.highlightText]}>{relatedApp.app_number}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>App Status:</Text>
              <StatusBadge status={relatedApp.status} />
            </View>

            <TouchableOpacity
              style={styles.viewAppBtn}
              onPress={() =>
                router.push({
                  pathname: '/(app)/application-details',
                  params: { id: relatedApp.id },
                })
              }
            >
              <Text style={styles.viewAppBtnText}>View Application 360° →</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {/* Lead Timeline */}
        {timeline.length > 0 && (
          <View style={{ marginTop: spacing.xs }}>
            <Text style={styles.sectionTitle}>Lead Timeline Activity</Text>
            {timeline.map((item: any, idx: number) => (
              <Card key={item.id || idx.toString()} style={styles.timelineCard}>
                <View style={styles.timelineHeader}>
                  <View style={styles.dot} />
                  <Text style={styles.timelineTitle}>
                    {item.event_type || item.title || 'Event'}
                  </Text>
                </View>
                {item.description || item.remarks ? (
                  <Text style={styles.timelineDesc}>{item.description || item.remarks}</Text>
                ) : null}
                <Text style={styles.timelineDate}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                </Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    backgroundColor: colors.bgSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  backBtnText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  content: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs + 2,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  cardHeaderTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs + 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  val: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  highlightText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  appLinkCard: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  viewAppBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewAppBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  timelineCard: {
    marginBottom: spacing.xs + 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
  },
  timelineTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  timelineDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
    marginVertical: 4,
  },
  timelineDate: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
  },
});
