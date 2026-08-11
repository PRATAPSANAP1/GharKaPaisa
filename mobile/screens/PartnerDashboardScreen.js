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

export default function PartnerDashboardScreen({ route, navigation }) {
  const { user, token } = route.params || {};
  const [profile, setProfile] = useState(user || {});
  const [wallet, setWallet] = useState({ available_balance: 0, hold_balance: 0, total_earned: 0 });
  const [stats, setStats] = useState({ total_leads: 0, pending_apps: 0, team_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile
      const meRes = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (meRes?.data?.user) {
        setProfile(meRes.data.user);
      }

      // 2. Fetch Wallet
      const walletRes = await axios.get(`${BASE_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (walletRes?.data?.data) {
        setWallet(walletRes.data.data);
      }

    } catch (err) {
      console.warn('Dashboard sync error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Home') }
    ]);
  };

  const kycStatus = profile?.kyc_status || 'draft';
  const isKycPending = kycStatus === 'draft' || kycStatus === 'pending';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roleTag}>{profile?.role || 'PARTNER'}</Text>
          <Text style={styles.welcomeText}>Welcome, {profile?.first_name || 'Partner'} 👋</Text>
          {profile?.partner_code && (
            <Text style={styles.codeText}>Code: {profile.partner_code}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* KYC Verification Alert Banner */}
        {isKycPending && (
          <View style={styles.kycBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kycBannerTitle}>⚡ Complete KYC Verification</Text>
              <Text style={styles.kycBannerDesc}>
                {kycStatus === 'pending'
                  ? 'Your KYC documentation is under verification.'
                  : 'Upload PAN, Bank Proof & Video to unlock full features.'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.kycActionBtn}
              onPress={() => navigation.navigate('PartnerKyc', { token, user: profile })}
            >
              <Text style={styles.kycActionText}>KYC Center</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Wallet Overview Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletTitle}>Available Earnings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Wallet', { token, user: profile })}>
              <Text style={styles.walletLink}>View Wallet →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.walletAmount}>
            ₹{parseFloat(wallet.available_balance || 0).toLocaleString('en-IN')}
          </Text>
          
          <View style={styles.walletStatsRow}>
            <View style={styles.subStat}>
              <Text style={styles.subStatLabel}>Hold Balance</Text>
              <Text style={styles.subStatVal}>₹{parseFloat(wallet.hold_balance || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.subStat}>
              <Text style={styles.subStatLabel}>Total Earned</Text>
              <Text style={styles.subStatVal}>₹{parseFloat(wallet.total_earned || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Navigation Modules Grid */}
        <Text style={styles.sectionTitle}>Partner Modules</Text>
        <View style={styles.moduleGrid}>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => navigation.navigate('Products', { token, user: profile })}
          >
            <Text style={styles.moduleIcon}>💳</Text>
            <Text style={styles.moduleTitle}>Products Catalog</Text>
            <Text style={styles.moduleSub}>Credit Cards, Loans & Insurance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => navigation.navigate('Applications', { token, user: profile })}
          >
            <Text style={styles.moduleIcon}>📋</Text>
            <Text style={styles.moduleTitle}>Applications</Text>
            <Text style={styles.moduleSub}>Track My & Team Leads</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => navigation.navigate('TeamManagement', { token, user: profile })}
          >
            <Text style={styles.moduleIcon}>👥</Text>
            <Text style={styles.moduleTitle}>Manage Team</Text>
            <Text style={styles.moduleSub}>Downlines & Override Commissions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => navigation.navigate('PartnerKyc', { token, user: profile })}
          >
            <Text style={styles.moduleIcon}>🛡️</Text>
            <Text style={styles.moduleTitle}>KYC Verification</Text>
            <Text style={styles.moduleSub}>Upload Documents & Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => navigation.navigate('Wallet', { token, user: profile })}
          >
            <Text style={styles.moduleIcon}>💰</Text>
            <Text style={styles.moduleTitle}>Wallet & Payouts</Text>
            <Text style={styles.moduleSub}>Withdraw Funds to Bank</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => navigation.navigate('Settings', { token, user: profile })}
          >
            <Text style={styles.moduleIcon}>⚙️</Text>
            <Text style={styles.moduleTitle}>Settings & Profile</Text>
            <Text style={styles.moduleSub}>Language & Account Preferences</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  roleTag: { color: '#93C5FD', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  welcomeText: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', marginTop: 2 },
  codeText: { color: '#E2E8F0', fontSize: 12, fontWeight: '600', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.18)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  logoutText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  kycBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  kycBannerTitle: { color: '#92400E', fontSize: 14, fontWeight: '800' },
  kycBannerDesc: { color: '#B45309', fontSize: 12, marginTop: 2 },
  kycActionBtn: { backgroundColor: '#F59E0B', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  kycActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  walletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletTitle: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  walletLink: { fontSize: 13, color: '#0d47a1', fontWeight: '800' },
  walletAmount: { fontSize: 28, fontWeight: '900', color: '#0F172A', marginVertical: 8 },
  walletStatsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, marginTop: 4 },
  subStat: { flex: 1, alignItems: 'center' },
  subStatLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  subStatVal: { fontSize: 15, color: '#1E293B', fontWeight: '800', marginTop: 2 },
  divider: { width: 1, backgroundColor: '#E2E8F0' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  moduleCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  moduleIcon: { fontSize: 28, marginBottom: 8 },
  moduleTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  moduleSub: { fontSize: 11, color: '#64748B', lineHeight: 14 },
});
