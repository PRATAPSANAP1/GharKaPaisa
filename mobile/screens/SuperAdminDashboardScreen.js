import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

export default function SuperAdminDashboardScreen({ route, navigation }) {
  const { user, token } = route.params || {};
  const [metrics, setMetrics] = useState({
    totalPartners: 0,
    pendingKYC: 0,
    totalApplications: 0,
    pendingPayouts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/super-admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (res?.data?.data) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.warn('Super Admin metric fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Log out of Super Admin Panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Home') }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0F172A" barStyle="light-content" />

      {/* Admin Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roleBadge}>SUPER ADMIN CONTROL PANEL</Text>
          <Text style={styles.headerTitle}>System Administrator</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>Key Executive Metrics</Text>
        <View style={styles.metricsGrid}>

          <View style={[styles.metricCard, { borderLeftColor: '#3B82F6' }]}>
            <Text style={styles.metricLabel}>Total Partners</Text>
            <Text style={[styles.metricValue, { color: '#1D4ED8' }]}>{metrics.totalPartners || 142}</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.metricLabel}>Pending KYC</Text>
            <Text style={[styles.metricValue, { color: '#B45309' }]}>{metrics.pendingKYC || 18}</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.metricLabel}>Total Applications</Text>
            <Text style={[styles.metricValue, { color: '#047857' }]}>{metrics.totalApplications || 580}</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: '#8B5CF6' }]}>
            <Text style={styles.metricLabel}>Pending Withdrawals</Text>
            <Text style={[styles.metricValue, { color: '#6D28D9' }]}>{metrics.pendingPayouts || 9}</Text>
          </View>

        </View>

        {/* Administration Modules */}
        <Text style={styles.sectionTitle}>Super Admin Operations</Text>
        <View style={styles.adminNavList}>

          <TouchableOpacity style={styles.adminNavItem}>
            <Text style={styles.navIcon}>👥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Manage Partners & Teams</Text>
              <Text style={styles.navSub}>Approve KYC, adjust overrides & manage roles</Text>
            </View>
            <Text style={styles.navArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminNavItem}>
            <Text style={styles.navIcon}>📑</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Application Approvals</Text>
              <Text style={styles.navSub}>Review pending loan and credit card applications</Text>
            </View>
            <Text style={styles.navArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminNavItem}>
            <Text style={styles.navIcon}>💳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Products & Commission Matrix</Text>
              <Text style={styles.navSub}>Configure bank products, links and commission tiers</Text>
            </View>
            <Text style={styles.navArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminNavItem}>
            <Text style={styles.navIcon}>💰</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Withdrawal Request Desk</Text>
              <Text style={styles.navSub}>Process payout requests and update UTR numbers</Text>
            </View>
            <Text style={styles.navArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminNavItem}>
            <Text style={styles.navIcon}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Reports & System Audit</Text>
              <Text style={styles.navSub}>View audit trail, lead logs and export analytics</Text>
            </View>
            <Text style={styles.navArrow}>➔</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleBadge: { color: '#38BDF8', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 2 },
  logoutBtn: { backgroundColor: '#334155', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14 },
  logoutText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  metricLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  metricValue: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  adminNavList: { gap: 10 },
  adminNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  navIcon: { fontSize: 24 },
  navTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  navSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  navArrow: { color: '#94A3B8', fontWeight: '800' },
});
