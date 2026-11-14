import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import CardComparison from '../../components/CardComparison';
import apiClient from '../../services/api';

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

const POPULAR_CARDS_FALLBACK: CardItem[] = [
  {
    id: 'hdfc-millennia',
    name: 'HDFC Millennia Credit Card',
    bank_name: 'HDFC Bank',
    category: 'Cashback',
    description: '5% cashback on Amazon, Flipkart, Swiggy & Zomato',
    annual_fee: '₹1,000 (Waived on ₹1L spend)',
    interest_rate: '3.6% per month',
    rewards: '5% Cashback on Top Merchants',
    features: ['8 Complimentary Domestic Lounge Visits', '1% Fuel Surcharge Waiver', 'Zero Liability on Lost Card'],
  },
  {
    id: 'sbi-simplyclick',
    name: 'SBI SimplyCLICK Card',
    bank_name: 'SBI Card',
    category: 'Shopping',
    description: '10X reward points on online shopping partners',
    annual_fee: '₹499 (Waived on ₹1L spend)',
    interest_rate: '3.5% per month',
    rewards: '10X Points on Partner Merchants',
    features: ['₹500 Amazon Gift Card Welcome Gift', '1% Fuel Surcharge Waiver', 'Worldwide Acceptance'],
  },
  {
    id: 'icici-amazon-pay',
    name: 'Amazon Pay ICICI Card',
    bank_name: 'ICICI Bank',
    category: 'Lifetime Free',
    description: 'Lifetime-free with 5% unlimited cashback for Prime members',
    annual_fee: 'Lifetime Free (₹0)',
    interest_rate: '3.5% per month',
    rewards: '5% Unlimited Amazon Cashback',
    features: ['Zero Annual Fee for Life', 'Direct statement cashback credits', 'No upper cap on reward earnings'],
  },
  {
    id: 'axis-ace',
    name: 'Axis Bank ACE Credit Card',
    bank_name: 'Axis Bank',
    category: 'Cashback & Utility',
    description: '5% cashback on Google Pay bill payments & DTH',
    annual_fee: '₹499 (Waived on ₹2L spend)',
    interest_rate: '3.6% per month',
    rewards: '5% on Google Pay Bill Payments',
    features: ['4 Complimentary Domestic Airport Lounge Visits', '2% Unlimited Flat Cashback on All Spends', 'Dining Delights up to 20% off'],
  },
];

export default function CardComparisonScreen() {
  const { colors } = useTheme();
  const [selectedCards, setSelectedCards] = useState<CardItem[]>([]);
  const [availableCards, setAvailableCards] = useState<CardItem[]>(POPULAR_CARDS_FALLBACK);
  const [loadingCards, setLoadingCards] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    // Load selected cards from params
    const params = router as any;
    if (params?.params?.cards) {
      try {
        const cards = JSON.parse(params.params.cards);
        if (Array.isArray(cards) && cards.length > 0) {
          setSelectedCards(cards);
        }
      } catch (e) {
        console.error('Failed to parse cards:', e);
      }
    }

    // Fetch product catalog for picker
    fetchAvailableCards();
  }, []);

  const fetchAvailableCards = async () => {
    try {
      setLoadingCards(true);
      const res = await apiClient.get('/products', { params: { category: 'credit_card', limit: '50' } });
      const list = res.data?.data || res.data;
      if (Array.isArray(list) && list.length > 0) {
        const formatted: CardItem[] = list.map((item: any) => ({
          id: String(item.id),
          name: item.name || 'Credit Card',
          bank_name: item.bank_name || item.issuer || 'Bank',
          category: item.sub_category || item.category || 'Credit Card',
          description: item.description || 'Verified credit card offer',
          annual_fee: item.annual_fee ? `₹${item.annual_fee}` : item.is_lifetime_free ? 'Lifetime Free (₹0)' : '₹499',
          interest_rate: item.interest_rate || '3.5% per month',
          rewards: item.reward_rate || 'Reward points on all purchases',
          features: Array.isArray(item.features) ? item.features : ['Airport Lounge Access', 'Fuel Surcharge Waiver', 'Contactless Tap & Pay'],
        }));
        setAvailableCards(formatted);
      }
    } catch {
      // Keep popular cards fallback
    } finally {
      setLoadingCards(false);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    setSelectedCards((cards) => cards.filter((card) => card.id !== cardId));
  };

  const handleClearAll = () => {
    setSelectedCards([]);
  };

  const toggleSelectCard = (card: CardItem) => {
    if (selectedCards.some((c) => c.id === card.id)) {
      setSelectedCards((cards) => cards.filter((c) => c.id !== card.id));
    } else {
      if (selectedCards.length >= 3) {
        setSelectedCards([selectedCards[1], selectedCards[2], card]);
      } else {
        setSelectedCards([...selectedCards, card]);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Card Comparison</Text>
        {selectedCards.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {selectedCards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="credit-card" size={56} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Compare Credit Cards</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
            Select 2 or 3 cards side-by-side to compare fees, reward points, interest rates, and airport lounge perks.
          </Text>
          <Button
            title="Choose Cards to Compare"
            onPress={() => setPickerVisible(true)}
            style={{ marginTop: 24, minWidth: 220 }}
          />
        </View>
      ) : (
        <>
          <CardComparison cards={selectedCards} onRemoveCard={handleRemoveCard} />
          <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <Button
              title={`Add / Change Cards (${selectedCards.length}/3)`}
              onPress={() => setPickerVisible(true)}
              variant="outline"
              style={styles.footerButton}
            />
          </View>
        </>
      )}

      {/* Card Selector Sheet */}
      <Modal visible={pickerVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Select Cards ({selectedCards.length}/3)</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.doneBtn}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {loadingCards ? (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textLight }]}>Loading cards catalog...</Text>
            </View>
          ) : (
            <FlatList
              data={availableCards}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const isSelected = selectedCards.some((c) => c.id === item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.cardPickerItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => toggleSelectCard(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardItemInfo}>
                      <Text style={[styles.cardItemBank, { color: colors.primary }]}>{item.bank_name}</Text>
                      <Text style={[styles.cardItemName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.cardItemFee, { color: colors.textLight }]}>Fee: {item.annual_fee}</Text>
                    </View>
                    <View
                      style={[
                        styles.checkCircle,
                        {
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {isSelected && <Icon name="check" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    width: '100%',
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  doneBtn: {
    padding: 8,
  },
  doneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  cardPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardItemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  cardItemBank: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardItemName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardItemFee: {
    fontSize: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
