import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { fetchBankCards } from '../../services/application.service';

const POPULAR_BANKS = [
  { slug: 'sbi', name: 'SBI Cards', color: '#1E40AF' },
  { slug: 'hdfc', name: 'HDFC Bank', color: '#004C8F' },
  { slug: 'icici', name: 'ICICI Bank', color: '#B91C1C' },
  { slug: 'axis', name: 'Axis Bank', color: '#831843' },
  { slug: 'kotak', name: 'Kotak Bank', color: '#DC2626' },
  { slug: 'indusind', name: 'IndusInd Bank', color: '#7C2D12' },
];

export default function BankCardsShowcaseScreen() {
  const params = useLocalSearchParams<{ bankSlug?: string }>();
  const [selectedBank, setSelectedBank] = useState(params.bankSlug || 'sbi');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cards, setCards] = useState<any[]>([]);

  const loadCards = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchBankCards(selectedBank);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.products)
        ? res.products
        : Array.isArray(res)
        ? res
        : [];
      setCards(list);
    } catch (err: any) {
      console.warn('Failed to load bank cards:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBank]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCards();
  };

  const activeBankObj = POPULAR_BANKS.find((b) => b.slug === selectedBank) || POPULAR_BANKS[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: activeBankObj.color }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>BANK SHOWCASE</Text>
          <Text style={styles.headerTitle}>{activeBankObj.name} Portfolio</Text>
        </View>
      </View>

      {/* Bank Selector Horizontal Scroll */}
      <View style={styles.bankScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bankScroll}>
          {POPULAR_BANKS.map((b) => (
            <TouchableOpacity
              key={b.slug}
              style={[
                styles.bankPill,
                selectedBank === b.slug && { backgroundColor: b.color, borderColor: b.color },
              ]}
              onPress={() => setSelectedBank(b.slug)}
            >
              <Text style={[styles.bankPillText, selectedBank === b.slug && styles.activeBankPillText]}>
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cards List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading {activeBankObj.name} credit cards...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {cards.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="credit-card" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Cards Available</Text>
              <Text style={styles.emptyDesc}>Check back soon for new offers from {activeBankObj.name}.</Text>
            </View>
          ) : (
            cards.map((card) => (
              <Card key={card.id} style={styles.cardCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{card.name || card.title}</Text>
                    <Text style={styles.cardCategory}>
                      {card.category || 'Lifestyle / Rewards Credit Card'}
                    </Text>
                  </View>
                  <View style={styles.feeBadge}>
                    <Text style={styles.feeText}>
                      {card.annual_fee === 0 || card.is_ltf ? 'LIFETIME FREE' : `₹${card.annual_fee || 499}/yr`}
                    </Text>
                  </View>
                </View>

                {card.benefits && (
                  <Text style={styles.benefitsText} numberOfLines={2}>
                    {card.benefits}
                  </Text>
                )}

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/(public)/card-benefits' as any,
                        params: { bankId: selectedBank, cardId: card.id },
                      })
                    }
                  >
                    <Text style={styles.detailBtnText}>View Features</Text>
                  </TouchableOpacity>

                  <Button
                    title="Apply Now"
                    onPress={() =>
                      router.push({
                        pathname: '/(public)/apply' as any,
                        params: { productId: card.id, productName: card.name },
                      })
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 8,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.md,
    padding: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0E7FF',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  bankScrollWrap: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  bankScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  bankPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  bankPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeBankPillText: {
    color: '#fff',
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.textMid,
  },
  contentList: {
    flex: 1,
    padding: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: spacing.md,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  cardCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  cardCategory: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  feeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  feeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  benefitsText: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  detailBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
  },
});
