import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card, Button, LoadingState, ErrorState } from '../../components';
import { Icon } from '../../components/Icon';
import { notificationService } from '../../services/notification.service';
import { NotificationItem, NotificationPreference } from '../../types';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState<string | null>(null);

  // Mark read tracking state
  const [markingReadIds, setMarkingReadIds] = useState<Record<string, boolean>>({});
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Preferences Modal State
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const loadNotifications = useCallback(
    async (pageToLoad = 1, isRefresh = false, unreadOnlyFilter = filter === 'unread') => {
      try {
        if (pageToLoad === 1) {
          if (!isRefresh) setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const res = await notificationService.fetchNotifications({
          page: pageToLoad,
          limit: 15,
          unread_only: unreadOnlyFilter,
        });

        if (pageToLoad === 1) {
          setNotifications(res.notifications);
        } else {
          // Filter out duplicates if any
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newItems = res.notifications.filter((n) => !existingIds.has(n.id));
            return [...prev, ...newItems];
          });
        }

        setUnreadCount(res.unread_count);
        setPage(pageToLoad);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      } catch (err: any) {
        let msg = 'Failed to load notifications. Please try again.';
        if (err.response?.status === 429) {
          msg = 'Rate limit exceeded. Please wait a moment before retrying.';
        } else if (err.response?.status === 403) {
          msg = 'Access denied. You do not have permission to view notifications.';
        } else if (err.message) {
          msg = err.message;
        }
        if (pageToLoad === 1) {
          setError(msg);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    loadNotifications(1, false, filter === 'unread');
  }, [filter, loadNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications(1, true, filter === 'unread');
  };

  const handleEndReached = () => {
    if (!loadingMore && !loading && page < totalPages) {
      loadNotifications(page + 1, false, filter === 'unread');
    }
  };

  const handleMarkRead = async (item: NotificationItem) => {
    // 1. Resolve Navigation Target if available
    const appId = item.metadata?.application_id || item.application_id;
    const leadId = item.metadata?.lead_id || item.lead_id;
    const custId = item.metadata?.customer_id || item.customer_id;

    if (appId) {
      router.push({ pathname: '/application-details', params: { id: appId } });
    } else if (leadId) {
      router.push({ pathname: '/lead-details', params: { id: leadId } });
    } else if (custId) {
      router.push({ pathname: '/customer-details', params: { id: custId } });
    } else if (item.metadata?.product_id) {
      router.push('/products');
    }

    // 2. Mark Read on Backend if not already read
    if (item.is_read || markingReadIds[item.id]) return;

    setMarkingReadIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      const ok = await notificationService.markNotificationRead(item.id);
      if (ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      // Non-blocking UI error handling
    } finally {
      setMarkingReadIds((prev) => {
        const nextState = { ...prev };
        delete nextState[item.id];
        return nextState;
      });
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAllRead || unreadCount === 0) return;

    setMarkingAllRead(true);
    try {
      const ok = await notificationService.markAllNotificationsRead();
      if (ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to mark all as read');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const openPreferencesModal = async () => {
    setShowPreferences(true);
    if (!preferences) {
      setLoadingPreferences(true);
      try {
        const pref = await notificationService.fetchNotificationPreferences();
        setPreferences(pref);
      } catch (err) {
        // Fallback defaults
        setPreferences({
          email_enabled: true,
          sms_enabled: true,
          app_enabled: true,
          marketing_enabled: true,
          commission_enabled: true,
          kyc_enabled: true,
          application_enabled: true,
          language: 'en',
          frequency: 'instant',
        });
      } finally {
        setLoadingPreferences(false);
      }
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;
    setSavingPreferences(true);
    try {
      const updated = await notificationService.updateNotificationPreferences(preferences);
      setPreferences(updated);
      setShowPreferences(false);
      Alert.alert('Success', 'Notification preferences saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save preferences.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  const getCategoryBadgeColor = (category?: string) => {
    switch ((category || '').toLowerCase()) {
      case 'application':
        return { bg: '#E0F2FE', text: '#0369A1' };
      case 'kyc':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'commission':
      case 'wallet':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'lead':
        return { bg: '#F3E8FF', text: '#7E22CE' };
      default:
        return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const isUnread = !item.is_read;
    const catStyle = getCategoryBadgeColor(item.category);
    const hasNavTarget = !!(
      item.metadata?.application_id ||
      item.application_id ||
      item.metadata?.lead_id ||
      item.lead_id ||
      item.metadata?.customer_id ||
      item.customer_id ||
      item.metadata?.product_id
    );

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleMarkRead(item)}
        style={styles.touchableCard}
      >
        <Card style={isUnread ? ([styles.card, styles.unreadCard] as any) : styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              {isUnread && <View style={styles.unreadDot} />}
              {item.category ? (
                <View style={[styles.catBadge, { backgroundColor: catStyle.bg }]}>
                  <Text style={[styles.catBadgeText, { color: catStyle.text }]}>
                    {item.category.toUpperCase()}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>
                {item.title}
              </Text>
            </View>

            <Text style={styles.time}>{formatTimestamp(item.created_at)}</Text>
          </View>

          <Text style={styles.message}>{item.message}</Text>

          {hasNavTarget && (
            <View style={styles.navRow}>
              <Text style={styles.navText}>Tap to view details</Text>
              <Icon name="chevron-right" size={12} color={colors.primary} />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 ? (
              <Text style={styles.unreadSubtitle}>{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</Text>
            ) : (
              <Text style={styles.readSubtitle}>All caught up!</Text>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={openPreferencesModal}
              activeOpacity={0.7}
            >
              <Icon name="grid" size={18} color={colors.text} />
            </TouchableOpacity>

            {unreadCount > 0 && (
              <TouchableOpacity
                style={[styles.markAllBtn, markingAllRead && styles.disabledBtn]}
                onPress={handleMarkAllRead}
                disabled={markingAllRead}
                activeOpacity={0.7}
              >
                {markingAllRead ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.markAllText}>Mark all read</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.pill, filter === 'all' && styles.activePill]}
            onPress={() => setFilter('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, filter === 'all' && styles.activePillText]}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, filter === 'unread' && styles.activePill]}
            onPress={() => setFilter('unread')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, filter === 'unread' && styles.activePillText]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Loading notifications..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadNotifications(1, false, filter === 'unread')} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>
                {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'unread'
                  ? 'You have read all your notifications.'
                  : 'Important updates regarding your applications, leads, and wallet will appear here.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Preferences Modal */}
      <Modal
        visible={showPreferences}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreferences(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <TouchableOpacity onPress={() => setShowPreferences(false)}>
                <Icon name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loadingPreferences ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.modalLoadingText}>Loading preferences...</Text>
              </View>
            ) : preferences ? (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.sectionTitle}>Delivery Channels</Text>
                <View style={styles.prefRow}>
                  <View style={styles.prefTextGroup}>
                    <Text style={styles.prefLabel}>In-App Alerts</Text>
                    <Text style={styles.prefDesc}>Receive popups and badges inside the app</Text>
                  </View>
                  <Switch
                    value={preferences.app_enabled !== false}
                    onValueChange={(val) => setPreferences({ ...preferences, app_enabled: val })}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={preferences.app_enabled !== false ? colors.primary : '#F4F3F4'}
                  />
                </View>

                <View style={styles.prefRow}>
                  <View style={styles.prefTextGroup}>
                    <Text style={styles.prefLabel}>Email Notifications</Text>
                    <Text style={styles.prefDesc}>Receive daily summaries and status changes</Text>
                  </View>
                  <Switch
                    value={preferences.email_enabled !== false}
                    onValueChange={(val) => setPreferences({ ...preferences, email_enabled: val })}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={preferences.email_enabled !== false ? colors.primary : '#F4F3F4'}
                  />
                </View>

                <View style={styles.prefRow}>
                  <View style={styles.prefTextGroup}>
                    <Text style={styles.prefLabel}>SMS Alerts</Text>
                    <Text style={styles.prefDesc}>Receive urgent verification SMS codes</Text>
                  </View>
                  <Switch
                    value={preferences.sms_enabled !== false}
                    onValueChange={(val) => setPreferences({ ...preferences, sms_enabled: val })}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={preferences.sms_enabled !== false ? colors.primary : '#F4F3F4'}
                  />
                </View>

                <Text style={styles.sectionTitle}>Notification Categories</Text>
                <View style={styles.prefRow}>
                  <View style={styles.prefTextGroup}>
                    <Text style={styles.prefLabel}>Application Updates</Text>
                    <Text style={styles.prefDesc}>Status changes for submitted loan/card applications</Text>
                  </View>
                  <Switch
                    value={preferences.application_enabled !== false}
                    onValueChange={(val) => setPreferences({ ...preferences, application_enabled: val })}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={preferences.application_enabled !== false ? colors.primary : '#F4F3F4'}
                  />
                </View>

                <View style={styles.prefRow}>
                  <View style={styles.prefTextGroup}>
                    <Text style={styles.prefLabel}>KYC & Verification</Text>
                    <Text style={styles.prefDesc}>VKYC scheduling and document verification alerts</Text>
                  </View>
                  <Switch
                    value={preferences.kyc_enabled !== false}
                    onValueChange={(val) => setPreferences({ ...preferences, kyc_enabled: val })}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={preferences.kyc_enabled !== false ? colors.primary : '#F4F3F4'}
                  />
                </View>

                <View style={styles.prefRow}>
                  <View style={styles.prefTextGroup}>
                    <Text style={styles.prefLabel}>Wallet & Commission</Text>
                    <Text style={styles.prefDesc}>Payout releases, incentives, and wallet credits</Text>
                  </View>
                  <Switch
                    value={preferences.commission_enabled !== false}
                    onValueChange={(val) => setPreferences({ ...preferences, commission_enabled: val })}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={preferences.commission_enabled !== false ? colors.primary : '#F4F3F4'}
                  />
                </View>

                <View style={styles.prefRow}>
                  <View style={styles.prefTextGroup}>
                    <Text style={styles.prefLabel}>Marketing & Offers</Text>
                    <Text style={styles.prefDesc}>New product launches and special bonus campaigns</Text>
                  </View>
                  <Switch
                    value={preferences.marketing_enabled !== false}
                    onValueChange={(val) => setPreferences({ ...preferences, marketing_enabled: val })}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={preferences.marketing_enabled !== false ? colors.primary : '#F4F3F4'}
                  />
                </View>
              </ScrollView>
            ) : null}

            <View style={styles.modalFooter}>
              <Button
                title="Save Settings"
                onPress={handleSavePreferences}
                loading={savingPreferences}
                disabled={savingPreferences || loadingPreferences}
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  unreadSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  readSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  markAllText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activePill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMid,
  },
  activePillText: {
    color: '#FFFFFF',
  },
  list: {
    padding: spacing.md,
  },
  touchableCard: {
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: '#F8FAFC',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.xs,
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: typography.weights.bold,
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.textMid,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  time: {
    fontSize: 11,
    color: colors.textLight,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  navText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalLoading: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: spacing.sm,
    color: colors.textMid,
  },
  modalBody: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  prefTextGroup: {
    flex: 1,
    marginRight: spacing.md,
  },
  prefLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  prefDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
