import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { apiClient } from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  status: string;
  experience_years: number;
  resume_url?: string;
  applied_at: string;
  interview_date?: string;
  interview_feedback?: string;
}

export default function HrCandidatesScreen() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchCandidates();
  }, [statusFilter]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await apiClient.get('/hr/candidates', { params });
      setCandidates(response.data || []);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      Alert.alert('Error', 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (candidateId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/hr/candidates/${candidateId}`, { status: newStatus });
      fetchCandidates();
      Alert.alert('Success', 'Candidate status updated');
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Error', 'Failed to update candidate status');
    }
  };

  const handleScheduleInterview = async (candidateId: string) => {
    Alert.alert(
      'Schedule Interview',
      'This feature will open the interview scheduling form',
      [{ text: 'OK' }]
    );
  };

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase()) ||
    c.email.toLowerCase().includes(searchText.toLowerCase()) ||
    c.phone.includes(searchText) ||
    c.position.toLowerCase().includes(searchText.toLowerCase())
  );

  const statusOptions = ['all', 'applied', 'screening', 'interview_scheduled', 'interviewed', 'offered', 'rejected', 'hired'];

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
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.filterChipActive
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive
                ]}
              >
                {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
          filteredCandidates.map((candidate) => (
            <View key={candidate.id} style={styles.candidateCard}>
              <View style={styles.candidateHeader}>
                <View style={styles.candidateInfo}>
                  <Text style={styles.candidateName}>{candidate.name}</Text>
                  <Text style={styles.candidatePosition}>{candidate.position}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(candidate.status) }
                  ]}
                >
                  <Text style={styles.statusText}>
                    {candidate.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>
              </View>

              <View style={styles.candidateDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{candidate.email}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{candidate.phone}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Experience</Text>
                  <Text style={styles.detailValue}>{candidate.experience_years} years</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Applied</Text>
                  <Text style={styles.detailValue}>
                    {new Date(candidate.applied_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {candidate.interview_date && (
                <View style={styles.interviewContainer}>
                  <Text style={styles.interviewLabel}>Interview Scheduled:</Text>
                  <Text style={styles.interviewDate}>
                    {new Date(candidate.interview_date).toLocaleString()}
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

              <View style={styles.actionsContainer}>
                {candidate.status === 'applied' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleUpdateStatus(candidate.id, 'screening')}
                  >
                    <Text style={styles.actionButtonText}>Move to Screening</Text>
                  </TouchableOpacity>
                )}
                {candidate.status === 'screening' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleScheduleInterview(candidate.id)}
                  >
                    <Text style={styles.actionButtonText}>Schedule Interview</Text>
                  </TouchableOpacity>
                )}
                {candidate.status === 'interviewed' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.offerButton]}
                      onPress={() => handleUpdateStatus(candidate.id, 'offered')}
                    >
                      <Text style={styles.actionButtonText}>Offer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleUpdateStatus(candidate.id, 'rejected')}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'hired': return '#10B981';
    case 'offered': return '#3B82F6';
    case 'interviewed': return '#8B5CF6';
    case 'interview_scheduled': return '#F59E0B';
    case 'screening': return '#06B6D4';
    case 'applied': return '#6B7280';
    case 'rejected': return '#EF4444';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
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
    fontWeight: typography.weights.semiBold,
  },
  interviewContainer: {
    backgroundColor: colors.background,
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
    fontWeight: typography.weights.semiBold,
  },
  feedbackContainer: {
    backgroundColor: colors.background,
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
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
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
