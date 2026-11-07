import React, { useState, useEffect } from 'react';
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
  FlatList,
  Platform
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { Gradient } from '../components/Gradient';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';

const MOCK_CANDIDATES = [
  { id: '1', reference_code: 'REF-849201', full_name: 'Ankit Sharma', mobile_number: '9876543210', role: 'Telecaller Executive (TC)', status: 'APPLIED', city: 'Mumbai', applied_date: 'Today' },
  { id: '2', reference_code: 'REF-739102', full_name: 'Priya Verma', mobile_number: '9812345678', role: 'Team Leader (TL)', status: 'INTERVIEW_SCHEDULED', city: 'Delhi NCR', applied_date: 'Yesterday' },
  { id: '3', reference_code: 'REF-629403', full_name: 'Rahul Deshmukh', mobile_number: '9765432109', role: 'Branch Manager', status: 'SELECTED', city: 'Pune', applied_date: '14 Sep 2026' },
  { id: '4', reference_code: 'REF-519304', full_name: 'Sneha Gupta', mobile_number: '9654321098', role: 'HR Executive', status: 'REJECTED', city: 'Bangalore', applied_date: '12 Sep 2026' },
];

export default function HrDashboardScreen({ navigation }) {
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'APPLIED' | 'INTERVIEW_SCHEDULED' | 'SELECTED'

  useEffect(() => {
    fetchCandidatePipeline();
  }, []);

  const fetchCandidatePipeline = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/hr/candidates`).catch(() => null);
      if (res?.data?.data && res.data.data.length > 0) {
        setCandidates(res.data.data);
      }
    } catch (err) {
      console.warn('HR recruitment pipeline load note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (candidateId, newStatus) => {
    setCandidates(candidates.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
    Alert.alert('Status Updated', `Candidate status updated to ${newStatus.replace('_', ' ')}.`);
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.reference_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'ALL' || c.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0B1120" barStyle="light-content" />

      {/* Header */}
      <Gradient colors={colors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerBadge}>👥 HR RECRUITMENT</Text>
          <Text style={styles.headerTitle}>Candidate Pipeline</Text>
        </View>
        <TouchableOpacity onPress={fetchCandidatePipeline} style={styles.reloadBtn}>
          <Text style={styles.reloadText}>🔄</Text>
        </TouchableOpacity>
      </Gradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* KPI Summary Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiBox, { backgroundColor: '#131F38', borderColor: '#2563EB' }]}>
            <Text style={styles.kpiVal}>{candidates.length}</Text>
            <Text style={styles.kpiLabel}>Total Applicants</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#131F38', borderColor: '#F59E0B' }]}>
            <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>{candidates.filter(c => c.status === 'INTERVIEW_SCHEDULED').length}</Text>
            <Text style={styles.kpiLabel}>Interviews</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#131F38', borderColor: '#10B981' }]}>
            <Text style={[styles.kpiVal, { color: '#10B981' }]}>{candidates.filter(c => c.status === 'SELECTED').length}</Text>
            <Text style={styles.kpiLabel}>Hired / Selected</Text>
          </View>
        </View>

        {/* Pipeline Controls */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recruitment Pipeline & Candidates</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search candidate name or REF code..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View style={styles.filterRow}>
            {['ALL', 'APPLIED', 'INTERVIEW_SCHEDULED', 'SELECTED'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                  {f.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
          ) : (
            filteredCandidates.map((c) => (
              <View key={c.id} style={styles.candidateCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.cName}>{c.full_name}</Text>
                  <View style={[styles.statusBadge, c.status === 'SELECTED' ? { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10B981' } : c.status === 'REJECTED' ? { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#EF4444' } : { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#F59E0B' }]}>
                    <Text style={[styles.statusBadgeText, c.status === 'SELECTED' ? { color: '#10B981' } : c.status === 'REJECTED' ? { color: '#EF4444' } : { color: '#F59E0B' }]}>
                      {c.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cRef}>Ref Code: {c.reference_code}  •  📱 {c.mobile_number}</Text>
                <Text style={styles.cRole}>Role: {c.role}  •  📍 {c.city}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
                    onPress={() => handleUpdateStatus(c.id, 'INTERVIEW_SCHEDULED')}
                  >
                    <Text style={styles.actionBtnText}>Schedule Interview</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#16A34A' }]}
                    onPress={() => handleUpdateStatus(c.id, 'SELECTED')}
                  >
                    <Text style={styles.actionBtnText}>Select / Hire ✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
                    onPress={() => handleUpdateStatus(c.id, 'REJECTED')}
                  >
                    <Text style={styles.actionBtnText}>Reject ✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1120', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 48,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: spacing.md },
  backBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  headerBadge: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginTop: 2 },
  reloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadText: { fontSize: 16 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  kpiRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  kpiBox: { flex: 1, borderRadius: spacing.radius.lg, padding: spacing.md, borderWidth: 1, alignItems: 'center', backgroundColor: colors.card, ...shadows.sm },
  kpiVal: { fontSize: 22, fontWeight: '900', color: '#60A5FA', letterSpacing: -0.5 },
  kpiLabel: { fontSize: 10, fontWeight: '700', color: colors.textLight, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  card: { backgroundColor: colors.card, borderRadius: spacing.radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.md, letterSpacing: -0.3 },
  searchInput: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: spacing.radius.md, paddingHorizontal: spacing.md, paddingVertical: 11, fontSize: 13, color: colors.text, marginBottom: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm / 2, marginBottom: spacing.lg, flexWrap: 'wrap' },
  filterChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: spacing.radius.full, backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 11, fontWeight: '700', color: colors.textMid },
  filterChipTextActive: { color: '#FFFFFF' },
  candidateCard: { backgroundColor: colors.bgSecondary, borderRadius: spacing.radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, ...shadows.sm },
  cName: { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: spacing.radius.full, borderWidth: 1 },
  statusBadgeText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },
  cRef: { fontSize: 12, color: colors.textMid, marginTop: 5 },
  cRole: { fontSize: 12, fontWeight: '700', color: colors.primaryLight, marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1, paddingVertical: 9, borderRadius: spacing.radius.md, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.2 },
});
