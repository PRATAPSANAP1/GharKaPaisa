import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
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
  benefits?: string[];
}

export default function LTFCardsScreen() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLTFCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/products', { 
        params: { 
          category: 'credit_card',
          annual_fee: 'Nil' 
        } 
      });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setCards(res.data.data);
      } else {
        setError('Failed to load LTF cards');
      }
    } catch (err) {
      console.error('Failed to load LTF cards:', err);
      setError('Network error loading cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLTFCards();
  }, []);

  const handleCardPress = (cardId: string) => {
    router.push({
      pathname: '/(auth)/product-detail',
      params: { id: cardId }
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lifetime Free Cards</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.heroSection}>
        <Icon name="credit-card" size={48} color={colors.success} />
        <Text style={styles.heroTitle}>No Annual Fee Cards</Text>
        <Text style={styles.heroSubtitle}>
          Enjoy premium credit cards without any annual fees
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.success} />
          <Text style={styles.loadingText}>Loading LTF cards...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={loadLTFCards}
            style={styles.errorButton}
          />
        </View>
      ) : cards.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="credit-card" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>No LTF cards available</Text>
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
                  <View style={styles.ltfBadge}>
                    <Icon name="award" size={14} color="#fff" />
                    <Text style={styles.ltfBadgeText}>LIFETIME FREE</Text>
                  </View>
                  <Text style={styles.cardBank}>{card.bank_name}</Text>
                </View>
                
                <Text style={styles.cardName} numberOfLines={2}>{card.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={3}>
                  {card.description}
                </Text>

                {card.benefits && card.benefits.length > 0 && (
                  <View style={styles.benefitsSection}>
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

      <Card style={styles.infoCard}>
        <View style={styles.infoContent}>
          <Icon name="info-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Lifetime Free (LTF) cards have no annual fee, making them perfect for users who want to avoid maintenance costs while enjoying premium benefits.
          </Text>
        </View>
      </Card>
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  heroSection: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: spacing.sm,
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
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  ltfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ltfBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  cardBank: {
    fontSize: 12,
    color: colors.textMid,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textMid,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  benefitsSection: {
    marginBottom: spacing.md,
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
  infoCard: {
    margin: spacing.md,
    padding: spacing.md,
  },
  infoContent: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMid,
    lineHeight: 16,
  },
});
