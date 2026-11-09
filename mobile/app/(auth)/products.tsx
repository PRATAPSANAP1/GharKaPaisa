import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import apiClient from '../../services/api';

interface ProductItem {
  id: string;
  name: string;
  bank_name: string;
  category: string;
  description: string;
  image_url?: string;
}

export default function ProductsScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>('ALL');
  const [comparisonCards, setComparisonCards] = useState<ProductItem[]>([]);

  const banks = ['ALL', 'HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'IDFC', 'Yes Bank', 'BOB'];

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (category) {
        params.category = category;
      }
      const res = await apiClient.get('/products', { params });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setProducts(res.data.data);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Network error loading products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [category]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.bank_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesBank = selectedBank === 'ALL' || 
      product.bank_name?.toLowerCase().includes(selectedBank.toLowerCase());
    
    return matchesSearch && matchesBank;
  });

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/(auth)/product-detail',
      params: { id: productId }
    });
  };

  const getCategoryTitle = () => {
    if (!category) return 'All Products';
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleAddToComparison = (product: ProductItem) => {
    if (comparisonCards.length >= 4) {
      alert('You can compare up to 4 cards at a time');
      return;
    }
    if (comparisonCards.find(c => c.id === product.id)) {
      alert('This card is already in comparison');
      return;
    }
    setComparisonCards([...comparisonCards, product]);
  };

  const handleRemoveFromComparison = (productId: string) => {
    setComparisonCards(comparisonCards.filter(c => c.id !== productId));
  };

  const isCardInComparison = (productId: string) => {
    return comparisonCards.find(c => c.id === productId);
  };

  const handleGoToComparison = () => {
    if (comparisonCards.length < 2) {
      alert('Please select at least 2 cards to compare');
      return;
    }
    router.push({
      pathname: '/(app)/card-comparison',
      params: { cards: JSON.stringify(comparisonCards) }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getCategoryTitle()}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.textMid} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Comparison Bar */}
      {comparisonCards.length > 0 && (
        <View style={[styles.comparisonBar, { backgroundColor: colors.primary }]}>
          <View style={styles.comparisonBarContent}>
            <Text style={styles.comparisonBarText}>{comparisonCards.length} cards selected</Text>
            <TouchableOpacity onPress={handleGoToComparison} style={styles.compareButton}>
              <Text style={styles.compareButtonText}>Compare Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bank Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankFilterContainer}>
        {banks.map((bank) => (
          <TouchableOpacity
            key={bank}
            style={[
              styles.bankFilterChip,
              selectedBank === bank && styles.bankFilterChipActive,
              { backgroundColor: selectedBank === bank ? colors.primary : colors.bgTertiary, borderColor: colors.border }
            ]}
            onPress={() => setSelectedBank(bank)}
          >
            <Text style={[
              styles.bankFilterText,
              { color: selectedBank === bank ? '#fff' : colors.text }
            ]}>
              {bank}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={loadProducts}
            style={styles.errorButton}
          />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="inbox" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>
            {search ? 'No products match your search' : 'No products available'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {filteredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              onPress={() => handleProductPress(product.id)}
              activeOpacity={0.7}
            >
              <Card style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View style={styles.productBadge}>
                    <Text style={styles.productBadgeText}>{product.category.replace(/_/g, ' ')}</Text>
                  </View>
                  <Text style={styles.productBank}>{product.bank_name || 'Partner Bank'}</Text>
                </View>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productDesc} numberOfLines={2}>
                  {product.description || 'Get instant approval and flexible tenure.'}
                </Text>
                <View style={styles.productFooter}>
                  <TouchableOpacity
                    onPress={() => handleAddToComparison(product)}
                    style={styles.compareButtonSmall}
                  >
                    <Icon 
                      name={isCardInComparison(product.id) ? 'check-circle' : 'plus-circle'} 
                      size={16} 
                      color={isCardInComparison(product.id) ? colors.success : colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleProductPress(product.id)} style={styles.viewDetailsButton}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Icon name="chevron-right" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.text,
  },
  bankFilterContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bankFilterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  bankFilterChipActive: {
    borderWidth: 1,
  },
  bankFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  comparisonBar: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  comparisonBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonBarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  compareButton: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  compareButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
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
    fontSize: 14,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  productCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  productBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  productBank: {
    fontSize: 11,
    color: colors.textMid,
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  productDesc: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  compareButtonSmall: {
    padding: spacing.xs,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
});
