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
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HR Recruitment Dashboard</Text>
        <TouchableOpacity onPress={fetchCandidatePipeline}>
          <Text style={styles.reloadText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* KPI Summary Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiBox, { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }]}>
            <Text style={styles.kpiVal}>{candidates.length}</Text>
            <Text style={styles.kpiLabel}>Total Applicants</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <Text style={[styles.kpiVal, { color: '#D97706' }]}>{candidates.filter(c => c.status === 'INTERVIEW_SCHEDULED').length}</Text>
            <Text style={styles.kpiLabel}>Interviews</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
            <Text style={[styles.kpiVal, { color: '#059669' }]}>{candidates.filter(c => c.status === 'SELECTED').length}</Text>
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
            <ActivityIndicator size="large" color="#0d47a1" style={{ marginVertical: 20 }} />
          ) : (
            filteredCandidates.map((c) => (
              <View key={c.id} style={styles.candidateCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.cName}>{c.full_name}</Text>
                  <View style={[styles.statusBadge, c.status === 'SELECTED' ? { backgroundColor: '#DCFCE7' } : c.status === 'REJECTED' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.statusBadgeText, c.status === 'SELECTED' ? { color: '#15803D' } : c.status === 'REJECTED' ? { color: '#B91C1C' } : { color: '#B45309' }]}>
                      {c.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cRef}>Ref Code: {c.reference_code}  •  📱 {c.mobile_number}</Text>
                <Text style={styles.cRole}>Role: {c.role}  •  📍 {c.city}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#0284C7' }]}
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
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  reloadText: { fontSize: 16 },
  scroll: { padding: 16, paddingBottom: 40 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  kpiBox: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1, alignItems: 'center' },
  kpiVal: { fontSize: 20, fontWeight: '900', color: '#1D4ED8' },
  kpiLabel: { fontSize: 10.5, fontWeight: '700', color: '#475569', marginTop: 2 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  searchInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#0F172A', marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  filterChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F1F5F9' },
  filterChipActive: { backgroundColor: '#0d47a1' },
  filterChipText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF' },
  candidateCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 12 },
  cName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '900' },
  cRef: { fontSize: 12, color: '#64748B', marginTop: 4 },
  cRole: { fontSize: 12, fontWeight: '700', color: '#0d47a1', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '800' },
});
