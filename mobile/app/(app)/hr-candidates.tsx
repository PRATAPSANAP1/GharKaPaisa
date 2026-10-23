import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Candidate {
  id: string;
  reference_code?: string;
  full_name: string;
  email_id: string;
  mobile_number: string;
  current_designation?: string;
  current_company?: string;
  experience_type?: string;
  total_experience_years?: number;
  resume_url?: string;
  interview_status: string;
  interview_date?: string;
  interview_feedback?: string;
  interview_rating?: number;
  rejection_reason?: string;
  assigned_hr_name?: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  'all',
  'REGISTERED',
  'INTERVIEW_PENDING',
  'INTERVIEWED',
  'SELECTED',
  'REJECTED',
  'EMPLOYEE_CREATED',
];

export default function HrCandidatesScreen() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidates();
  }, [statusFilter]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await apiClient.get('/hr/candidates', { params });
      setCandidates(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      Alert.alert('Error', 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const runCandidateAction = async (
    candidateId: string,
    path: string,
    body: Record<string, any>,
    successMessage: string
  ) => {
    try {
      setActionLoadingId(candidateId);
      await apiClient.post(`/hr/candidates/${candidateId}/${path}`, body);
      await fetchCandidates();
      Alert.alert('Success', successMessage);
    } catch (error) {
      console.error(`Failed to ${path} candidate:`, error);
      Alert.alert('Error', 'Action failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkInterviewed = (candidateId: string) => {
    runCandidateAction(
      candidateId,
      'interview',
      { interview_status: 'INTERVIEWED', interview_date: new Date().toISOString() },
      'Candidate marked as interviewed'
    );
  };

  const handleSelect = (candidateId: string) => {
    Alert.alert(
      'Select Candidate',
      'This will create an employee record and generate an Employee ID. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () =>
            runCandidateAction(candidateId, 'select', {}, 'Candidate selected as employee'),
        },
      ]
    );
  };

  const handleReject = (candidateId: string) => {
    Alert.alert(
      'Reject Candidate',
      'Are you sure you want to reject this candidate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () =>
            runCandidateAction(
              candidateId,
              'reject',
              { rejection_reason: 'Not meeting selection criteria' },
              'Candidate rejected'
            ),
        },
      ]
    );
  };

  const formatStatus = (status?: string) =>
    (status || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

  const filteredCandidates = candidates.filter((c) => {
    const q = searchText.toLowerCase();
    return (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.email_id || '').toLowerCase().includes(q) ||
      (c.mobile_number || '').includes(searchText) ||
      (c.reference_code || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading candidates...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Candidate Management</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search candidates..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STATUS_OPTIONS.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive,
                ]}
              >
                {status === 'all' ? 'All' : formatStatus(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.candidatesContainer}>
        {filteredCandidates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No candidates found</Text>
          </View>
        ) : (
          filteredCandidates.map((candidate) => {
            const busy = actionLoadingId === candidate.id;
            const status = candidate.interview_status;
            return (
              <View key={candidate.id} style={styles.candidateCard}>
                <View style={styles.candidateHeader}>
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName}>{candidate.full_name}</Text>
                    <Text style={styles.candidatePosition}>
                      {candidate.current_designation || candidate.reference_code || 'Candidate'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{formatStatus(status)}</Text>
                  </View>
                </View>

                <View style={styles.candidateDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{candidate.email_id}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{candidate.mobile_number}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Experience</Text>
                    <Text style={styles.detailValue}>
                      {Number(candidate.total_experience_years || 0)} yrs
                      {candidate.experience_type ? ` (${candidate.experience_type})` : ''}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Applied</Text>
                    <Text style={styles.detailValue}>
                      {candidate.created_at
                        ? new Date(candidate.created_at).toLocaleDateString()
                        : '—'}
                    </Text>
                  </View>
                  {candidate.assigned_hr_name && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Assigned HR</Text>
                      <Text style={styles.detailValue}>{candidate.assigned_hr_name}</Text>
                    </View>
                  )}
                  {candidate.current_company && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Current Company</Text>
                      <Text style={styles.detailValue}>{candidate.current_company}</Text>
                    </View>
                  )}
                </View>

                {candidate.interview_date && (
                  <View style={styles.interviewContainer}>
                    <Text style={styles.interviewLabel}>Interview Date:</Text>
                    <Text style={styles.interviewDate}>
                      {new Date(candidate.interview_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {candidate.interview_feedback && (
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackLabel}>Feedback:</Text>
                    <Text style={styles.feedbackText} numberOfLines={2}>
                      {candidate.interview_feedback}
                    </Text>
                  </View>
                )}

                {candidate.rejection_reason && (
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackLabel}>Rejection Reason:</Text>
                    <Text style={styles.feedbackText} numberOfLines={2}>
                      {candidate.rejection_reason}
                    </Text>
                  </View>
                )}

                {candidate.resume_url ? (
                  <TouchableOpacity
                    style={styles.resumeButton}
                    onPress={() => Linking.openURL(candidate.resume_url as string)}
                  >
                    <Text style={styles.resumeButtonText}>View Resume</Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.actionsContainer}>
                  {busy ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      {(status === 'REGISTERED' || status === 'INTERVIEW_PENDING') && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleMarkInterviewed(candidate.id)}
                        >
                          <Text style={styles.actionButtonText}>Mark Interviewed</Text>
                        </TouchableOpacity>
                      )}
                      {status === 'INTERVIEWED' && (
                        <>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.offerButton]}
                            onPress={() => handleSelect(candidate.id)}
                          >
                            <Text style={styles.actionButtonText}>Select</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleReject(candidate.id)}
                          >
                            <Text style={styles.actionButtonText}>Reject</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'EMPLOYEE_CREATED': return '#10B981';
    case 'SELECTED': return '#3B82F6';
    case 'INTERVIEWED': return '#8B5CF6';
    case 'INTERVIEW_PENDING': return '#F59E0B';
    case 'REGISTERED': return '#6B7280';
    case 'REJECTED': return '#EF4444';
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  candidatesContainer: {
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
  candidateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  candidatePosition: {
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
  candidateDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    width: '50%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  interviewContainer: {
    backgroundColor: colors.bg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  interviewLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 2,
  },
  interviewDate: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  feedbackContainer: {
    backgroundColor: colors.bg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  feedbackLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 2,
  },
  feedbackText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  resumeButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  resumeButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    minHeight: 30,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  offerButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
