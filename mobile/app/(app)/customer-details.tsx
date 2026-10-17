import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card, StatusBadge, LoadingState, ErrorState, Button } from '../../components';
import { Icon } from '../../components/Icon';
import {
  fetchCustomerProfile,
  addCustomerNote,
  addCustomerFollowUp,
  mergeCustomers,
  updateCustomerStatus,
} from '../../services/customer.service';

type TabType = 'overview' | 'applications' | 'leads' | 'activity' | 'notes' | 'followups';

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

  // CRM States
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpRemark, setFollowUpRemark] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState('medium');
  const [mergeCustomerId, setMergeCustomerId] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState('new');
  const [statusReason, setStatusReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isFetchingRef = useRef(false);

  const loadProfile = useCallback(async (customerId: string, isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isRefresh) {
      setLoading(true);
      setCustomerData(null);
    }

    setError(null);
    setStatusCode(null);

    try {
      const res = await fetchCustomerProfile(customerId);
      if (res?.success && res?.data) {
        setCustomerData(res.data);
        const profile = res.data.profile || res.data;
        if (Array.isArray(res.data.notes)) {
          setNotes(res.data.notes);
        } else if (Array.isArray(profile.notes)) {
          setNotes(profile.notes);
        }
        if (Array.isArray(res.data.followups)) {
          setFollowups(res.data.followups);
        } else if (Array.isArray(profile.followups)) {
          setFollowups(profile.followups);
        }
        setPipelineStatus(profile.pipeline_status || 'new');
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

  // CRM Functions
  const handleAddNote = async () => {
    if (!noteText.trim()) {
      Alert.alert('Required', 'Please enter a note');
      return;
    }

    setSubmitting(true);
    try {
      const res = await addCustomerNote(id, noteText.trim());
      const newNote = res?.data || {
        note: noteText.trim(),
        created_at: new Date().toISOString(),
        author_name: 'You',
      };
      setNotes((prev) => [newNote, ...prev]);
      setNoteText('');
      setShowNoteModal(false);
      Alert.alert('Success', 'Note added successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFollowUp = async () => {
    if (!followUpDate.trim()) {
      Alert.alert('Required', 'Please enter follow-up date (YYYY-MM-DD)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await addCustomerFollowUp(id, {
        followup_date: followUpDate.trim(),
        remarks: followUpRemark.trim(),
        priority: followUpPriority,
      });
      const newFollowup = res?.data || {
        followup_date: followUpDate.trim(),
        remarks: followUpRemark.trim(),
        priority: followUpPriority,
        created_at: new Date().toISOString(),
      };
      setFollowups((prev) => [newFollowup, ...prev]);
      setShowFollowUpModal(false);
      setFollowUpDate('');
      setFollowUpRemark('');
      Alert.alert('Success', 'Follow-up scheduled successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to schedule follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMergeCustomers = async () => {
    const cleanDuplicateId = mergeCustomerId.trim();
    if (!cleanDuplicateId) {
      Alert.alert('Required', 'Please enter the Duplicate Customer UUID to merge');
      return;
    }

    if (cleanDuplicateId === id) {
      Alert.alert('Invalid', 'Cannot merge customer with themselves');
      return;
    }

    Alert.alert(
      'Confirm Customer Merge',
      `Are you sure you want to merge customer ${cleanDuplicateId} into this record? All applications, leads, documents, and notes will be consolidated into this profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              // Primary is current customer id, duplicate is cleanDuplicateId
              await mergeCustomers(id, cleanDuplicateId);
              setShowMergeModal(false);
              setMergeCustomerId('');
              Alert.alert('Success', 'Customer records merged successfully');
              loadProfile(id, true);
            } catch (err: any) {
              Alert.alert('Merge Failed', err.message || 'Failed to merge customers');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setSubmitting(true);
    try {
      await updateCustomerStatus(id, newStatus, statusReason.trim() || undefined);
      setPipelineStatus(newStatus);
      setShowStatusModal(false);
      setStatusReason('');
      Alert.alert('Updated', `Customer pipeline status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
      loadProfile(id, true);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update pipeline status');
    } finally {
      setSubmitting(false);
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContainer}
      >
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
          style={[styles.tabItem, activeTab === 'notes' && styles.tabItemActive]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>
            Notes ({notes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'followups' && styles.tabItemActive]}
          onPress={() => setActiveTab('followups')}
        >
          <Text style={[styles.tabText, activeTab === 'followups' && styles.tabTextActive]}>
            Follow-ups ({followups.length})
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
      </ScrollView>

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
        {/* CRM Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowNoteModal(true)}
          >
            <Icon name="message-square" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>+ Note</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowFollowUpModal(true)}
          >
            <Icon name="calendar" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>+ Follow-Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowStatusModal(true)}
          >
            <Icon name="award" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowMergeModal(true)}
          >
            <Icon name="merge" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Merge</Text>
          </TouchableOpacity>
        </View>

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

        {activeTab === 'notes' && (
          <View>
            <TouchableOpacity
              style={styles.addNoteButton}
              onPress={() => setShowNoteModal(true)}
            >
              <Icon name="plus" size={18} color="#fff" />
              <Text style={styles.addNoteButtonText}>Add Note</Text>
            </TouchableOpacity>
            {notes.length === 0 ? (
              <Text style={styles.emptyText}>No notes added yet.</Text>
            ) : (
              notes.map((note: any, idx: number) => (
                <Card key={idx} style={styles.noteCard}>
                  <Text style={styles.noteText}>{note.note}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaAuthor}>{note.author_name || 'Partner'}</Text>
                    <Text style={styles.noteDate}>
                      {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
                    </Text>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'followups' && (
          <View>
            <TouchableOpacity
              style={styles.addNoteButton}
              onPress={() => setShowFollowUpModal(true)}
            >
              <Icon name="plus" size={18} color="#fff" />
              <Text style={styles.addNoteButtonText}>Schedule Follow-Up</Text>
            </TouchableOpacity>
            {followups.length === 0 ? (
              <Text style={styles.emptyText}>No follow-ups scheduled yet.</Text>
            ) : (
              followups.map((item: any, idx: number) => (
                <Card key={idx} style={styles.noteCard}>
                  <View style={styles.followupHeader}>
                    <View style={styles.followupDateRow}>
                      <Icon name="calendar" size={14} color={colors.primary} />
                      <Text style={styles.followupDate}>
                        {item.followup_date || item.scheduled_date || 'Date not set'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.priorityBadge,
                        item.priority === 'high'
                          ? styles.priorityHigh
                          : item.priority === 'low'
                          ? styles.priorityLow
                          : styles.priorityMedium,
                      ]}
                    >
                      <Text style={styles.priorityText}>
                        {(item.priority || 'medium').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {item.remarks ? <Text style={styles.noteText}>{item.remarks}</Text> : null}
                  <Text style={styles.noteDate}>
                    Scheduled on: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                  </Text>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Note Modal */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Customer Note</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter details, feedback, or client discussion..."
              placeholderTextColor={colors.textLight}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddNote}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Save Note</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Follow-Up Modal */}
      <Modal visible={showFollowUpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Follow-Up</Text>
            <Text style={styles.inputLabel}>Date (YYYY-MM-DD):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 2026-10-25"
              placeholderTextColor={colors.textLight}
              value={followUpDate}
              onChangeText={setFollowUpDate}
            />

            <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Priority:</Text>
            <View style={styles.prioritySelector}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityChoice,
                    followUpPriority === p && styles.priorityChoiceActive,
                  ]}
                  onPress={() => setFollowUpPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityChoiceText,
                      followUpPriority === p && styles.priorityChoiceTextActive,
                    ]}
                  >
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Remarks / Discussion:</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 70 }]}
              placeholder="Notes on what to follow up regarding..."
              placeholderTextColor={colors.textLight}
              value={followUpRemark}
              onChangeText={setFollowUpRemark}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowFollowUpModal(false);
                  setFollowUpDate('');
                  setFollowUpRemark('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddFollowUp}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Schedule</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Pipeline Status Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Pipeline Status</Text>
            <Text style={styles.modalSubtitle}>
              Select the current pipeline lifecycle stage for this customer.
            </Text>

            <View style={styles.statusOptions}>
              {[
                { key: 'new', label: 'New Lead' },
                { key: 'contacted', label: 'Contacted' },
                { key: 'interested', label: 'Interested' },
                { key: 'document_pending', label: 'Doc Collection' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'converted', label: 'Converted' },
                { key: 'rejected', label: 'Lost / Rejected' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.statusOptionChip,
                    pipelineStatus === opt.key && styles.statusOptionChipActive,
                  ]}
                  onPress={() => handleUpdateStatus(opt.key)}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      pipelineStatus === opt.key && styles.statusOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
              Reason / Comment (Optional):
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Needs high limit card, submitted salary slips"
              placeholderTextColor={colors.textLight}
              value={statusReason}
              onChangeText={setStatusReason}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowStatusModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Merge Customers Modal */}
      <Modal visible={showMergeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Merge Duplicate Customer</Text>
            <Text style={styles.modalSubtitle}>
              Consolidate duplicate records. Enter the UUID of the duplicate customer record to merge into this master profile.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter Duplicate Customer UUID"
              placeholderTextColor={colors.textLight}
              value={mergeCustomerId}
              onChangeText={setMergeCustomerId}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowMergeModal(false);
                  setMergeCustomerId('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleMergeCustomers}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Merge</Text>
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
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.xs,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  addNoteButtonText: {
    fontSize: typography.sizes.sm,
    color: '#fff',
    fontWeight: typography.weights.bold,
    marginLeft: spacing.xs,
  },
  noteCard: {
    marginBottom: spacing.sm,
  },
  noteText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  noteDate: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  metaAuthor: {
    fontSize: typography.sizes.xs - 1,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  followupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  followupDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  followupDate: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.bold,
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityHigh: {
    backgroundColor: '#fee2e2',
  },
  priorityMedium: {
    backgroundColor: '#fef3c7',
  },
  priorityLow: {
    backgroundColor: '#e0f2fe',
  },
  priorityText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textLight,
    marginBottom: 4,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  priorityChoice: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  priorityChoiceActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  priorityChoiceText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
    fontWeight: typography.weights.semibold,
  },
  priorityChoiceTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statusOptionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  statusOptionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  statusOptionText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    fontWeight: typography.weights.medium,
  },
  statusOptionTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
});
