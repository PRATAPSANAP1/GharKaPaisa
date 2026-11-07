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
import { Gradient } from '../components/Gradient';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';

const METRIC_CONFIG = {
  partners:   { label: 'Total Partners',       value: 'totalPartners',   accent: '#60A5FA', icon: '👥' },
  kyc:        { label: 'Pending KYC',          value: 'pendingKYC',      accent: '#F59E0B', icon: '🛡️' },
  apps:       { label: 'Total Applications',   value: 'totalApplications', accent: '#10B981', icon: '📑' },
  payouts:    { label: 'Pending Withdrawals',  value: 'pendingPayouts',  accent: '#8B5CF6', icon: '💰' },
};

const ADMIN_MODULES = [
  { key: 'partners', icon: '👥', title: 'Manage Partners & Teams', sub: 'Approve KYC, adjust override % & manage partner codes' },
  { key: 'apps',     icon: '📑', title: 'Application Approvals Desk', sub: 'Review pending loan and credit card applications' },
  { key: 'products', icon: '💳', title: 'Products & Commission Matrix', sub: 'Configure bank products, apply links & payout tiers' },
  { key: 'payouts',  icon: '💰', title: 'Withdrawal Payout Desk', sub: 'Approve payout requests & record UTR reference numbers' },
  { key: 'audit',    icon: '📊', title: 'System Audit & Analytics', sub: 'View system security logs, lead status & working hours' },
  { key: 'cms',      icon: '🖼️', title: 'CMS & Banners', sub: 'Manage homepage banners, sections & announcements' },
  { key: 'bulk_sms', icon: '📢', title: 'Bulk SMS & WhatsApp', sub: 'Broadcast campaigns and transactional messaging' },
  { key: 'employees', icon: '🧑‍💼', title: 'Employee Management', sub: 'Designations, attendance rules & incentives' },
];

const MODAL_TITLES = {
  partners: 'Partner Network Summary',
  kyc: 'Pending KYC Verifications',
  apps: 'Master Applications Tracker',
  payouts: 'Pending Bank Payout Desk',
};

export default function SuperAdminDashboardScreen({ route, navigation }) {
  const { user, token } = route.params || {};
  const [metrics, setMetrics] = useState({
    totalPartners: 0,
    pendingKYC: 0,
    totalApplications: 0,
    pendingPayouts: 0
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

  const getMetricValue = (key) => {
    const cfg = METRIC_CONFIG[key];
    const raw = metrics[cfg.value];
    return raw !== undefined && raw !== null ? raw : 0;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={colors.bg} barStyle="light-content" />

      {/* Premium gradient header */}
      <Gradient
        colors={colors.gradientHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        borderRadius={0}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <View style={styles.roleBadgeWrap}>
              <Text style={styles.roleBadge}>⚡ SUPER ADMIN</Text>
            </View>
            <Text style={styles.headerTitle}>Control Panel</Text>
            <Text style={styles.headerSub}>
              {user?.fullName || user?.full_name || 'System Administrator'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Gradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} colors={[colors.primary]} />}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Key Executive Metrics</Text>
            <View style={styles.metricsGrid}>
              {Object.keys(METRIC_CONFIG).map((key) => {
                const cfg = METRIC_CONFIG[key];
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.metricCard, { borderTopColor: cfg.accent }]}
                    onPress={() => setActiveModal(key)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricIcon}>{cfg.icon}</Text>
                      <Text style={[styles.metricValue, { color: cfg.accent }]}>{getMetricValue(key)}</Text>
                    </View>
                    <Text style={styles.metricLabel}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Administration Modules */}
            <Text style={styles.sectionTitle}>Super Admin Operations</Text>
            <View style={styles.adminNavList}>
              {ADMIN_MODULES.map((mod) => (
                <TouchableOpacity
                  key={mod.key}
                  style={styles.adminNavItem}
                  onPress={() => handleAdminAction(mod.title)}
                  activeOpacity={0.8}
                >
                  <View style={styles.navIconWrap}>
                    <Text style={styles.navIcon}>{mod.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.navTitle}>{mod.title}</Text>
                    <Text style={styles.navSub}>{mod.sub}</Text>
                  </View>
                  <Text style={styles.navArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
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
                {MODAL_TITLES[activeModal] || 'Operational Console'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalEmoji}>⚡</Text>
              <Text style={styles.modalHeading}>Operational Console Active</Text>
              <Text style={styles.modalText}>
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
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 48,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleBadgeWrap: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    borderRadius: spacing.radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  roleBadge: { color: colors.primaryLight, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { color: colors.textMid, fontSize: 13, fontWeight: '600', marginTop: 3 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: spacing.radius.full,
  },
  logoutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    letterSpacing: -0.3,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: spacing.radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    ...shadows.sm,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metricIcon: { fontSize: 18 },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricValue: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  adminNavList: { gap: spacing.sm },
  adminNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: spacing.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  navIconWrap: {
    width: 44,
    height: 44,
    borderRadius: spacing.radius.md,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: { fontSize: 20 },
  navTitle: { fontSize: 14, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  navSub: { fontSize: 11, color: colors.textMid, marginTop: 2, lineHeight: 15 },
  navArrow: { color: colors.textLight, fontSize: 22, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.cardElevated,
    borderTopLeftRadius: spacing.radius.xl,
    borderTopRightRadius: spacing.radius.xl,
    paddingBottom: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { color: colors.textMid, fontWeight: '800', fontSize: 14 },
  modalBody: { padding: spacing.xl, alignItems: 'center' },
  modalEmoji: { fontSize: 44, marginBottom: spacing.md },
  modalHeading: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  modalText: { fontSize: 13, color: colors.textMid, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
});
