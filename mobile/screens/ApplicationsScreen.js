import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

export default function ApplicationsScreen({ route, navigation }) {
  const { token, user } = route.params || {};
  const [scope, setScope] = useState('my'); // 'my' | 'team'
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [scope]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const endpoint = scope === 'my'
        ? `${BASE_URL}/applications/my-leads`
        : `${BASE_URL}/applications/team-leads`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (res?.data?.data) {
        setApplications(res.data.data);
      } else {
        // Fallback demo data
        setApplications([
          { id: '1', customer_name: 'Rahul Sharma', product_name: 'HDFC Pixel Go Card', status: 'approved', created_at: '2026-08-10', payout: '₹1,500' },
          { id: '2', customer_name: 'Priya Patel', product_name: 'Instant Personal Loan', status: 'under_review', created_at: '2026-08-11', payout: 'Pending' },
          { id: '3', customer_name: 'Amit Kumar', product_name: 'SBI Credit Card', status: 'submitted', created_at: '2026-08-09', payout: 'Pending' },
        ]);
      }
    } catch (err) {
      console.warn('App fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'approved': return { label: 'APPROVED', style: styles.badgeGreen };
      case 'under_review': return { label: 'UNDER REVIEW', style: styles.badgeYellow };
      case 'rejected': return { label: 'REJECTED', style: styles.badgeRed };
      default: return { label: 'SUBMITTED', style: styles.badgeBlue };
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
        <Text style={styles.headerTitle}>Application Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scope Selector Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, scope === 'my' && styles.tabActive]}
          onPress={() => setScope('my')}
        >
          <Text style={[styles.tabText, scope === 'my' && styles.tabTextActive]}>My Applications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, scope === 'team' && styles.tabActive]}
          onPress={() => setScope('team')}
        >
          <Text style={[styles.tabText, scope === 'team' && styles.tabTextActive]}>Team Downline Apps</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0d47a1" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {applications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No applications found</Text>
              <Text style={styles.emptySub}>Start sharing products to generate leads and earn commissions.</Text>
            </View>
          ) : (
            applications.map((app) => {
              const badge = getStatusBadge(app.status);
              return (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appCardTop}>
                    <View>
                      <Text style={styles.custName}>{app.customer_name || 'Customer'}</Text>
                      <Text style={styles.prodName}>{app.product_name || 'Financial Product'}</Text>
                    </View>
                    <Text style={[styles.badge, badge.style]}>{badge.label}</Text>
                  </View>
                  <View style={styles.appCardBottom}>
                    <Text style={styles.dateText}>Applied: {app.created_at?.split('T')[0]}</Text>
                    <Text style={styles.payoutText}>Commission: {app.payout || 'Calculating'}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#0d47a1' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#0d47a1' },
  scroll: { padding: 16, paddingBottom: 40 },
  appCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12, elevation: 1 },
  appCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  custName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  prodName: { fontSize: 12, color: '#64748B', marginTop: 2 },
  badge: { fontSize: 10, fontWeight: '800', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#ECFDF5', color: '#059669' },
  badgeYellow: { backgroundColor: '#FFFBEB', color: '#D97706' },
  badgeBlue: { backgroundColor: '#EFF6FF', color: '#2563EB' },
  badgeRed: { backgroundColor: '#FEF2F2', color: '#DC2626' },
  appCardBottom: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  dateText: { fontSize: 11, color: '#94A3B8' },
  payoutText: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 },
});
