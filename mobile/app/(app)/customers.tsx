import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card, StatusBadge, LoadingState, ErrorState } from '../../components';
import { fetchCustomers, CustomerQueryParams } from '../../services/customer.service';
import { CustomerItem } from '../../types';

const PIPELINE_STATUS_OPTIONS = ['all', 'new', 'interested', 'application_submitted', 'bank_verification', 'approved', 'rejected'];

const maskPan = (pan?: string) => {
  if (!pan || pan.length < 10) return pan || 'N/A';
  return `${pan.substring(0, 2)}XXXX${pan.substring(6)}`;
};

const maskMobile = (mobile?: string) => {
  if (!mobile || mobile.length < 10) return mobile || 'N/A';
  return `${mobile.substring(0, 2)}XXXXXX${mobile.substring(8)}`;
};

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [is429Error, setIs429Error] = useState(false);

  // Pagination & Filter state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const isFetchingRef = useRef(false);
  const searchTimeoutRef = useRef<any>(null);

  // Debounce search input (400ms)
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(text.trim());
    }, 400);
  };

  const loadCustomersData = useCallback(
    async (pageNum: number, isRefresh = false, searchVal = debouncedSearch) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);
      setIs429Error(false);

      try {
        const queryParams: CustomerQueryParams = {
          page: pageNum,
          limit: 15,
        };

        if (searchVal) queryParams.search = searchVal;
        if (selectedStatus !== 'all') queryParams.status = selectedStatus;

        const res = await fetchCustomers(queryParams);

        if (res?.success && Array.isArray(res.data)) {
          if (pageNum === 1) {
            setCustomers(res.data);
          } else {
            setCustomers(prev => [...prev, ...res.data]);
          }

          const pagination = res.pagination;
          if (pagination) {
            setHasMore(pageNum < pagination.totalPages);
          } else {
            setHasMore(res.data.length >= 15);
          }
        } else {
          setError(res?.message || 'Failed to parse customers data');
        }
      } catch (err: any) {
        if (err?.status === 429 || (typeof err?.message === 'string' && err.message.includes('429'))) {
          setIs429Error(true);
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          setError(err?.message || 'Failed to load customers');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [debouncedSearch, selectedStatus]
  );

  useEffect(() => {
    setPage(1);
    loadCustomersData(1, false);
  }, [debouncedSearch, selectedStatus, loadCustomersData]);

  const handleRefresh = () => {
    setPage(1);
    loadCustomersData(1, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || isFetchingRef.current || loading || error) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadCustomersData(nextPage, false);
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    setSearchQuery('');
    setDebouncedSearch('');
    setIsFilterModalVisible(false);
  };

  const renderCustomerCard = ({ item }: { item: CustomerItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/(app)/customer-details', params: { id: item.id } })}
    >
      <Card style={styles.customerCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.customerName}>{item.full_name}</Text>
            <Text style={styles.locationText}>
              {[item.city, item.state].filter(Boolean).join(', ') || 'Location N/A'}
            </Text>
          </View>
          <StatusBadge status={item.pipeline_status || 'new'} />
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile:</Text>
            <Text style={styles.infoValue}>{maskMobile(item.mobile)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PAN:</Text>
            <Text style={styles.infoValue}>{maskPan(item.pan_number)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Applications:</Text>
            <Text style={styles.infoValue}>
              {item.applications_count || 0} {item.latest_app_status ? `(Latest: ${item.latest_app_status})` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            Added: {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <Text style={styles.viewDetailText}>View Customer 360° →</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers Database</Text>
        <TouchableOpacity
          style={styles.filterToggleBtn}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Text style={styles.filterToggleText}>
            ⚙️ Filter {selectedStatus !== 'all' ? '(1)' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Customer Name, Mobile, PAN, City..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchBtn}
            onPress={() => {
              setSearchQuery('');
              setDebouncedSearch('');
            }}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main List / Loading / Error */}
      {loading ? (
        <LoadingState message="Loading customers records..." />
      ) : error && customers.length === 0 ? (
        <ErrorState
          message={error}
          onRetry={is429Error ? undefined : () => loadCustomersData(1, false)}
        />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={item => item.id}
          renderItem={renderCustomerCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.footerLoaderText}>Loading more customers...</Text>
              </View>
            ) : !hasMore && customers.length > 0 ? (
              <Text style={styles.endListText}>— End of Customers List —</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Customers Found</Text>
              <Text style={styles.emptySubtitle}>
                No customer records match your search or filter selections.
              </Text>
              <TouchableOpacity style={styles.resetFilterBtn} onPress={clearFilters}>
                <Text style={styles.resetFilterBtnText}>Clear Search & Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Customers</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Pipeline Status</Text>
            <View style={styles.chipContainer}>
              {PIPELINE_STATUS_OPTIONS.map(st => (
                <TouchableOpacity
                  key={st}
                  style={[styles.chip, selectedStatus === st && styles.chipActive]}
                  onPress={() => setSelectedStatus(st)}
                >
                  <Text style={[styles.chipText, selectedStatus === st && styles.chipTextActive]}>
                    {st.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setIsFilterModalVisible(false)}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  backBtnText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  filterToggleBtn: {
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterToggleText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  searchBarContainer: {
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: typography.sizes.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 4,
    borderRadius: 8,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: spacing.md + 8,
    padding: 4,
  },
  clearSearchText: {
    color: colors.textLight,
    fontSize: typography.sizes.sm,
  },
  listContent: {
    padding: spacing.md,
  },
  customerCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  customerName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  locationText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs + 2,
  },
  cardBody: {},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  infoValue: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
  },
  viewDetailText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  footerLoaderText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginLeft: spacing.xs,
  },
  endListText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  resetFilterBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 6,
  },
  resetFilterBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalCloseBtn: {
    fontSize: typography.sizes.md,
    color: colors.textLight,
  },
  filterSectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.inputBg,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textLight,
    fontWeight: typography.weights.semibold,
  },
  chipTextActive: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  clearBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    fontWeight: typography.weights.semibold,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  applyBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
});
