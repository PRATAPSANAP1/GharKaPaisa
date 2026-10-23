import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card, Button, LoadingState, ErrorState } from '../../components';
import { Icon } from '../../components/Icon';
import { reportService } from '../../services/report.service';
import { fetchCurrentUser } from '../../services/auth.service';
import { ReportCategory, ReportFilterParams, SystemReportMetrics, UserProfile } from '../../types';

export default function ReportsScreen() {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('APPLICATIONS');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data State
  const [reportData, setReportData] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemReportMetrics | null>(null);
  const [recordCount, setRecordCount] = useState(0);

  // UI Status State
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  // Search Debounce Ref
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check Current User Role on Mount
  useEffect(() => {
    fetchCurrentUser()
      .then((res) => {
        if (res?.success && res.user) {
          setUserProfile(res.user);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Report Data when Category changes or explicitly refreshed
  const loadReport = useCallback(
    async (overrideFilters?: ReportFilterParams) => {
      // Validate Date Range if both dates provided
      if (startDate && endDate && startDate > endDate) {
        Alert.alert('Invalid Date Range', 'Start date cannot be after End date.');
        return;
      }

      setLoading(true);
      setErrorMsg(null);
      setIsForbidden(false);

      const filters: ReportFilterParams = overrideFilters || {
        search: searchQuery.trim(),
        status: statusFilter,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
      };

      try {
        let res: any;

        switch (selectedCategory) {
          case 'APPLICATIONS':
            res = await reportService.getApplicationReport(filters);
            setReportData(res.data);
            setRecordCount(res.count);
            break;
          case 'CUSTOMERS':
            res = await reportService.getCustomerReport(filters);
            setReportData(res.data);
            setRecordCount(res.count);
            break;
          case 'EMPLOYEES':
            res = await reportService.getEmployeeReport(filters);
            setReportData(res.data);
            setRecordCount(res.count);
            break;
          case 'PARTNERS':
            res = await reportService.getPartnerReport(filters);
            setReportData(res.data);
            setRecordCount(res.count);
            break;
          case 'ADMINS':
            res = await reportService.getAdminReport(filters);
            setReportData(res.data);
            setRecordCount(res.count);
            break;
          case 'SYSTEM':
            res = await reportService.getCompleteSystemReport(filters);
            setReportData(res.data);
            setRecordCount(res.count);
            if (res.metrics) {
              setSystemMetrics(res.metrics);
            }
            break;
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          setIsForbidden(true);
          setErrorMsg('Access Restricted: Reports require Admin or Super Admin permissions.');
        } else if (err.response?.status === 429) {
          setErrorMsg('Too many requests. Please wait a moment and try again.');
        } else if (err.message) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg('Failed to fetch report data. Please try again.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCategory, searchQuery, statusFilter, startDate, endDate]
  );

  useEffect(() => {
    loadReport();
  }, [selectedCategory]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReport();
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      loadReport({
        search: text.trim(),
        status: statusFilter,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
      });
    }, 400); // 400ms Debounce
  };

  const handleCategoryChange = (cat: ReportCategory) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    setReportData([]);
    setErrorMsg(null);
  };

  const handleExportExcel = () => {
    const endpoint = reportService.getExportEndpoint(selectedCategory);
    Alert.alert(
      'Export Report',
      `Excel export URL for ${selectedCategory}:\n${endpoint}\n\nDo you wish to trigger data export?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => Alert.alert('Export Started', 'Report download initiated in background.') },
      ]
    );
  };

  const renderReportCard = ({ item }: { item: any }) => {
    if (selectedCategory === 'APPLICATIONS') {
      return (
        <Card style={styles.dataCard}>
          <TouchableOpacity
            onPress={() =>
              item.application_id
                ? router.push({ pathname: '/application-details', params: { id: item.application_id } })
                : null
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.application_number || 'App Record'}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.application_status || 'PENDING'}</Text>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Customer</Text>
                <Text style={styles.metaValue}>{item.customer_name || 'N/A'}</Text>
              </View>

              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Bank & Product</Text>
                <Text style={styles.metaValue}>{`${item.bank || ''} - ${item.product || ''}`}</Text>
              </View>

              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Sanction Amount</Text>
                <Text style={styles.metaValueHighlight}>₹{Number(item.sanction_amount || 0).toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Application Date</Text>
                <Text style={styles.metaValue}>{item.application_date || 'N/A'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Card>
      );
    }

    if (selectedCategory === 'CUSTOMERS') {
      return (
        <Card style={styles.dataCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.customer_name || 'Customer'}</Text>
            <Text style={styles.cardSubTitle}>PAN: {item.pan || 'N/A'}</Text>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Mobile</Text>
              <Text style={styles.metaValue}>{item.mobile_number || 'N/A'}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>City / State</Text>
              <Text style={styles.metaValue}>{item.address || 'N/A'}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Applications</Text>
              <Text style={styles.metaValue}>{item.application_count || 0}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Total Disbursed</Text>
              <Text style={styles.metaValueHighlight}>₹{Number(item.total_loan_amount || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </Card>
      );
    }

    if (selectedCategory === 'EMPLOYEES') {
      return (
        <Card style={styles.dataCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.full_name || item.employee_name || 'Employee'}</Text>
            <Text style={styles.cardSubTitle}>{item.employee_id || 'N/A'}</Text>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Designation</Text>
              <Text style={styles.metaValue}>{item.designation || 'N/A'}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Branch</Text>
              <Text style={styles.metaValue}>{item.branch || 'Head Office'}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Applications Handled</Text>
              <Text style={styles.metaValue}>{item.total_applications || 0}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Total Business</Text>
              <Text style={styles.metaValueHighlight}>₹{Number(item.total_business || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </Card>
      );
    }

    if (selectedCategory === 'PARTNERS') {
      return (
        <Card style={styles.dataCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.partner_name || 'Partner'}</Text>
            <Text style={styles.cardSubTitle}>Code: {item.partner_code || 'N/A'}</Text>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Company / Pincode</Text>
              <Text style={styles.metaValue}>{`${item.company_name || 'N/A'} (${item.pincode || 'N/A'})`}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>KYC Status</Text>
              <Text style={styles.metaValue}>{item.kyc_status || 'PENDING'}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Applications</Text>
              <Text style={styles.metaValue}>{item.total_applications || 0}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Total Earnings</Text>
              <Text style={styles.metaValueHighlight}>₹{Number(item.total_earnings || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </Card>
      );
    }

    // Default Card Renderer
    return (
      <Card style={styles.dataCard}>
        <Text style={styles.cardTitle}>{item.name || item.full_name || item.title || 'Record'}</Text>
        <Text style={styles.cardSubTitle}>{JSON.stringify(item)}</Text>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={18} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Reports Workspace</Text>
            <Text style={styles.headerSub}>Role: {userProfile?.role || 'User'}</Text>
          </View>
        </View>

        {/* Categories Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {(['APPLICATIONS', 'CUSTOMERS', 'EMPLOYEES', 'PARTNERS', 'ADMINS', 'SYSTEM'] as ReportCategory[]).map(
            (cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, selectedCategory === cat && styles.activeCatChip]}
                onPress={() => handleCategoryChange(cat)}
              >
                <Text style={[styles.catChipText, selectedCategory === cat && styles.activeCatChipText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {/* Main Workspace */}
      <View style={styles.content}>
        {/* Filter Controls Bar */}
        <View style={styles.filterBar}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${selectedCategory.toLowerCase()}...`}
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
          </View>

          <TouchableOpacity style={styles.exportBtn} onPress={handleExportExcel} disabled={loading}>
            <Icon name="download" size={14} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>Excel</Text>
          </TouchableOpacity>
        </View>

        {/* Date Filters & Status Row */}
        <View style={styles.dateFilterRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="From: YYYY-MM-DD"
            placeholderTextColor={colors.textLight}
            value={startDate}
            onChangeText={setStartDate}
          />
          <TextInput
            style={styles.dateInput}
            placeholder="To: YYYY-MM-DD"
            placeholderTextColor={colors.textLight}
            value={endDate}
            onChangeText={setEndDate}
          />
          <TouchableOpacity style={styles.applyBtn} onPress={() => loadReport()} disabled={loading}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* System Summary KPI Cards (If SYSTEM tab selected) */}
        {selectedCategory === 'SYSTEM' && systemMetrics && (
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Volume</Text>
              <Text style={styles.kpiValue}>{systemMetrics.total_applications}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Approved</Text>
              <Text style={styles.kpiValue}>{systemMetrics.approved_applications}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Business</Text>
              <Text style={styles.kpiValueHighlight}>₹{Number(systemMetrics.total_disbursed_amount || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}

        {/* Record Count Header */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Showing {recordCount} {selectedCategory.toLowerCase()} records
          </Text>
        </View>

        {/* Error / Forbidden State */}
        {errorMsg ? (
          <ErrorState message={errorMsg} onRetry={loadReport} />
        ) : loading ? (
          <LoadingState message={`Generating ${selectedCategory.toLowerCase()} report...`} />
        ) : (
          <FlatList
            data={reportData}
            renderItem={renderReportCard}
            keyExtractor={(item, index) => item.id || item.application_id || item.customer_id || `item_${index}`}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="inbox" size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>No Report Data Available</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting search query or date range filters to view matching records.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerSub: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  catScroll: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  activeCatChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMid,
  },
  activeCatChipText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  searchBox: {
    flex: 1,
    height: 40,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  searchInput: {
    color: colors.text,
    fontSize: typography.sizes.xs,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 40,
    backgroundColor: colors.accent,
    borderRadius: 8,
    justifyContent: 'center',
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  dateInput: {
    flex: 1,
    height: 36,
    backgroundColor: colors.inputBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    fontSize: 11,
    color: colors.text,
  },
  applyBtn: {
    height: 36,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textLight,
  },
  kpiValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: 2,
  },
  kpiValueHighlight: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.accent,
    marginTop: 2,
  },
  countRow: {
    marginBottom: spacing.xs,
  },
  countText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  list: {
    paddingBottom: spacing.xl,
  },
  dataCard: {
    marginBottom: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  cardSubTitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  statusBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.xs,
  },
  metaItem: {
    width: '50%',
  },
  metaLabel: {
    fontSize: 10,
    color: colors.textLight,
  },
  metaValue: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  metaValueHighlight: {
    fontSize: typography.sizes.xs,
    color: colors.accent,
    fontWeight: typography.weights.bold,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
