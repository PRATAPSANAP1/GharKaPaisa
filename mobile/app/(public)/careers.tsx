import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import apiClient from '../../services/api';

const JOB_OPENINGS = [
  {
    id: '1',
    role: 'Telecaller / Sales Associate (TC)',
    department: 'Sales & Telecalling Support',
    location: 'Pune, Maharashtra / Hybrid',
    salary: '₹18,000 - ₹28,000 / month + Incentives',
    type: 'Full-Time',
    openings: 12,
  },
  {
    id: '2',
    role: 'Team Leader (TL)',
    department: 'Sales & Team Management',
    location: 'Pune / Mumbai',
    salary: '₹35,000 - ₹50,000 / month + Team Override',
    type: 'Full-Time',
    openings: 4,
  },
  {
    id: '3',
    role: 'Operations & KYC Specialist',
    department: 'Verification & Banking Operations',
    location: 'Pune, Maharashtra',
    salary: '₹22,000 - ₹32,000 / month',
    type: 'Full-Time',
    openings: 5,
  },
];

export default function CareersScreen() {
  const [activeTab, setActiveTab] = useState<'openings' | 'apply' | 'status'>('openings');

  // Application Form State
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState('TC');
  const [experience, setExperience] = useState('Fresher');
  const [qualification, setQualification] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successRefCode, setSuccessRefCode] = useState<string | null>(null);

  // Status Search State
  const [statusSearch, setStatusSearch] = useState('');
  const [candidateStatus, setCandidateStatus] = useState<any>(null);
  const [searchingStatus, setSearchingStatus] = useState(false);

  const handleApply = async () => {
    if (!fullName.trim() || !mobile.trim() || !email.trim() || !qualification.trim()) {
      Alert.alert('Required', 'Please fill in all mandatory fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post('/public/careers/register', {
        full_name: fullName.trim(),
        mobile_number: mobile.trim(),
        email_id: email.trim().toLowerCase(),
        highest_qualification: qualification.trim(),
        target_role: targetRole,
        experience_type: experience,
        city: city.trim(),
      });

      const ref = res?.data?.reference_code || res?.data?.data?.reference_code;
      setSuccessRefCode(ref || null);
      Alert.alert(
        'Application Submitted',
        ref
          ? `Your application has been received! Reference Code: ${ref}`
          : 'Your application has been received! Our HR team will reach out to you shortly.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit job application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!statusSearch.trim()) {
      Alert.alert('Required', 'Please enter Candidate Reference Code or Mobile');
      return;
    }
    setSearchingStatus(true);
    setCandidateStatus(null);
    try {
      const query = statusSearch.trim();
      const isMobile = /^\d{10}$/.test(query);
      const url = isMobile
        ? `/public/careers/reference-code/${query}`
        : `/public/careers/status/${query}`;
      const res = await apiClient.get(url);

      if (res?.data?.data) {
        setCandidateStatus(res.data.data);
      } else {
        Alert.alert('Not Found', 'No application found with the given reference code');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not fetch status');
    } finally {
      setSearchingStatus(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>CAREERS & HIRING</Text>
          <Text style={styles.headerTitle}>Join GharKaPaisa Team</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'openings' && styles.activeTabBtn]}
          onPress={() => setActiveTab('openings')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'openings' && styles.activeTabBtnText]}>
            Open Positions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'apply' && styles.activeTabBtn]}
          onPress={() => setActiveTab('apply')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'apply' && styles.activeTabBtnText]}>
            Apply Online
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'status' && styles.activeTabBtn]}
          onPress={() => setActiveTab('status')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'status' && styles.activeTabBtnText]}>
            Check Status
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: Openings */}
      {activeTab === 'openings' && (
        <View style={{ gap: spacing.sm }}>
          {JOB_OPENINGS.map((job) => (
            <Card key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobRole}>{job.role}</Text>
                  <Text style={styles.jobDept}>{job.department}</Text>
                </View>
                <View style={styles.openingBadge}>
                  <Text style={styles.openingText}>{job.openings} Openings</Text>
                </View>
              </View>

              <View style={styles.jobMetaRow}>
                <Text style={styles.jobMeta}>📍 {job.location}</Text>
                <Text style={styles.jobMeta}>💼 {job.type}</Text>
              </View>

              <View style={styles.salaryBox}>
                <Text style={styles.salaryLabel}>Package</Text>
                <Text style={styles.salaryValue}>{job.salary}</Text>
              </View>

              <Button
                title="Apply for this Role"
                onPress={() => {
                  setTargetRole(job.role.includes('TC') ? 'TC' : job.role.includes('TL') ? 'TL' : 'Operations');
                  setActiveTab('apply');
                }}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          ))}
        </View>
      )}

      {/* TAB 2: Apply Form */}
      {activeTab === 'apply' && (
        <Card style={styles.card}>
          <Text style={styles.formTitle}>Candidate Interview Registration</Text>
          <Text style={styles.formSubtitle}>
            Submit your profile for instant review by our Talent Acquisition team.
          </Text>

          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Amit Verma"
            placeholderTextColor={colors.textLight}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.inputLabel}>Mobile Number *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="9876543210"
            placeholderTextColor={colors.textLight}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="amit@example.com"
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>Target Role</Text>
          <TextInput
            style={styles.textInput}
            value={targetRole}
            onChangeText={setTargetRole}
            placeholder="TC / Team Leader / Manager"
            placeholderTextColor={colors.textLight}
          />

          <Text style={styles.inputLabel}>Current City</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Pune, Mumbai, Bangalore"
            placeholderTextColor={colors.textLight}
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.inputLabel}>Highest Qualification *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. B.Com, BBA, MBA"
            placeholderTextColor={colors.textLight}
            value={qualification}
            onChangeText={setQualification}
          />

          <Button
            title="Submit Job Application"
            onPress={handleApply}
            loading={submitting}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      )}

      {/* TAB 3: Status */}
      {activeTab === 'status' && (
        <Card style={styles.card}>
          <Text style={styles.formTitle}>Track Candidate Application</Text>
          <Text style={styles.formSubtitle}>
            Check your interview schedule and recruitment outcome.
          </Text>

          <Text style={styles.inputLabel}>Candidate Reference Code or Mobile</Text>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="e.g. CAND10072 or 9876543210"
              placeholderTextColor={colors.textLight}
              value={statusSearch}
              onChangeText={setStatusSearch}
              autoCapitalize="characters"
            />
          </View>

          <Button
            title="Search Candidate Record"
            onPress={handleCheckStatus}
            loading={searchingStatus}
            style={{ marginTop: spacing.md }}
          />

          {candidateStatus && (
            <View style={styles.statusResultCard}>
              <Text style={styles.candName}>{candidateStatus.full_name}</Text>
              <Text style={styles.candRef}>
                Ref: {candidateStatus.reference_code || candidateStatus.id} • Role: {candidateStatus.target_role || 'Staff'}
              </Text>
              <View style={styles.stagePill}>
                <Text style={styles.stagePillText}>
                  STATUS: {(candidateStatus.status || candidateStatus.interview_status || 'APPLICATION_RECEIVED').toUpperCase()}
                </Text>
              </View>
            </View>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.md,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabBtn: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeTabBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    padding: 0,
  },
  jobCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobRole: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  jobDept: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  openingBadge: {
    backgroundColor: `${colors.primary}25`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  jobMetaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  jobMeta: {
    fontSize: 11,
    color: colors.textMid,
  },
  salaryBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  salaryLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  salaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 1,
  },
  statusResultCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  candName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  candRef: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  stagePill: {
    backgroundColor: '#10B98125',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  stagePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
});
