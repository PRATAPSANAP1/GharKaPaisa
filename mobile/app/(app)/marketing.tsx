import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMarketingMaterials } from '../../services/partner.service';

interface MarketingAsset {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  thumbnail_url?: string | null;
  created_at?: string;
}

export default function MarketingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const partnerCode = (user as any)?.partner_code || (user as any)?.employee_code || 'GKP';

  const loadAssets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchMarketingMaterials();
      setAssets(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load marketing creatives.');
      setAssets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const formatDate = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleShareAsset = async (item: MarketingAsset) => {
    try {
      const shareUrl = `https://gharkapaisa.in/apply/${partnerCode}`;
      const creativeLine = item.file_url ? `\n\nCreative: ${item.file_url}` : '';
      await Share.share({
        title: item.title,
        message: `📢 *${item.title}*\n\n${item.description}${creativeLine}\n\n👉 Apply online in 2 minutes: ${shareUrl}\n\n*Partner Reference Code:* ${partnerCode}`,
        url: item.file_url || shareUrl,
      });
    } catch (err) {
      Alert.alert('Share', 'Could not open native share dialog.');
    }
  };

  const handleOpenCreative = async (item: MarketingAsset) => {
    if (!item.file_url) {
      Alert.alert('Unavailable', 'This creative does not have a downloadable file yet.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(item.file_url);
      if (!supported) {
        Alert.alert('Unavailable', 'Cannot open this file on your device.');
        return;
      }
      await Linking.openURL(item.file_url);
    } catch (err) {
      Alert.alert('Error', 'Could not open the creative file.');
    }
  };

  const categories = ['ALL', ...Array.from(new Set(assets.map(a => a.category).filter(Boolean)))];
  const filtered = selectedCategory === 'ALL'
    ? assets
    : assets.filter(a => a.category === selectedCategory);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAssets(true)} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Marketing & Creatives</Text>
            <Text style={styles.subtitle}>Branded posters & banners to boost customer leads</Text>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Grow Your Partner Business 🚀</Text>
          <Text style={styles.heroDescription}>
            Share high-converting promotional banners directly to WhatsApp Status, Facebook Groups, and Instagram stories with your embedded partner referral code.
          </Text>
        </View>

        {/* Categories Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          {categories.map(c => {
            const isActive = selectedCategory === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.catChip, isActive && styles.catChipActive]}
                onPress={() => setSelectedCategory(c)}
              >
                <Text style={[styles.catChipText, isActive && styles.catChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Assets List */}
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>Loading marketing creatives...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.stateBox}>
            <Icon name="alert-circle" size={40} color={colors.danger} />
            <Text style={styles.stateTitle}>Could not load creatives</Text>
            <Text style={styles.stateText}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadAssets()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.stateBox}>
            <Icon name="grid" size={40} color={colors.border} />
            <Text style={styles.stateTitle}>No creatives available</Text>
            <Text style={styles.stateText}>
              {selectedCategory === 'ALL'
                ? 'Marketing creatives will appear here once uploaded by the admin team.'
                : 'No creatives found in this category.'}
            </Text>
          </View>
        ) : (
          filtered.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                {!!item.category && (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{item.category}</Text>
                  </View>
                )}
                <Text style={styles.formatText}>{formatDate(item.created_at)}</Text>
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>
              {!!item.description && <Text style={styles.cardDesc}>{item.description}</Text>}

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.typeBadge} onPress={() => handleOpenCreative(item)}>
                  <Icon name="download" size={12} color="#475569" />
                  <Text style={styles.typeBadgeText}>View Creative</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareBtn} onPress={() => handleShareAsset(item)}>
                  <Icon name="share-2" size={14} color="#FFFFFF" />
                  <Text style={styles.shareBtnText}>Share Flyer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: typography.sizes.xs,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  catRow: {
    marginBottom: spacing.md,
  },
  catChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.text,
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  formatText: {
    fontSize: 11,
    color: colors.textLight,
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  stateTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.text,
  },
  stateText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
