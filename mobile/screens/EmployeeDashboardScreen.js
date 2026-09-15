import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import apiClient from '../config/api';

export default function EmployeeDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState({
    code: user?.employee_code || 'EMP-2026-08',
    designation: user?.designation || 'Administrative Sales Executive',
    assignedApps: 14,
    pendingVerifications: 5,
    monthlyTarget: 500000,
    targetAchieved: 340000,
    incentiveEarned: 12500,
    incentiveLedger: [
      { id: '1', month: 'September 2026', target: '₹5,00,000', achieved: '₹3,40,000 (68%)', incentive: '₹12,500' },
      { id: '2', month: 'August 2026', target: '₹4,00,000', achieved: '₹4,20,000 (105%)', incentive: '₹18,000' }
    ]
  });

  useEffect(() => {
    fetchEmployeeStats();
  }, []);

  const fetchEmployeeStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/employee/dashboard').catch(() => null);
      if (res?.data?.success) {
        setEmployeeData((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (_) {
      // Mock fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Dashboard</Text>
          </TouchableOpacity>
          <View style={styles.employeeBadge}>
            <Text style={styles.employeeBadgeText}>EMPLOYEE PORTAL</Text>
          </View>
        </View>

        <Text style={styles.title}>Employee Workspace</Text>
        <Text style={styles.subtitle}>{user?.full_name || 'Operational Executive'} ({employeeData.code})</Text>

        {/* Designation Banner */}
        <View style={styles.designationCard}>
          <Text style={styles.designationLabel}>Assigned Role & Designation</Text>
          <Text style={styles.designationValue}>{employeeData.designation}</Text>
          <Text style={styles.processType}>Allowed Process: Punching Only (Bank Verified)</Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <TouchableOpacity 
            style={styles.metricCard}
            onPress={() => navigation.navigate('Applications', { filter: 'assigned' })}
          >
            <Text style={styles.metricVal}>{employeeData.assignedApps}</Text>
            <Text style={styles.metricTitle}>Assigned Apps</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.metricCard}
            onPress={() => navigation.navigate('PartnerKyc')}
          >
            <Text style={styles.metricVal}>{employeeData.pendingVerifications}</Text>
            <Text style={styles.metricTitle}>Pending KYC Review</Text>
          </TouchableOpacity>
        </View>

        {/* Incentive Target Progress Bar */}
        <View style={styles.incentiveCard}>
          <Text style={styles.cardHeader}>Target & Incentive Progress</Text>
          <View style={styles.targetRow}>
            <Text style={styles.targetText}>Monthly Target: ₹5,00,000</Text>
            <Text style={styles.achievedText}>Earned: ₹{employeeData.incentiveEarned.toLocaleString()}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '68%' }]} />
          </View>
          <Text style={styles.progressSubtext}>68% achieved • ₹1,60,000 remaining to reach max tier</Text>
        </View>

        {/* Incentive History Table */}
        <View style={styles.historyCard}>
          <Text style={styles.cardHeader}>Monthly Incentive Ledger</Text>
          {employeeData.incentiveLedger.map((item) => (
            <View key={item.id} style={styles.ledgerRow}>
              <View>
                <Text style={styles.ledgerMonth}>{item.month}</Text>
                <Text style={styles.ledgerSub}>Achieved: {item.achieved}</Text>
              </View>
              <Text style={styles.ledgerAmount}>{item.incentive}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backBtn: { paddingVertical: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0284C7' },
  employeeBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  employeeBadgeText: { fontSize: 11, fontWeight: '800', color: '#0369A1' },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  designationCard: { backgroundColor: '#0284C7', padding: 18, borderRadius: 16, marginBottom: 16 },
  designationLabel: { color: '#E0F2FE', fontSize: 12, fontWeight: '600' },
  designationValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  processType: { color: '#BAE6FD', fontSize: 12, marginTop: 6, fontWeight: '600' },
  metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  metricVal: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  metricTitle: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '600' },
  incentiveCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  cardHeader: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  targetText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  achievedText: { fontSize: 13, color: '#16A34A', fontWeight: '800' },
  progressTrack: { height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 5 },
  progressSubtext: { fontSize: 11, color: '#94A3B8' },
  historyCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  ledgerMonth: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  ledgerSub: { fontSize: 12, color: '#64748B' },
  ledgerAmount: { fontSize: 15, fontWeight: '800', color: '#0284C7' }
});
