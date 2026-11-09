import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import apiClient from '../../services/api';

interface CardItem {
  id: string;
  name: string;
  bank_name: string;
  category: string;
  description: string;
  annual_fee?: string;
  interest_rate?: string;
  image_url?: string;
  benefits?: string[];
  eligibility?: string[];
}

const BANK_COLORS: Record<string, string> = {
  HDFC: '#003478',
  SBI: '#1C4E80',
  ICICI: '#F4661A',
  Axis: '#A01D2D',
  Kotak: '#2B2B7E',
  IDFC: '#D42728',
  'Yes Bank': '#E41F2E',
  BOB: '#1C4E80',
};

export default function BankCardsScreen() {
  const { bank } = useLocalSearchParams<{ bank?: string }>();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bankName = bank || 'ALL';
  const bankColor = BANK_COLORS[bankName] || colors.primary;

  const loadBankCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { category: 'credit_card' };
      if (bank && bank !== 'ALL') {
        params.bank_name = bank;
      }
      const res = await apiClient.get('/products', { params });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setCards(res.data.data);
      } else {
        setError('Failed to load cards');
      }
    } catch (err) {
      console.error('Failed to load bank cards:', err);
      setError('Network error loading cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBankCards();
  }, [bank]);

  const handleCardPress = (cardId: string) => {
    router.push({
      pathname: '/(auth)/product-detail',
      params: { id: cardId }
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bankColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{bankName} Credit Cards</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Bank Info */}
      <Card style={styles.bankInfoCard}>
        <View style={styles.bankInfoContent}>
          <View style={[styles.bankLogo, { backgroundColor: bankColor }]}>
            <Text style={styles.bankLogoText}>{bankName}</Text>
          </View>
          <View style={styles.bankInfoText}>
            <Text style={styles.bankInfoTitle}>Premium Credit Cards</Text>
            <Text style={styles.bankInfoSubtitle}>
              {cards.length} cards available from {bankName}
            </Text>
          </View>
        </View>
      </Card>

      {/* Cards List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={bankColor} />
          <Text style={styles.loadingText}>Loading {bankName} cards...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={loadBankCards}
            style={styles.errorButton}
          />
        </View>
      ) : cards.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="credit-card" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>No cards available from {bankName}</Text>
        </View>
      ) : (
        <View style={styles.cardsList}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              onPress={() => handleCardPress(card.id)}
              activeOpacity={0.7}
            >
              <Card style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardBadge, { backgroundColor: `${bankColor}20` }]}>
                    <Text style={[styles.cardBadgeText, { color: bankColor }]}>
                      {card.annual_fee === 'Nil' || card.annual_fee === '0' ? 'LTF' : 'PREMIUM'}
                    </Text>
                  </View>
                  <Text style={styles.cardName} numberOfLines={2}>{card.name}</Text>
                </View>
                
                <Text style={styles.cardDesc} numberOfLines={3}>
                  {card.description}
                </Text>

                {card.annual_fee && (
                  <View style={styles.cardDetail}>
                    <Icon name="credit-card" size={14} color={colors.textMid} />
                    <Text style={styles.cardDetailText}>Annual Fee: {card.annual_fee}</Text>
                  </View>
                )}

                {card.interest_rate && (
                  <View style={styles.cardDetail}>
                    <Icon name="percent" size={14} color={colors.textMid} />
                    <Text style={styles.cardDetailText}>Interest: {card.interest_rate}</Text>
                  </View>
                )}

                {card.benefits && card.benefits.length > 0 && (
                  <View style={styles.benefitsSection}>
                    <Text style={styles.benefitsTitle}>Key Benefits:</Text>
                    {card.benefits.slice(0, 3).map((benefit, idx) => (
                      <View key={idx} style={styles.benefitItem}>
                        <Icon name="check" size={12} color={colors.success} />
                        <Text style={styles.benefitText} numberOfLines={1}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Button
                    title="Apply Now"
                    onPress={() => handleCardPress(card.id)}
                    style={styles.applyButton}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  bankInfoCard: {
    margin: spacing.md,
    padding: spacing.md,
  },
  bankInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bankLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankLogoText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  bankInfoText: {
    flex: 1,
  },
  bankInfoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  bankInfoSubtitle: {
    fontSize: 14,
    color: colors.textMid,
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMid,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  errorButton: {
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  cardsList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  cardItem: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textMid,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardDetailText: {
    fontSize: 12,
    color: colors.textMid,
  },
  benefitsSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 12,
    color: colors.textMid,
    flex: 1,
  },
  cardFooter: {
    marginTop: spacing.md,
  },
  applyButton: {
    width: '100%',
  },
});
