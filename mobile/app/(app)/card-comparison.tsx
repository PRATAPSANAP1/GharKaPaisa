import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import CardComparison from '../../components/CardComparison';

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

export default function CardComparisonScreen() {
  const { colors } = useTheme();
  const [selectedCards, setSelectedCards] = useState<CardItem[]>([]);

  useEffect(() => {
    // Load selected cards from params or storage
    const params = router as any;
    if (params?.params?.cards) {
      try {
        const cards = JSON.parse(params.params.cards);
        setSelectedCards(cards);
      } catch (e) {
        console.error('Failed to parse cards:', e);
      }
    }
  }, []);

  const handleRemoveCard = (cardId: string) => {
    setSelectedCards(cards => cards.filter(card => card.id !== cardId));
  };

  const handleClearAll = () => {
    setSelectedCards([]);
  };

  const handleAddMore = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card Comparison</Text>
        {selectedCards.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <CardComparison cards={selectedCards} onRemoveCard={handleRemoveCard} />

      {selectedCards.length > 0 && (
        <View style={styles.footer}>
          <Button
            title="Add More Cards"
            onPress={handleAddMore}
            variant="outline"
            style={styles.footerButton}
          />
        </View>
      )}
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172B43',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  footerButton: {
    width: '100%',
  },
});
