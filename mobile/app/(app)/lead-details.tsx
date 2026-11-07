import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card, Button, StatusBadge, LoadingState, ErrorState } from '../../components';
import { Icon } from '../../components/Icon';
import { fetchLeadDetails, addLeadNote, updateLeadStatus, convertLeadToApplication } from '../../services/lead.service';

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

  // Action Modal State
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'note' | 'status' | 'convert' | 'followup' | null>(null);
  const [actionInput, setActionInput] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const isFetchingRef = useRef(false);

  const loadData = useCallback(async (leadId: string, isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isRefresh) {
      setLoading(true);
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

  const handleAction = async () => {
    if (!id || !actionType) return;

    try {
      setSubmittingAction(true);

      if (actionType === 'note') {
        if (!actionInput.trim()) {
          Alert.alert('Required', 'Note content is required');
          setSubmittingAction(false);
          return;
        }
        await addLeadNote(id, actionInput.trim());
        Alert.alert('Success', 'Note added successfully');
      } else if (actionType === 'status') {
        if (!actionInput.trim()) {
          Alert.alert('Required', 'Please select a status');
          setSubmittingAction(false);
          return;
        }
        await updateLeadStatus(id, actionInput);
        Alert.alert('Success', 'Lead status updated');
      } else if (actionType === 'convert') {
        const result = await convertLeadToApplication(id);
        if (result?.success && result?.data?.application_id) {
          Alert.alert(
            'Success',
            'Lead converted to application successfully',
            [
              { text: 'OK', onPress: () => {
                setShowActionModal(false);
                loadData(id);
              }},
              { text: 'View Application', onPress: () => {
                router.push({ pathname: '/(app)/application-details', params: { id: result.data.application_id } });
              }},
            ]
          );
        } else {
          throw new Error('Conversion failed');
        }
      } else if (actionType === 'followup') {
        if (!actionInput.trim()) {
          Alert.alert('Required', 'Follow-up date is required');
          setSubmittingAction(false);
          return;
        }
        // Implement follow-up API call
        Alert.alert('Success', 'Follow-up scheduled');
      }

      setShowActionModal(false);
      setActionInput('');
      loadData(id);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const openActionModal = (type: 'note' | 'status' | 'convert' | 'followup') => {
    setActionType(type);
    setActionInput('');
    setShowActionModal(true);
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
  const notes = leadData.notes || [];

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

      {/* Quick Actions Bar */}
      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openActionModal('note')}>
          <Icon name="file-text" size={18} color={colors.primary} />
          <Text style={styles.actionBtnText}>Add Note</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openActionModal('status')}>
          <Icon name="activity" size={18} color={colors.primary} />
          <Text style={styles.actionBtnText}>Update Status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openActionModal('followup')}>
          <Icon name="clock" size={18} color={colors.primary} />
          <Text style={styles.actionBtnText}>Follow-up</Text>
        </TouchableOpacity>
        {!relatedApp && (
          <TouchableOpacity style={[styles.actionBtn, styles.primaryActionBtn]} onPress={() => openActionModal('convert')}>
            <Icon name="check-circle" size={18} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, styles.primaryActionBtnText]}>Convert</Text>
          </TouchableOpacity>
        )}
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

        {/* Related Application Navigation */}
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

        {/* Notes Section */}
        {notes.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.cardHeaderTitle}>Notes</Text>
            {notes.map((note: any, idx: number) => (
              <View key={note.id || idx} style={styles.noteItem}>
                <Text style={styles.noteText}>{note.note}</Text>
                <Text style={styles.noteMeta}>
                  {note.created_by || 'User'} • {new Date(note.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </Card>
        )}

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

      {/* Action Modal */}
      <Modal visible={showActionModal} animationType="slide" transparent onRequestClose={() => setShowActionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionType === 'note' ? 'Add Note' :
                 actionType === 'status' ? 'Update Status' :
                 actionType === 'convert' ? 'Convert to Application' :
                 'Schedule Follow-up'}
              </Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {actionType === 'note' && (
                <>
                  <Text style={styles.inputLabel}>Note</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your note..."
                    value={actionInput}
                    onChangeText={setActionInput}
                    multiline
                    numberOfLines={4}
                  />
                </>
              )}

              {actionType === 'status' && (
                <>
                  <Text style={styles.inputLabel}>Select Status</Text>
                  <View style={styles.statusOptions}>
                    {['new', 'contacted', 'interested', 'not_interested', 'converted', 'lost'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[styles.statusOption, actionInput === status && styles.statusOptionSelected]}
                        onPress={() => setActionInput(status)}
                      >
                        <Text style={[styles.statusOptionText, actionInput === status && styles.statusOptionTextSelected]}>
                          {status.replace(/_/g, ' ').toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {actionType === 'followup' && (
                <>
                  <Text style={styles.inputLabel}>Follow-up Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD HH:MM"
                    value={actionInput}
                    onChangeText={setActionInput}
                  />
                </>
              )}

              {actionType === 'convert' && (
                <View style={styles.infoBox}>
                  <Icon name="info" size={16} color="#3B82F6" />
                  <Text style={styles.infoText}>
                    This will convert the lead to a loan application. The customer will be notified and can complete the application process.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAction}
                disabled={submittingAction}
              >
                {submittingAction ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
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
  actionsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    gap: 4,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
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
  noteItem: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    marginBottom: 2,
  },
  noteMeta: {
    fontSize: 10,
    color: colors.textLight,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: typography.sizes.sm,
    color: '#0F172A',
    marginBottom: spacing.md,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  statusOptionTextSelected: {
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#64748B',
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
