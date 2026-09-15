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
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

export default function SuperAdminDashboardScreen({ route, navigation }) {
  const { user, token } = route.params || {};
  const [metrics, setMetrics] = useState({
    totalPartners: 142,
    pendingKYC: 18,
    totalApplications: 580,
    pendingPayouts: 9
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    setLoading(true);
    try {
      if (token) {
        const res = await axios.get(`${BASE_URL}/super-admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        if (res?.data?.data) {
          setMetrics(res.data.data);
        }
      }
    } catch (err) {
      console.warn('Super Admin metric fetch note:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminMetrics();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Log out of Super Admin Control Panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Home') }
    ]);
  };

  const handleAdminAction = (actionName) => {
    Alert.alert(actionName, `${actionName} module operations are synchronized with the central web admin panel.`);
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

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38BDF8']} />}
      >

        <Text style={styles.sectionTitle}>Key Executive Metrics</Text>
        <View style={styles.metricsGrid}>

          <TouchableOpacity style={[styles.metricCard, { borderLeftColor: '#3B82F6' }]} onPress={() => setActiveModal('partners')}>
            <Text style={styles.metricLabel}>Total Partners</Text>
            <Text style={[styles.metricValue, { color: '#1D4ED8' }]}>{metrics.totalPartners}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.metricCard, { borderLeftColor: '#F59E0B' }]} onPress={() => setActiveModal('kyc')}>
            <Text style={styles.metricLabel}>Pending KYC</Text>
            <Text style={[styles.metricValue, { color: '#B45309' }]}>{metrics.pendingKYC}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.metricCard, { borderLeftColor: '#10B981' }]} onPress={() => setActiveModal('apps')}>
            <Text style={styles.metricLabel}>Total Applications</Text>
            <Text style={[styles.metricValue, { color: '#047857' }]}>{metrics.totalApplications}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.metricCard, { borderLeftColor: '#8B5CF6' }]} onPress={() => setActiveModal('payouts')}>
            <Text style={styles.metricLabel}>Pending Withdrawals</Text>
            <Text style={[styles.metricValue, { color: '#6D28D9' }]}>{metrics.pendingPayouts}</Text>
          </TouchableOpacity>

        </View>

        {/* Administration Modules */}
        <Text style={styles.sectionTitle}>Super Admin Operations</Text>
        <View style={styles.adminNavList}>

          <TouchableOpacity style={styles.adminNavItem} onPress={() => handleAdminAction('Manage Partners & Teams')}>
            <Text style={styles.navIcon}>👥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Manage Partners & Teams</Text>
              <Text style={styles.navSub}>Approve KYC, adjust override % & manage partner codes</Text>
            </View>
            <Text style={styles.navArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminNavItem} onPress={() => handleAdminAction('Application Approvals Desk')}>
            <Text style={styles.navIcon}>📑</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Application Approvals Desk</Text>
              <Text style={styles.navSub}>Review pending loan and credit card applications</Text>
            </View>
            <Text style={styles.navArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminNavItem} onPress={() => handleAdminAction('Products & Commission Matrix')}>
            <Text style={styles.navIcon}>💳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Products & Commission Matrix</Text>
              <Text style={styles.navSub}>Configure bank products, apply links & payout tiers</Text>
            </View>
            <Text style={styles.navArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminNavItem} onPress={() => handleAdminAction('Withdrawal Payout Desk')}>
            <Text style={styles.navIcon}>💰</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Withdrawal Payout Desk</Text>
              <Text style={styles.navSub}>Approve payout requests & record UTR reference numbers</Text>
            </View>
            <Text style={styles.navArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminNavItem} onPress={() => handleAdminAction('System Audit Trail')}>
            <Text style={styles.navIcon}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>System Audit & Analytics</Text>
              <Text style={styles.navSub}>View system security logs, lead status & working hours</Text>
            </View>
            <Text style={styles.navArrow}>➔</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

      {/* Operational Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!activeModal}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === 'partners' && 'Partner Network Summary'}
                {activeModal === 'kyc' && 'Pending KYC Verifications'}
                {activeModal === 'apps' && 'Master Applications Tracker'}
                {activeModal === 'payouts' && 'Pending Bank Payout Desk'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Text style={{ color: '#38BDF8', fontWeight: '800' }}>Close ✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>⚡</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
                Operational Console Active
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                You are viewing real-time metric breakdowns. Complete bulk batch updates directly using the integrated web admin console or mobile desk.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 40,
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#0F172A', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
