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
import { Card, StatusBadge, LoadingState, ErrorState } from '../../components';
import { fetchCustomerProfile } from '../../services/customer.service';

type TabType = 'overview' | 'applications' | 'leads' | 'activity';

const maskPan = (pan?: string) => {
  if (!pan || pan.length < 10) return pan || 'N/A';
  return `${pan.substring(0, 2)}XXXX${pan.substring(6)}`;
};

const maskMobile = (mobile?: string) => {
  if (!mobile || mobile.length < 10) return mobile || 'N/A';
  return `${mobile.substring(0, 2)}XXXXXX${mobile.substring(8)}`;
};

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [customerData, setCustomerData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const isFetchingRef = useRef(false);

  const loadProfile = useCallback(async (customerId: string, isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isRefresh) {
      setLoading(true);
      // Reset state to avoid showing previous customer data
      setCustomerData(null);
    }

    setError(null);
    setStatusCode(null);

    try {
      const res = await fetchCustomerProfile(customerId);
      if (res?.success && res?.data) {
        setCustomerData(res.data);
      } else {
        setError(res?.message || 'Customer profile not found');
        setStatusCode(404);
      }
    } catch (err: any) {
      const code = err?.status || err?.statusCode || (err?.response ? err.response.status : null);
      setStatusCode(code);

      if (code === 404) {
        setError('Customer profile not found');
      } else if (code === 403) {
        setError('Access denied: You do not have permission to view this customer.');
      } else if (code === 429 || (typeof err?.message === 'string' && err.message.includes('429'))) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err?.message || 'Failed to load customer 360 profile');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadProfile(id);
    }
  }, [id, loadProfile]);

  const handleRefresh = () => {
    if (id && !isFetchingRef.current) {
      setRefreshing(true);
      loadProfile(id, true);
    }
  };

  if (loading) return <LoadingState message="Fetching Customer 360° profile..." />;

  if (error || !customerData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer 360°</Text>
        </View>
        <ErrorState
          message={error || 'Customer data unavailable'}
          onRetry={statusCode === 429 ? undefined : () => id && loadProfile(id)}
        />
      </View>
    );
  }

  const profile = customerData.profile || customerData;
  const applications = customerData.applications || profile.applications || [];
  const leads = customerData.leads || profile.leads || [];
  const timeline = customerData.timeline || profile.timeline || [];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{profile.full_name || 'Customer'}</Text>
          <Text style={styles.headerSubtitle}>{maskMobile(profile.mobile)}</Text>
        </View>
        <StatusBadge status={profile.pipeline_status || 'new'} />
      </View>

      {/* Segmented Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'applications' && styles.tabItemActive]}
          onPress={() => setActiveTab('applications')}
        >
          <Text style={[styles.tabText, activeTab === 'applications' && styles.tabTextActive]}>
            Apps ({applications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'leads' && styles.tabItemActive]}
          onPress={() => setActiveTab('leads')}
        >
          <Text style={[styles.tabText, activeTab === 'leads' && styles.tabTextActive]}>
            Leads ({leads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'activity' && styles.tabItemActive]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>
            Activity ({timeline.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Content */}
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
        {activeTab === 'overview' && (
          <View>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Personal Details</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Full Name:</Text>
                <Text style={styles.val}>{profile.full_name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Mobile:</Text>
                <Text style={styles.val}>{maskMobile(profile.mobile)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>PAN:</Text>
                <Text style={styles.val}>{maskPan(profile.pan_number)}</Text>
              </View>
              {profile.email ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.val}>{profile.email}</Text>
                </View>
              ) : null}
              {profile.dob ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Date of Birth:</Text>
                  <Text style={styles.val}>{profile.dob}</Text>
                </View>
              ) : null}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Location & Employment</Text>
              <View style={styles.row}>
                <Text style={styles.label}>City / State:</Text>
                <Text style={styles.val}>
                  {[profile.city, profile.state].filter(Boolean).join(', ') || 'N/A'}
                </Text>
              </View>
              {profile.pincode ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Pincode:</Text>
                  <Text style={styles.val}>{profile.pincode}</Text>
                </View>
              ) : null}
              {profile.employment_type ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Employment Type:</Text>
                  <Text style={styles.val}>{profile.employment_type.toUpperCase()}</Text>
                </View>
              ) : null}
              {profile.monthly_income ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Monthly Income:</Text>
                  <Text style={styles.val}>₹{Number(profile.monthly_income).toLocaleString()}</Text>
                </View>
              ) : null}
              {profile.employer ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Employer:</Text>
                  <Text style={styles.val}>{profile.employer}</Text>
                </View>
              ) : null}
            </Card>
          </View>
        )}

        {activeTab === 'applications' && (
          <View>
            {applications.length === 0 ? (
              <Text style={styles.emptyText}>No applications found for this customer.</Text>
            ) : (
              applications.map((app: any, idx: number) => (
                <TouchableOpacity
                  key={app.id || idx.toString()}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/application-details',
                      params: { id: app.id },
                    })
                  }
                >
                  <Card style={styles.card}>
                    <View style={styles.appCardHeader}>
                      <Text style={styles.appNum}>{app.app_number || 'APP'}</Text>
                      <StatusBadge status={app.status || 'pending'} />
                    </View>
                    <Text style={styles.appMeta}>
                      {app.product_name || 'Credit Card'} • {app.bank_name || 'Bank'}
                    </Text>
                    <Text style={styles.appDate}>
                      Submitted: {new Date(app.created_at || Date.now()).toLocaleDateString()}
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'leads' && (
          <View>
            {leads.length === 0 ? (
              <Text style={styles.emptyText}>No leads found for this customer.</Text>
            ) : (
              leads.map((ld: any, idx: number) => (
                <TouchableOpacity
                  key={ld.id || idx.toString()}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/lead-details',
                      params: { id: ld.id },
                    })
                  }
                >
                  <Card style={styles.card}>
                    <View style={styles.appCardHeader}>
                      <Text style={styles.appNum}>{ld.lead_number || 'LEAD'}</Text>
                      <StatusBadge status={ld.status || 'pending'} />
                    </View>
                    <Text style={styles.appMeta}>
                      {ld.product_name || 'Product'} • {ld.bank_name || 'Bank'}
                    </Text>
                    <Text style={styles.appDate}>
                      Created: {new Date(ld.created_at || Date.now()).toLocaleDateString()}
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'activity' && (
          <View>
            {timeline.length === 0 ? (
              <Text style={styles.emptyText}>No timeline activity recorded.</Text>
            ) : (
              timeline.map((item: any, idx: number) => (
                <Card key={item.id || idx.toString()} style={styles.timelineCard}>
                  <View style={styles.timelineHeader}>
                    <View style={styles.dot} />
                    <Text style={styles.timelineTitle}>
                      {item.title || item.event_type || 'Activity Logged'}
                    </Text>
                  </View>
                  {item.description || item.remarks ? (
                    <Text style={styles.timelineDesc}>{item.description || item.remarks}</Text>
                  ) : null}
                  <Text style={styles.timelineDate}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                  </Text>
                </Card>
              ))
            )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    fontWeight: typography.weights.semibold,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appNum: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  appMeta: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    marginTop: 4,
  },
  appDate: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
    marginTop: 4,
  },
  timelineCard: {
    marginBottom: spacing.xs + 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
});
