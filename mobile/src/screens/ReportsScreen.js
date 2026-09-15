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

export default function ReportsScreen({ navigation }) {
  const { user, token } = useAuth();
  const [reportData, setReportData] = useState({
    performance: {
      total_applications: 0,
      approved_applications: 0,
      conversion_rate: 0,
      average_payout: 0
    },
    earnings: {
      this_month: 0,
      last_month: 0,
      total: 0,
      monthly_breakdown: []
    },
    team: {
      total_members: 0,
      active_members: 0,
      top_performers: []
    },
    products: {
      by_category: [],
      top_products: []
    }
  });
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (token) {
        const res = await axios.get(`${BASE_URL}/reports/performance`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: selectedPeriod }
        }).catch(() => null);

        if (res?.data?.data) {
          setReportData(res.data.data);
        }
      }
    } catch (err) {
      console.warn('Report load note:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };

  // Earnings trend chart data
  const earningsChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: reportData.earnings.monthly_breakdown || [12000, 15000, 18000, 14000, 22000, 25000]
    }]
  };

  // Application status distribution
  const appStatusData = [
    {
      name: 'Approved',
      population: reportData.performance.approved_applications,
      color: '#22C55E',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    },
    {
      name: 'Pending',
      population: reportData.performance.total_applications - reportData.performance.approved_applications,
      color: '#F59E0B',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }
  ];

  // Product category distribution
  const categoryData = {
    labels: ['Credit Cards', 'Personal Loans', 'Home Loans', 'Insurance'],
    datasets: [{
      data: reportData.products.by_category || [45, 30, 15, 10]
    }]
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['this_month', 'last_month', 'last_3_months', 'this_year'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodPill, selectedPeriod === period && styles.periodPillActive]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
              {period.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d47a1']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0d47a1" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Performance Overview Cards */}
            <View style={styles.overviewGrid}>
              <StatCard
                title="Total Applications"
                value={reportData.performance.total_applications}
                icon="📋"
                color="#0d47a1"
              />
              <StatCard
                title="Approved"
                value={reportData.performance.approved_applications}
                icon="✅"
                color="#22C55E"
              />
              <StatCard
                title="Conversion Rate"
                value={`${reportData.performance.conversion_rate}%`}
                icon="📊"
                color="#F59E0B"
              />
              <StatCard
                title="Avg Payout"
                value={`₹${reportData.performance.average_payout}`}
                icon="💰"
                color="#8B5CF6"
              />
            </View>

            {/* Earnings Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Earnings Trend</Text>
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

            {/* Application Status Distribution */}
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

            {/* Product Category Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Products by Category</Text>
              <BarChart
                data={categoryData}
                width={width - 48}
                height={200}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(13, 71, 161, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                }}
                style={styles.chart}
              />
            </View>

            {/* Earnings Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Earnings Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>This Month</Text>
                  <Text style={styles.summaryValue}>₹{reportData.earnings.this_month.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Last Month</Text>
                  <Text style={styles.summaryValue}>₹{reportData.earnings.last_month.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryValue}>₹{reportData.earnings.total.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Team Performance */}
            <View style={styles.teamCard}>
              <Text style={styles.teamTitle}>Team Performance</Text>
              <View style={styles.teamStats}>
                <View style={styles.teamStat}>
                  <Text style={styles.teamStatValue}>{reportData.team.total_members}</Text>
                  <Text style={styles.teamStatLabel}>Total Members</Text>
                </View>
                <View style={styles.teamStat}>
                  <Text style={styles.teamStatValue}>{reportData.team.active_members}</Text>
                  <Text style={styles.teamStatLabel}>Active Members</Text>
                </View>
              </View>

              {reportData.team.top_performers && reportData.team.top_performers.length > 0 && (
                <View style={styles.topPerformers}>
                  <Text style={styles.topPerformersTitle}>Top Performers</Text>
                  {reportData.team.top_performers.map((performer, index) => (
                    <View key={index} style={styles.performerItem}>
                      <Text style={styles.performerRank}>#{index + 1}</Text>
                      <Text style={styles.performerName}>{performer.name}</Text>
                      <Text style={styles.performerEarnings}>₹{performer.earnings.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Top Products */}
            <View style={styles.productsCard}>
              <Text style={styles.productsTitle}>Top Performing Products</Text>
              {reportData.products.top_products && reportData.products.top_products.map((product, index) => (
                <View key={index} style={styles.productItem}>
                  <View style={styles.productRank}>
                    <Text style={styles.productRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productCategory}>{product.category}</Text>
                  </View>
                  <View style={styles.productStats}>
                    <Text style={styles.productCount}>{product.count} leads</Text>
                    <Text style={styles.productPayout}>₹{product.payout.toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Export Button */}
            <TouchableOpacity style={styles.exportBtn}>
              <Text style={styles.exportBtnText}>📥 Export Report (PDF/Excel)</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ title, value, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
      <Text style={styles.statIconText}>{icon}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  periodPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    backgroundColor: '#F1F5F9',
  },
  periodPillActive: { backgroundColor: '#0d47a1' },
  periodText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  periodTextActive: { color: '#FFFFFF' },
  scroll: { padding: 16, paddingBottom: 40 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconText: { fontSize: 20 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  statTitle: { fontSize: 11, color: '#64748B', fontWeight: '600' },
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  summaryValue: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: '#E2E8F0' },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  teamTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  teamStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  teamStat: { alignItems: 'center' },
  teamStatValue: { fontSize: 24, fontWeight: '900', color: '#0d47a1' },
  teamStatLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 4 },
  topPerformers: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  topPerformersTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  performerRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  performerName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#0F172A' },
  performerEarnings: { fontSize: 13, fontWeight: '800', color: '#059669' },
  productsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  productsTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  productRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0d47a1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productRankText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  productInfo: { flex: 1 },
  productName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  productCategory: { fontSize: 11, color: '#64748B', marginTop: 2 },
  productStats: { alignItems: 'flex-end' },
  productCount: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  productPayout: { fontSize: 12, fontWeight: '800', color: '#059669' },
  exportBtn: {
    backgroundColor: '#0d47a1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  exportBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
