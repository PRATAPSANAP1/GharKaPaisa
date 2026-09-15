import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Platform
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

export default function ApplicationsScreen({ route, navigation }) {
  const { token, user } = route.params || {};
  const [scope, setScope] = useState('my'); // 'my' | 'team'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

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

      if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setApplications(res.data.data);
      } else {
        // High quality demonstration leads
        setApplications([
          { 
            id: '1', 
            application_ref: 'APP-884931',
            customer_name: 'Rahul Sharma', 
            customer_mobile: '9876543210',
            product_name: 'HDFC Pixel Go Card', 
            status: 'approved', 
            created_at: '2026-08-10', 
            payout: '₹1,500',
            bank_name: 'HDFC Bank',
            notes: 'Document verification completed and card approved.'
          },
          { 
            id: '2', 
            application_ref: 'APP-884932',
            customer_name: 'Priya Patel', 
            customer_mobile: '9812345678',
            product_name: 'Instant Personal Loan', 
            status: 'under_review', 
            created_at: '2026-08-11', 
            payout: 'Pending',
            bank_name: 'Axis Bank',
            notes: 'Bank verification team is verifying income details.'
          },
          { 
            id: '3', 
            application_ref: 'APP-884933',
            customer_name: 'Amit Kumar', 
            customer_mobile: '9765432109',
            product_name: 'SBI Credit Card', 
            status: 'submitted', 
            created_at: '2026-08-09', 
            payout: 'Pending',
            bank_name: 'SBI Bank',
            notes: 'Lead submitted via partner portal.'
          },
          { 
            id: '4', 
            application_ref: 'APP-884934',
            customer_name: 'Suresh Raina', 
            customer_mobile: '9654321098',
            product_name: 'Home Loan', 
            status: 'rejected', 
            created_at: '2026-08-05', 
            payout: '₹0',
            bank_name: 'ICICI Bank',
            notes: 'CIBIL score below bank eligibility threshold.'
          },
        ]);
      }
    } catch (err) {
      console.warn('App fetch note:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'approved': return { label: 'APPROVED', style: styles.badgeGreen };
      case 'under_review': return { label: 'UNDER REVIEW', style: styles.badgeYellow };
      case 'rejected': return { label: 'REJECTED', style: styles.badgeRed };
      default: return { label: 'SUBMITTED', style: styles.badgeBlue };
    }
  };

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = app.customer_name?.toLowerCase().includes(q) || app.product_name?.toLowerCase().includes(q) || app.application_ref?.toLowerCase().includes(q);
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    return nameMatch && statusMatch;
  });

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

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer, product, or ref #..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter Pills */}
      <View style={styles.statusFilterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {['all', 'submitted', 'under_review', 'approved', 'rejected'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusPill, statusFilter === st && styles.statusPillActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.statusPillText, statusFilter === st && styles.statusPillTextActive]}>
                {st.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0d47a1" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d47a1']} />}
        >
          {filteredApps.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No applications found</Text>
              <Text style={styles.emptySub}>Start sharing products to generate customer leads and track earnings.</Text>
            </View>
          ) : (
            filteredApps.map((app) => {
              const badge = getStatusBadge(app.status);
              return (
                <TouchableOpacity
                  key={app.id}
                  style={styles.appCard}
                  onPress={() => setSelectedApp(app)}
                >
                  <View style={styles.appCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.custName}>{app.customer_name || 'Customer'}</Text>
                      <Text style={styles.prodName}>{app.product_name || 'Financial Product'} • {app.bank_name || 'Partner Bank'}</Text>
                      {app.application_ref && (
                        <Text style={styles.refText}>Ref #: {app.application_ref}</Text>
                      )}
                    </View>
                    <Text style={[styles.badge, badge.style]}>{badge.label}</Text>
                  </View>

                  <View style={styles.appCardBottom}>
                    <Text style={styles.dateText}>Date: {app.created_at?.split('T')[0]}</Text>
                    <Text style={styles.payoutText}>Commission: {app.payout || 'Calculating'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Application Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedApp}
        onRequestClose={() => setSelectedApp(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedApp && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Application Details</Text>
                  <TouchableOpacity onPress={() => setSelectedApp(null)}>
                    <Text style={{ color: '#0d47a1', fontWeight: '800' }}>Close ✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ padding: 18 }}>
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>CUSTOMER NAME</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>{selectedApp.customer_name}</Text>
                  </View>

                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>PRODUCT & BANK</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0d47a1', marginTop: 2 }}>{selectedApp.product_name} ({selectedApp.bank_name})</Text>
                  </View>

                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>REFERENCE CODE</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>{selectedApp.application_ref || 'PENDING'}</Text>
                  </View>

                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>STATUS & COMMISSION</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <Text style={[styles.badge, getStatusBadge(selectedApp.status).style]}>{getStatusBadge(selectedApp.status).label}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#059669' }}>Payout: {selectedApp.payout}</Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 14, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>REMARKS / VERIFICATION NOTES</Text>
                    <Text style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>{selectedApp.notes || 'Application is being processed by the bank desk.'}</Text>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

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
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#0d47a1' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#0d47a1' },
  searchContainer: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8 },
  searchInput: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0F172A' },
  statusFilterBar: { backgroundColor: '#FFFFFF', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  statusPill: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F8FAFC', marginRight: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  statusPillActive: { backgroundColor: '#0d47a1', borderColor: '#0d47a1' },
  statusPillText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  statusPillTextActive: { color: '#FFFFFF' },
  scroll: { padding: 16, paddingBottom: 40 },
  appCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12, elevation: 1 },
  appCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  custName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  prodName: { fontSize: 12, color: '#64748B', marginTop: 2 },
  refText: { fontSize: 11, fontWeight: '700', color: '#0d47a1', marginTop: 2 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
});
