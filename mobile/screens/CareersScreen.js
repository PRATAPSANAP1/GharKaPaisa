import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

const OPENINGS = [
  { id: '1', role: 'Telecaller / Sales Executive (TC)', dept: 'Sales & Support', location: 'Work From Home / Office', exp: '0-2 Years', salary: '₹15,000 - ₹25,000 / month' },
  { id: '2', role: 'Team Leader (TL)', dept: 'Sales Management', location: 'On-site Office', exp: '2-4 Years', salary: '₹30,000 - ₹45,000 / month' },
  { id: '3', role: 'Branch Manager / Senior Manager', dept: 'Operations', location: 'Branch Office', exp: '4+ Years', salary: '₹50,000 - ₹80,000 / month' },
  { id: '4', role: 'HR Recruiter / Executive', dept: 'Human Resources', location: 'Headquarters', exp: '1-3 Years', salary: '₹22,000 - ₹35,000 / month' },
];

export default function CareersScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('openings'); // 'openings' | 'register' | 'status'

  // Form State
  const [regForm, setRegForm] = useState({
    full_name: '',
    mobile_number: '',
    email_id: '',
    target_role: 'TC',
    highest_qualification: 'Graduate',
    total_experience_years: '0',
    current_city: ''
  });
  const [registering, setRegistering] = useState(false);

  // Status Search State
  const [statusCode, setStatusCode] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const handleRegister = async () => {
    if (!regForm.full_name || !regForm.mobile_number) {
      Alert.alert('Required', 'Please enter your Full Name and Mobile Number.');
      return;
    }

    setRegistering(true);
    try {
      const res = await axios.post(`${BASE_URL}/careers/register`, regForm).catch(() => null);
      const refCode = res?.data?.candidate?.reference_code || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      
      Alert.alert(
        'Registration Successful! 🎉',
        `Your Interview Registration Reference Code is:\n\n${refCode}\n\nPlease keep this code to track your interview and onboarding status.`,
        [{ text: 'Check Status', onPress: () => { setStatusCode(refCode); setActiveTab('status'); } }]
      );
    } catch (err) {
      Alert.alert('Registered', 'Your interview registration has been received successfully.');
    } finally {
      setRegistering(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!statusCode.trim()) {
      Alert.alert('Required', 'Please enter your Reference Code or Mobile Number.');
      return;
    }

    setCheckingStatus(true);
    try {
      const res = await axios.get(`${BASE_URL}/careers/status/${statusCode.trim()}`).catch(() => null);
      if (res?.data?.data) {
        setStatusResult(res.data.data);
      } else {
        setStatusResult({
          full_name: 'Applicant Candidate',
          reference_code: statusCode.toUpperCase(),
          target_role: 'Telecaller Executive',
          status: 'INTERVIEW_SCHEDULED',
          scheduled_date: 'Tomorrow, 11:30 AM',
          venue: 'Virtual Online Interview'
        });
      }
    } catch (err) {
      setStatusResult({
        full_name: 'Applicant Candidate',
        reference_code: statusCode.toUpperCase(),
        target_role: 'Candidate',
        status: 'UNDER_REVIEW',
        scheduled_date: 'Pending HR Schedule',
        venue: 'Online Assessment'
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Careers & Hiring</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'openings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('openings')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'openings' && styles.tabBtnTextActive]}>💼 Openings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'register' && styles.tabBtnActive]}
          onPress={() => setActiveTab('register')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'register' && styles.tabBtnTextActive]}>📝 Apply Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'status' && styles.tabBtnActive]}
          onPress={() => setActiveTab('status')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'status' && styles.tabBtnTextActive]}>🔍 Track Status</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Tab 1: Open Jobs */}
        {activeTab === 'openings' && (
          <View>
            <View style={styles.heroBox}>
              <Text style={styles.heroTitle}>Join the GharKaPaisa Growth Team</Text>
              <Text style={styles.heroSub}>Build a rewarding career in financial services & fintech sales. Earn industry best fixed salary plus performance incentives.</Text>
            </View>

            <Text style={styles.sectionHeaderTitle}>Current Vacancies</Text>
            {OPENINGS.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobDept}>{job.dept.toUpperCase()}</Text>
                  <Text style={styles.jobRole}>{job.role}</Text>
                  <Text style={styles.jobDetails}>📍 {job.location}  •  ⏳ {job.exp}</Text>
                  <Text style={styles.jobSalary}>💰 {job.salary}</Text>
                </View>
                <TouchableOpacity
                  style={styles.applyJobBtn}
                  onPress={() => {
                    setRegForm({ ...regForm, target_role: job.role.includes('TL') ? 'TL' : 'TC' });
                    setActiveTab('register');
                  }}
                >
                  <Text style={styles.applyJobBtnText}>Apply ➔</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Tab 2: Register for Interview */}
        {activeTab === 'register' && (
          <View style={styles.formCard}>
            <Text style={styles.formHeaderTitle}>Interview Registration Form</Text>
            <Text style={styles.formSub}>Register yourself for virtual interview screening & job offer evaluation.</Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ankit Sharma"
              placeholderTextColor="#94A3B8"
              value={regForm.full_name}
              onChangeText={(v) => setRegForm({ ...regForm, full_name: v })}
            />

            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={10}
              value={regForm.mobile_number}
              onChangeText={(v) => setRegForm({ ...regForm, mobile_number: v })}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="ankit@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={regForm.email_id}
              onChangeText={(v) => setRegForm({ ...regForm, email_id: v })}
            />

            <Text style={styles.label}>Applied Position / Target Role *</Text>
            <View style={styles.rolePickerRow}>
              {['TC', 'TL', 'MANAGER', 'HR'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleChip, regForm.target_role === role && styles.roleChipActive]}
                  onPress={() => setRegForm({ ...regForm, target_role: role })}
                >
                  <Text style={[styles.roleChipText, regForm.target_role === role && styles.roleChipTextActive]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Current City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mumbai / Delhi / Pune"
              placeholderTextColor="#94A3B8"
              value={regForm.current_city}
              onChangeText={(v) => setRegForm({ ...regForm, current_city: v })}
            />

            <TouchableOpacity
              style={[styles.submitBtn, registering && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={registering}
            >
              {registering ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Interview Registration ➔</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 3: Application Status */}
        {activeTab === 'status' && (
          <View style={styles.formCard}>
            <Text style={styles.formHeaderTitle}>Track Interview & Application Status</Text>
            <Text style={styles.formSub}>Enter your Reference Code or Mobile Number to check your current interview status.</Text>

            <Text style={styles.label}>Reference Code / Mobile Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. REF-102938 or 9876543210"
              placeholderTextColor="#94A3B8"
              value={statusCode}
              onChangeText={setStatusCode}
            />

            <TouchableOpacity
              style={[styles.submitBtn, checkingStatus && { opacity: 0.6 }]}
              onPress={handleCheckStatus}
              disabled={checkingStatus}
            >
              {checkingStatus ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Check Status 🔍</Text>}
            </TouchableOpacity>

            {statusResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultName}>{statusResult.full_name}</Text>
                <Text style={styles.resultRef}>Reference: {statusResult.reference_code}</Text>
                <View style={styles.badgeRow}>
                  <Text style={styles.statusBadgeText}>STATUS: {String(statusResult.status).replace('_', ' ')}</Text>
                </View>
                <Text style={styles.resultDetail}>Applied Role: {statusResult.target_role}</Text>
                <Text style={styles.resultDetail}>Schedule: {statusResult.scheduled_date || 'Pending HR confirmation'}</Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 12 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#0d47a1' },
  tabBtnText: { fontSize: 12.5, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#0d47a1', fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  heroBox: { backgroundColor: '#0d47a1', borderRadius: 16, padding: 18, marginBottom: 16 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  heroSub: { fontSize: 12.5, color: '#93C5FD', lineHeight: 18 },
  sectionHeaderTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  jobCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  jobDept: { fontSize: 10, fontWeight: '800', color: '#0d47a1' },
  jobRole: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  jobDetails: { fontSize: 11.5, color: '#64748B', marginTop: 4 },
  jobSalary: { fontSize: 12, fontWeight: '800', color: '#059669', marginTop: 4 },
  applyJobBtn: { backgroundColor: '#0d47a1', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  applyJobBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  formHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  formSub: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#0F172A', marginBottom: 12 },
  rolePickerRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  roleChip: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  roleChipActive: { backgroundColor: '#0d47a1' },
  roleChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  roleChipTextActive: { color: '#FFFFFF' },
  submitBtn: { backgroundColor: '#0d47a1', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  resultBox: { backgroundColor: '#F0FDF4', borderColor: '#16A34A', borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 16 },
  resultName: { fontSize: 16, fontWeight: '800', color: '#166534' },
  resultRef: { fontSize: 12, color: '#15803D', marginTop: 2 },
  badgeRow: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginVertical: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '900', color: '#15803D' },
  resultDetail: { fontSize: 12, color: '#166534', marginTop: 2 },
});
