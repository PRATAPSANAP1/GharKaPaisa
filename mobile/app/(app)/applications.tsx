import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card, Input, Button, StatusBadge, LoadingState, ErrorState } from '../../components';
import { fetchApplications, ApplicationQueryParams } from '../../services/application.service';
import { ApplicationItem } from '../../types';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Details Submitted', value: 'details_submitted' },
  { label: 'Operational Verified', value: 'operational_verified' },
  { label: 'Approved', value: 'approved' },
  { label: 'Commission Received', value: 'commission_received' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

const CATEGORY_OPTIONS = [
  { label: 'All Categories', value: '' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Personal Loan', value: 'personal_loan' },
  { label: 'Business Loan', value: 'business_loan' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Utility', value: 'utility' },
];

const PERIOD_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Month', value: 'this_month' },
];

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [is429Error, setIs429Error] = useState(false);

  // Search & Filters State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Temporary Filter State inside Modal
  const [tempStatus, setTempStatus] = useState('');
  const [tempCategory, setTempCategory] = useState('');
  const [tempPeriod, setTempPeriod] = useState('all');

  // Pagination Guards
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const isFetchingRef = useRef(false);

  // Search Debounce (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Main Data Loading Function
  const loadData = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (pageNum === 1 && !isRefresh) {
        setLoading(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      }

      setError(null);
      setIs429Error(false);

      const params: ApplicationQueryParams = {
        page: pageNum,
        limit: 15,
        search: debouncedSearch.trim() || undefined,
        status: selectedStatus || undefined,
        category: selectedCategory || undefined,
        period: selectedPeriod !== 'all' ? selectedPeriod : undefined,
      };

      try {
        const res = await fetchApplications(params);
        if (res?.success) {
          const list: ApplicationItem[] = res.data || [];
          const totalP = res.pagination?.totalPages || 1;

          setApplications(prev => (pageNum === 1 ? list : [...prev, ...list]));
          setPage(pageNum);
          setTotalPages(totalP);
          setHasMore(pageNum < totalP);
        } else {
          setError(res?.message || 'Failed to load applications');
        }
      } catch (err: any) {
        const isRateLimit =
          err?.status === 429 ||
          err?.statusCode === 429 ||
          (typeof err?.message === 'string' && err.message.includes('429'));

        if (isRateLimit) {
          setIs429Error(true);
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          setError(err?.message || 'Failed to load applications');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [debouncedSearch, selectedStatus, selectedCategory, selectedPeriod]
  );

  // Trigger Reload on Filter / Debounced Search change
  useEffect(() => {
    loadData(1);
  }, [debouncedSearch, selectedStatus, selectedCategory, selectedPeriod]);

  // Pull-to-Refresh
  const handleRefresh = () => {
    if (isFetchingRef.current) return;
    setRefreshing(true);
    loadData(1, true);
  };

  // Guarded Load More Pagination
  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore && !isFetchingRef.current) {
      loadData(page + 1);
    }
  };

  // Filter Modal Actions
  const openFilterModal = () => {
    setTempStatus(selectedStatus);
    setTempCategory(selectedCategory);
    setTempPeriod(selectedPeriod);
    setFilterModalVisible(true);
  };

  const applyFilters = () => {
    setSelectedStatus(tempStatus);
    setSelectedCategory(tempCategory);
    setSelectedPeriod(tempPeriod);
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedStatus('');
    setSelectedCategory('');
    setSelectedPeriod('all');
    setTempStatus('');
    setTempCategory('');
    setTempPeriod('all');
    setFilterModalVisible(false);
  };

  const activeFilterCount =
    (selectedStatus ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedPeriod !== 'all' ? 1 : 0);

  // Application Card Component
  const renderItem = ({ item }: { item: ApplicationItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/(app)/application-details',
          params: { id: item.id },
        })
      }
    >
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.appNumber}>{item.app_number}</Text>
          <StatusBadge status={item.status || 'Pending'} />
        </View>

        <Text style={styles.customerName}>{item.customer_name || 'Customer'}</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bank / Product:</Text>
          <Text style={styles.detailValue}>
            {item.bank_name || 'Bank'} • {item.product_name || item.product_type || 'Credit Card'}
          </Text>
        </View>

        {item.bank_application_number ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bank App #:</Text>
            <Text style={styles.detailValue}>{item.bank_application_number}</Text>
          </View>
        ) : null}

        {item.final_status ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Final Status:</Text>
            <Text style={styles.finalStatus}>{item.final_status}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            Updated: {new Date(item.updated_at || item.created_at).toLocaleDateString()}
          </Text>
          <Text style={styles.viewLink}>View Details →</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Footer Component for Pagination Loader
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerLoaderText}>Loading more applications...</Text>
        </View>
      );
    }
    if (!hasMore && applications.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Text style={styles.footerEndText}>All applications loaded ({applications.length})</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Applications Queue</Text>
        
        <View style={styles.searchRow}>
          <Input
            placeholder="Search App #, Name, Mobile, Bank #..."
            value={searchInput}
            onChangeText={setSearchInput}
            style={styles.searchInput}
          />
          <TouchableOpacity
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
            onPress={openFilterModal}
          >
            <Text style={[styles.filterBtnText, activeFilterCount > 0 && styles.filterBtnTextActive]}>
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {loading && page === 1 ? (
        <LoadingState message="Fetching applications queue..." />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={is429Error ? undefined : () => loadData(1)}
        />
      ) : (
        <FlatList
          data={applications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No applications found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search criteria or active filters.
              </Text>
              {(activeFilterCount > 0 || searchInput) && (
                <Button
                  title="Clear Filters"
                  onPress={clearFilters}
                  variant="outline"
                  style={{ marginTop: spacing.md }}
                />
              )}
            </View>
          }
        />
      )}

      {/* Mobile Bottom Sheet Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Applications</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Status Section */}
              <Text style={styles.filterGroupTitle}>Application Status</Text>
              <View style={styles.chipContainer}>
                {STATUS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      tempStatus === opt.value && styles.chipActive,
                    ]}
                    onPress={() => setTempStatus(opt.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        tempStatus === opt.value && styles.chipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Section */}
              <Text style={styles.filterGroupTitle}>Product Category</Text>
              <View style={styles.chipContainer}>
                {CATEGORY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      tempCategory === opt.value && styles.chipActive,
                    ]}
                    onPress={() => setTempCategory(opt.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        tempCategory === opt.value && styles.chipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Period Section */}
              <Text style={styles.filterGroupTitle}>Date Period</Text>
              <View style={styles.chipContainer}>
                {PERIOD_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      tempPeriod === opt.value && styles.chipActive,
                    ]}
                    onPress={() => setTempPeriod(opt.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        tempPeriod === opt.value && styles.chipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Reset"
                onPress={clearFilters}
                variant="outline"
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title="Apply Filters"
                onPress={applyFilters}
                variant="primary"
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: spacing.xs,
  },
  filterBtn: {
    height: 48,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  filterBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMid,
  },
  filterBtnTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  appNumber: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  customerName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  detailValue: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
    fontWeight: typography.weights.semibold,
  },
  finalStatus: {
    fontSize: typography.sizes.xs,
    color: colors.gold,
    fontWeight: typography.weights.bold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  viewLink: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  footerLoaderText: {
    marginLeft: spacing.xs,
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  footerEnd: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerEndText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textLight,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  /* Filter Bottom Sheet Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalCloseText: {
    fontSize: typography.sizes.lg,
    color: colors.textLight,
    padding: 4,
  },
  modalBody: {
    paddingVertical: spacing.md,
  },
  filterGroupTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textMid,
    marginBottom: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
