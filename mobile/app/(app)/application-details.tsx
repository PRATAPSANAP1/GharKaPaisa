import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card, Button, StatusBadge, LoadingState, ErrorState } from '../../components';
import {
  fetchApplicationDetails,
  fetchApplicationTimeline,
  fetchApplicationDocuments,
  fetchApplicationOperatorHistory,
} from '../../services/application.service';

type SegmentTab = 'overview' | 'kyc' | 'timeline' | 'docs';

interface TimelineItem {
  id: string;
  event_type?: string;
  title?: string;
  description?: string;
  status?: string;
  performed_by_name?: string;
  remarks?: string;
  performed_at?: string;
  created_at?: string;
}

interface DocumentItem {
  id: string;
  doc_type?: string;
  document_type?: string;
  file_url?: string;
  status?: string;
  verification_status?: string;
  uploaded_at?: string;
  created_at?: string;
}

interface OperatorHistoryItem {
  id: string;
  operator_name?: string;
  operator_role?: string;
  operator_designation?: string;
  operator_code?: string;
  action_type?: string;
  notes?: string;
  created_at?: string;
}

const maskPan = (pan?: string) => {
  if (!pan || pan.length < 10) return pan || 'N/A';
  return `${pan.substring(0, 2)}XXXX${pan.substring(6)}`;
};

const maskMobile = (mobile?: string) => {
  if (!mobile || mobile.length < 10) return mobile || 'N/A';
  return `${mobile.substring(0, 2)}XXXXXX${mobile.substring(8)}`;
};

