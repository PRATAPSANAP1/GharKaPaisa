import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../../components/Icon';
import {
  fetchProductsList,
  fetchEmployeeProducts,
  generatePartnerShareLink,
} from '../../services/partner.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function ProductsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isEmployee = user?.role === 'TEAM_MEMBER' || user?.role === 'EMPLOYEE';

  const loadProducts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      let res;
      if (isEmployee) {
        res = await fetchEmployeeProducts();
      } else {
        res = await fetchProductsList();
      }

      const list = Array.isArray(res) ? res : res.data || res.products || [];
      setProducts(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load products list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isEmployee]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleShareProduct = async (item: any) => {
    try {
      let shareUrl = item.referral_url || item.share_url;

      // If Partner and no referral_url attached yet, generate via backend endpoint
      if (!shareUrl && !isEmployee) {
        const genRes = await generatePartnerShareLink(item.id || item.product_id);
        if (genRes.success && genRes.shareUrl) {
          shareUrl = genRes.shareUrl;
        }
      }

      if (!shareUrl) {
        shareUrl = `https://gharkapaisa.in/apply/${item.id || item.product_id}`;
      }

      await Share.share({
        title: item.name || item.product_name || 'GharKaPaisa Product',
        message: `Apply for ${item.name || item.product_name || 'Credit Card'} on GharKaPaisa: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (shareErr: any) {
      Alert.alert('Share', 'Could not open share dialog.');
    }
  };

  const renderProductCard = ({ item }: { item: any }) => {
    const pId = item.id || item.product_id;
    const name = item.name || item.product_name || 'Credit Card';
    const bankName = item.bank_name || 'Partner Bank';
    const reward = item.base_incentive || item.commission_amount || item.payout || null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.bankBadge}>
            <Icon name="shield" size={12} color="#2563EB" />
            <Text style={styles.bankBadgeText}>{bankName}</Text>
          </View>
          {reward ? (
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardText}>Earn up to ₹{reward}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.productTitle}>{name}</Text>
        {item.description ? (
          <Text style={styles.productDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => router.push(`/add-lead?product_id=${pId}`)}
          >
            <Icon name="user-plus" size={14} color="#2563EB" />
            <Text style={styles.detailBtnText}>Punch Lead</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={() => handleShareProduct(item)}>
            <Icon name="share-2" size={14} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share Link</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Text style={styles.title}>Products Catalog</Text>
        <Text style={styles.subtitle}>Authorized financial products & referral links</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) => item.id || item.product_id || String(index)}
          renderItem={renderProductCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadProducts(true)} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="inbox" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>No available products found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: '#64748B',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bankBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    marginLeft: 4,
  },
  rewardBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  productTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: '#0F172A',
    marginVertical: 4,
  },
  productDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: '48%',
    justifyContent: 'center',
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 4,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: '48%',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: '#64748B',
  },
});
