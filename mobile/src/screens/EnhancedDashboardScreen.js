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
  Platform,
  Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Svg } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function EnhancedDashboardScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    wallet: { available_balance: 0, hold_balance: 0, total_earned: 0 },
    applications: { total: 0, approved: 0, pending: 0, rejected: 0 },
    team: { total_members: 0, active_members: 0, total_team_earnings: 0 },
    commissions: { this_month: 0, last_month: 0, pending: 0 }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (token) {
        // Fetch wallet data
        const walletRes = await axios.get(`${BASE_URL}/wallet`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        // Fetch applications summary
        const appsRes = await axios.get(`${BASE_URL}/applications/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        // Fetch team data
        const teamRes = await axios.get(`${BASE_URL}/team/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        // Fetch commission data
        const commissionRes = await axios.get(`${BASE_URL}/commissions/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        setDashboardData({
          wallet: walletRes?.data?.data || dashboardData.wallet,
          applications: appsRes?.data?.data || dashboardData.applications,
          team: teamRes?.data?.data || dashboardData.team,
          commissions: commissionRes?.data?.data || dashboardData.commissions
        });
      }
    } catch (err) {
      console.warn('Dashboard sync note:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        navigation.replace('Home');
      }}
    ]);
  };

  const kycStatus = user?.kyc_status || 'draft';
  const isKycPending = kycStatus === 'draft' || kycStatus === 'pending';

  // Chart data for earnings (last 6 months)
  const earningsChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [12000, 15000, 18000, 14000, 22000, 25000]
    }]
  };

  // Chart data for application status
  const appStatusData = [
    {
      name: 'Approved',
      population: dashboardData.applications.approved,
      color: '#22C55E',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    },
    {
      name: 'Pending',
      population: dashboardData.applications.pending,
      color: '#F59E0B',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    },
    {
      name: 'Rejected',
      population: dashboardData.applications.rejected,
      color: '#EF4444',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.roleTag}>{user?.role || 'PARTNER'}</Text>
          <Text style={styles.welcomeText}>Welcome, {user?.first_name || 'Partner'} 👋</Text>
          {user?.partner_code && (
            <Text style={styles.codeText}>Code: {user.partner_code}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d47a1']} />
        }
      >
        {/* KYC Alert Banner */}
        {isKycPending && (
          <View style={styles.alertBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>⚡ Complete KYC Verification</Text>
              <Text style={styles.alertDesc}>
                {kycStatus === 'pending'
                  ? 'Your KYC documentation is under compliance review.'
                  : 'Upload PAN Card, Bank Proof & Video to unlock full features.'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.alertBtn}
              onPress={() => navigation.navigate('PartnerKyc')}
            >
              <Text style={styles.alertBtnText}>KYC Center</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          <KPICard
            title="Available Balance"
            value={`₹${parseFloat(dashboardData.wallet.available_balance || 0).toLocaleString('en-IN')}`}
            icon="💰"
            color="#0d47a1"
            onPress={() => navigation.navigate('Wallet')}
          />
          <KPICard
            title="Total Applications"
            value={dashboardData.applications.total}
            icon="📋"
            color="#0EA5E9"
            onPress={() => navigation.navigate('Applications')}
          />
          <KPICard
            title="Team Members"
            value={dashboardData.team.total_members}
            icon="👥"
            color="#8B5CF6"
            onPress={() => navigation.navigate('TeamManagement')}
          />
          <KPICard
            title="This Month Earnings"
            value={`₹${parseFloat(dashboardData.commissions.this_month || 0).toLocaleString('en-IN')}`}
            icon="📈"
            color="#10B981"
          />
        </View>

        {/* Earnings Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Earnings Trend (Last 6 Months)</Text>
          <LineChart
            data={earningsChartData}
            width={width - 48}
            height={200}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(13, 71, 161, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              style: { borderRadius: 16 }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Application Status Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Application Status Distribution</Text>
          <PieChart
            data={appStatusData}
            width={width - 48}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <QuickAction
            icon="💳"
            title="Products"
            subtitle="Browse catalog"
            onPress={() => navigation.navigate('Products')}
          />
          <QuickAction
            icon="📋"
            title="Applications"
            subtitle="Track leads"
            onPress={() => navigation.navigate('Applications')}
          />
          <QuickAction
            icon="👥"
            title="Team"
            subtitle="Manage members"
            onPress={() => navigation.navigate('TeamManagement')}
          />
          <QuickAction
            icon="💰"
            title="Wallet"
            subtitle="View balance"
            onPress={() => navigation.navigate('Wallet')}
          />
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <ActivityItem
            icon="💰"
            title="Commission Credited"
            subtitle="HDFC Card Lead #102"
            amount="+₹1,500"
            time="2 hours ago"
          />
          <ActivityItem
            icon="📋"
            title="New Application"
            subtitle="Axis Personal Loan"
            amount="Pending"
            time="5 hours ago"
          />
          <ActivityItem
            icon="👥"
            title="Team Member Joined"
            subtitle="Rahul Sharma"
            amount="Active"
            time="1 day ago"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const KPICard = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity style={styles.kpiCard} onPress={onPress} disabled={!onPress}>
    <View style={[styles.kpiIcon, { backgroundColor: `${color}15` }]}>
      <Text style={styles.kpiIconText}>{icon}</Text>
    </View>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiTitle}>{title}</Text>
  </TouchableOpacity>
);

const QuickAction = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

const ActivityItem = ({ icon, title, subtitle, amount, time }) => (
  <View style={styles.activityItem}>
    <View style={styles.activityIcon}>{icon}</View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.activityRight}>
      <Text style={styles.activityAmount}>{amount}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerLeft: { flex: 1 },
  roleTag: { color: '#93C5FD', fontSize: 10.5, fontWeight: '800', letterSpacing: 1 },
  welcomeText: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', marginTop: 2 },
  codeText: { color: '#E2E8F0', fontSize: 12, fontWeight: '600', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.18)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  logoutText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  alertBanner: {
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
  alertTitle: { color: '#92400E', fontSize: 14, fontWeight: '800' },
  alertDesc: { color: '#B45309', fontSize: 12, marginTop: 2 },
  alertBtn: { backgroundColor: '#F59E0B', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  alertBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiIconText: { fontSize: 20 },
  kpiValue: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  kpiTitle: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  chart: { borderRadius: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  actionCard: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionTitle: { fontSize: 11, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  actionSubtitle: { fontSize: 9, color: '#64748B', textAlign: 'center' },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    fontSize: 16,
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  activitySubtitle: { fontSize: 11, color: '#64748B', marginTop: 2 },
  activityRight: { alignItems: 'flex-end' },
  activityAmount: { fontSize: 12, fontWeight: '800', color: '#059669' },
  activityTime: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
});