export default function ApplicationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // State
  const [appData, setAppData] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [operatorHistory, setOperatorHistory] = useState<OperatorHistoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<SegmentTab>('overview');

  const isFetchingRef = useRef(false);

  const loadAllData = useCallback(async (appId: string, isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isRefresh) {
      setLoading(true);
      // Explicitly clear previous application data so Application A never shows while B is loading
      setAppData(null);
      setTimeline([]);
      setDocuments([]);
      setOperatorHistory([]);
    }

    setError(null);
    setStatusCode(null);

    try {
      // Primary Application Detail Fetch
      const res = await fetchApplicationDetails(appId);
      if (res?.success && res?.data) {
        setAppData(res.data);
      } else {
        setError(res?.message || 'Application not found');
        setStatusCode(404);
        return;
      }

      // Parallel secondary fetches (Timeline, Docs, Operator History)
      const [timelineRes, docsRes, opHistoryRes] = await Promise.allSettled([
        fetchApplicationTimeline(appId),
        fetchApplicationDocuments(appId),
        fetchApplicationOperatorHistory(appId),
      ]);

      if (timelineRes.status === 'fulfilled' && timelineRes.value?.data) {
        setTimeline(timelineRes.value.data);
      }
      if (docsRes.status === 'fulfilled' && docsRes.value?.data) {
        setDocuments(docsRes.value.data);
      }
      if (opHistoryRes.status === 'fulfilled' && opHistoryRes.value?.data) {
        setOperatorHistory(opHistoryRes.value.data);
      }
    } catch (err: any) {
      const code = err?.status || err?.statusCode || (err?.response ? err.response.status : null);
      setStatusCode(code);

      if (code === 404) {
        setError('Application not found');
      } else if (code === 403) {
        setError('Access denied: You do not have permission to view this application.');
      } else if (code === 429 || (typeof err?.message === 'string' && err.message.includes('429'))) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err?.message || 'Failed to fetch application details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadAllData(id);
    }
  }, [id, loadAllData]);

  const handleRefresh = () => {
    if (id && !isFetchingRef.current) {
      setRefreshing(true);
      loadAllData(id, true);
    }
  };

  if (loading) {
    return <LoadingState message="Fetching 360° application view..." />;
  }

  if (error || !appData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Details</Text>
        </View>
        <ErrorState
          message={error || 'Application missing'}
          onRetry={statusCode === 429 ? undefined : () => id && loadAllData(id)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Navigation & Application Compact Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{appData.app_number}</Text>
          <Text style={styles.headerSubtitle}>
            {appData.customer_name || 'Customer'} • {appData.bank_name || 'Bank'}
          </Text>
        </View>
        <StatusBadge status={appData.status || 'Pending'} />
      </View>

      {/* Segmented Tab Controls */}
      <View style={styles.tabBar}>
        {(['overview', 'kyc', 'timeline', 'docs'] as SegmentTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content with Pull-to-Refresh */}
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
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <View>
            {/* Customer Details Card */}
            <Card style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Customer Information</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Full Name:</Text>
                <Text style={styles.val}>{appData.customer_name || 'N/A'}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Mobile:</Text>
                <Text style={styles.val}>{maskMobile(appData.customer_mobile || appData.mobile)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.val}>{appData.customer_email || 'N/A'}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>PAN Number:</Text>
                <Text style={styles.val}>{maskPan(appData.pan_number)}</Text>
              </View>

              {appData.city || appData.state ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Location:</Text>
                  <Text style={styles.val}>
                    {[appData.city, appData.state, appData.pincode].filter(Boolean).join(', ')}
                  </Text>
                </View>
              ) : null}

              {appData.employment_type ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Employment:</Text>
                  <Text style={styles.val}>{appData.employment_type}</Text>
                </View>
              ) : null}

              {appData.company_name ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Company:</Text>
                  <Text style={styles.val}>{appData.company_name}</Text>
                </View>
              ) : null}
            </Card>

            {/* Application Meta Card */}
            <Card style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Application Metadata</Text>

              <View style={styles.row}>
                <Text style={styles.label}>App Number:</Text>
                <Text style={[styles.val, styles.highlightText]}>{appData.app_number}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Submitted Date:</Text>
                <Text style={styles.val}>
                  {new Date(appData.submitted_at || appData.created_at).toLocaleString()}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Current Status:</Text>
                <StatusBadge status={appData.status} />
              </View>

              {appData.final_status ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Final Status:</Text>
                  <Text style={[styles.val, styles.goldText]}>{appData.final_status}</Text>
                </View>
              ) : null}

              {appData.bank_application_number || appData.bank_ref_number ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Bank Ref #:</Text>
                  <Text style={styles.val}>
                    {appData.bank_application_number || appData.bank_ref_number}
                  </Text>
                </View>
              ) : null}

              {appData.loan_amount || appData.approved_amount ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Amount:</Text>
                  <Text style={styles.val}>
                    ₹{(appData.approved_amount || appData.loan_amount || 0).toLocaleString()}
                  </Text>
                </View>
              ) : null}
            </Card>

            {/* Product & Bank Card */}
            <Card style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Product & Bank Details</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Product Name:</Text>
                <Text style={styles.val}>{appData.product_name || 'Credit Card'}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Bank:</Text>
                <Text style={styles.val}>
                  {appData.bank_name || 'Bank'} {appData.bank_code ? `(${appData.bank_code})` : ''}
                </Text>
              </View>

              {appData.category ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Category:</Text>
                  <Text style={styles.val}>{appData.category}</Text>
                </View>
              ) : null}
            </Card>

            {/* Assignment & Working Account */}
            <Card style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Assignment & Operator</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Working Account:</Text>
                <Text style={styles.val}>
                  {appData.currently_working_by || appData.operator_name || 'Unassigned'}
                </Text>
              </View>

              {appData.partner_code ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Partner Code:</Text>
                  <Text style={styles.val}>{appData.partner_code}</Text>
                </View>
              ) : null}

              {appData.employee_name ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Assigned Agent:</Text>
                  <Text style={styles.val}>
                    {appData.employee_name}{' '}
                    {appData.employee_designation ? `(${appData.employee_designation})` : ''}
                  </Text>
                </View>
              ) : null}
            </Card>
          </View>
        )}

        {/* KYC TAB */}
        {activeTab === 'kyc' && (
          <View>
            <Card style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>KYC Verification Stages</Text>

              <View style={styles.row}>
                <Text style={styles.label}>PAN Verification:</Text>
                <Text
                  style={[
                    styles.val,
                    (appData.pan_check || 'no').toLowerCase() === 'yes'
                      ? styles.successText
                      : styles.warningText,
                  ]}
                >
                  {(appData.pan_check || 'no').toUpperCase()}
                </Text>
              </View>

              {appData.soft_approval_status ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Soft Approval:</Text>
                  <Text style={styles.val}>{appData.soft_approval_status}</Text>
                </View>
              ) : null}

              {appData.ipa_stage ? (
                <View style={styles.row}>
                  <Text style={styles.label}>IPA Stage:</Text>
                  <Text style={styles.val}>{appData.ipa_stage}</Text>
                </View>
              ) : null}

              {appData.kyc_stage || appData.vkyc_stage ? (
                <View style={styles.row}>
                  <Text style={styles.label}>KYC Stage:</Text>
                  <Text style={styles.val}>
                    {appData.kyc_stage || appData.vkyc_stage || 'Pending'}
                  </Text>
                </View>
              ) : null}

              {appData.vkyc_url ? (
                <View style={styles.row}>
                  <Text style={styles.label}>VKYC Link:</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(appData.vkyc_url)}>
                    <Text style={styles.linkText}>Open VKYC Portal →</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </Card>

            {(appData.bank_remark || appData.user_remark || appData.backend_remark) && (
              <Card style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>KYC Operator Remarks</Text>

                {appData.bank_remark ? (
                  <View style={styles.remarkBox}>
                    <Text style={styles.remarkLabel}>Bank Remark:</Text>
                    <Text style={styles.remarkVal}>{appData.bank_remark}</Text>
                  </View>
                ) : null}

                {appData.user_remark ? (
                  <View style={styles.remarkBox}>
                    <Text style={styles.remarkLabel}>User Remark:</Text>
                    <Text style={styles.remarkVal}>{appData.user_remark}</Text>
                  </View>
                ) : null}

                {appData.backend_remark ? (
                  <View style={styles.remarkBox}>
                    <Text style={styles.remarkLabel}>Backend Remark:</Text>
                    <Text style={styles.remarkVal}>{appData.backend_remark}</Text>
                  </View>
                ) : null}
              </Card>
            )}
          </View>
        )}

        {/* TIMELINE TAB (AUDIT & ACTIVITY) */}
        {activeTab === 'timeline' && (
          <View>
            <Text style={styles.sectionTitle}>Application Status Activity</Text>

            {timeline.length > 0 ? (
              timeline.map((item, idx) => (
                <Card key={item.id || idx.toString()} style={styles.timelineCard}>
                  <View style={styles.timelineHeader}>
                    <View style={styles.dot} />
                    <Text style={styles.timelineTitle}>{item.title || item.event_type || 'Event'}</Text>
                  </View>

                  {item.description || item.remarks ? (
                    <Text style={styles.timelineDesc}>{item.description || item.remarks}</Text>
                  ) : null}

                  <View style={styles.timelineFooter}>
                    <Text style={styles.timelineActor}>
                      By: {item.performed_by_name || 'System User'}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {item.performed_at || item.created_at
                        ? new Date(item.performed_at || item.created_at!).toLocaleString()
                        : ''}
                    </Text>
                  </View>
                </Card>
              ))
            ) : (
              <Card>
                <Text style={styles.emptyText}>No timeline entries available.</Text>
              </Card>
            )}

            {/* Detailed Operator History Audit */}
            {operatorHistory.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.sectionTitle}>Operator Audit History</Text>
                {operatorHistory.map((op, idx) => (
                  <Card key={op.id || idx.toString()} style={styles.timelineCard}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.opAction}>{op.action_type || 'Operator Review'}</Text>
                    </View>

                    <Text style={styles.opActor}>
                      {op.operator_name || 'Operator'} ({op.operator_code || 'OP'}) •{' '}
                      {op.operator_designation || op.operator_role || 'Staff'}
                    </Text>

                    {op.notes ? <Text style={styles.timelineDesc}>{op.notes}</Text> : null}

                    <Text style={[styles.timelineDate, { marginTop: 4 }]}>
                      {op.created_at ? new Date(op.created_at).toLocaleString() : ''}
                    </Text>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'docs' && (
          <View>
            <Text style={styles.sectionTitle}>Application Documents</Text>

            {documents.length > 0 ? (
              documents.map((doc, idx) => (
                <Card key={doc.id || idx.toString()} style={styles.docCard}>
                  <View style={styles.docHeader}>
                    <Text style={styles.docName}>
                      {(doc.doc_type || doc.document_type || 'Document')
                        .replace(/_/g, ' ')
                        .toUpperCase()}
                    </Text>
                    <StatusBadge status={doc.status || doc.verification_status || 'Uploaded'} />
                  </View>

                  <Text style={styles.docDate}>
                    Uploaded:{' '}
                    {doc.uploaded_at || doc.created_at
                      ? new Date(doc.uploaded_at || doc.created_at!).toLocaleDateString()
                      : 'N/A'}
                  </Text>

                  <View style={styles.docSecureNotice}>
                    <Text style={styles.docSecureText}>
                      🔒 Protected Document (Accessible via Secure Verification Desk)
                    </Text>
                  </View>
                </Card>
              ))
            ) : (
              <Card>
                <Text style={styles.emptyText}>No documents attached to this application.</Text>
              </Card>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    fontWeight: typography.weights.semibold,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  content: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
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
  goldText: {
    color: colors.gold,
    fontWeight: typography.weights.bold,
  },
  successText: {
    color: colors.success,
    fontWeight: typography.weights.bold,
  },
  warningText: {
    color: colors.warning,
    fontWeight: typography.weights.bold,
  },
  linkText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  remarkBox: {
    marginTop: spacing.xs,
    padding: spacing.xs + 2,
    backgroundColor: colors.bg,
    borderRadius: 6,
  },
  remarkLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMid,
  },
  remarkVal: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    marginTop: 2,
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
  timelineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timelineActor: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
  },
  timelineDate: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
  },
  opAction: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.accent,
  },
  opActor: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  docCard: {
    marginBottom: spacing.xs + 4,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  docName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  docDate: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
  },
  docSecureNotice: {
    marginTop: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.bg,
    borderRadius: 4,
  },
  docSecureText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    textAlign: 'center',
  },
});
