import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Card } from './Card';
import { Icon } from './Icon';

interface CardItem {
  id: string;
  name: string;
  bank_name: string;
  category: string;
  description: string;
  annual_fee?: string;
  interest_rate?: string;
  rewards?: string;
  features?: string[];
}

interface CardComparisonProps {
  cards: CardItem[];
  onRemoveCard: (cardId: string) => void;
}

export default function CardComparison({ cards, onRemoveCard }: CardComparisonProps) {
  if (cards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="credit-card" size={48} color={colors.textLight} />
        <Text style={styles.emptyText}>No cards selected for comparison</Text>
        <Text style={styles.emptySubtext}>Add at least 2 cards to compare</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Compare Credit Cards</Text>
        <Text style={styles.subtitle}>{cards.length} cards selected</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsContainer}>
        {cards.map((card) => (
          <View key={card.id} style={styles.cardColumn}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardBank}>{card.bank_name}</Text>
              <TouchableOpacity onPress={() => onRemoveCard(card.id)} style={styles.removeButton}>
                <Icon name="x" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardName} numberOfLines={2}>{card.name}</Text>
            <Text style={styles.cardCategory}>{card.category.replace(/_/g, ' ')}</Text>
          </View>
        ))}
      </ScrollView>

      <Card style={styles.comparisonTable}>
        <View style={styles.row}>
          <View style={styles.labelCell}>
            <Text style={styles.label}>Annual Fee</Text>
          </View>
          {cards.map((card) => (
            <View key={card.id} style={styles.valueCell}>
              <Text style={styles.value}>{card.annual_fee || 'N/A'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.labelCell}>
            <Text style={styles.label}>Interest Rate</Text>
          </View>
          {cards.map((card) => (
            <View key={card.id} style={styles.valueCell}>
              <Text style={styles.value}>{card.interest_rate || 'N/A'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.labelCell}>
            <Text style={styles.label}>Rewards</Text>
          </View>
          {cards.map((card) => (
            <View key={card.id} style={styles.valueCell}>
              <Text style={styles.value} numberOfLines={2}>{card.rewards || 'N/A'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.labelCell}>
            <Text style={styles.label}>Key Features</Text>
          </View>
          {cards.map((card) => (
            <View key={card.id} style={styles.valueCell}>
              {card.features && card.features.length > 0 ? (
                card.features.slice(0, 3).map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Icon name="check" size={12} color={colors.success} />
                    <Text style={styles.featureText} numberOfLines={1}>{feature}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.value}>N/A</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.labelCell}>
            <Text style={styles.label}>Description</Text>
          </View>
          {cards.map((card) => (
            <View key={card.id} style={styles.valueCell}>
              <Text style={styles.value} numberOfLines={3}>{card.description || 'N/A'}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.recommendationSection}>
        <Text style={styles.recommendationTitle}>💡 Recommendation</Text>
        <Card style={styles.recommendationCard}>
          <Text style={styles.recommendationText}>
            Based on the comparison, we recommend reviewing the annual fees and rewards programs to choose the card that best fits your spending habits.
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMid,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMid,
    marginTop: spacing.xs,
  },
  cardsContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardColumn: {
    width: 200,
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardBank: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMid,
  },
  removeButton: {
    padding: 4,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardCategory: {
    fontSize: 11,
    color: colors.textMid,
  },
  comparisonTable: {
    margin: spacing.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  labelCell: {
    width: 100,
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  valueCell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  value: {
    fontSize: 12,
    color: colors.textMid,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 11,
    color: colors.textMid,
    flex: 1,
  },
  recommendationSection: {
    padding: spacing.md,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  recommendationCard: {
    padding: spacing.md,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.textMid,
    lineHeight: 20,
  },
});
