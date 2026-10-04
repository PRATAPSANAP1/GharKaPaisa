import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import apiClient from '../../services/api';

interface ProductDetail {
  id: string;
  name: string;
  bank_name: string;
  category: string;
  description: string;
  features: string[];
  eligibility: string[];
  documents_required: string[];
  image_url?: string;
  interest_rate?: string;
  processing_fee?: string;
  max_amount?: string;
  tenure?: string;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProductDetail(id);
    }
  }, [id]);

  const loadProductDetail = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/products/${productId}`);
      if (res.data?.success && res.data?.data) {
        setProduct(res.data.data);
      } else {
        setError('Failed to load product details');
      }
    } catch (err) {
      console.error('Failed to load product:', err);
      setError('Network error loading product details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    Alert.alert(
      'Apply for Product',
      'You need to login or register to apply for this product.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Product Info Card */}
      <Card style={styles.productCard}>
        <View style={styles.productBadge}>
          <Text style={styles.productBadgeText}>{product.category.replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.productBank}>{product.bank_name || 'Partner Bank'}</Text>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDesc}>{product.description}</Text>

        {product.interest_rate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Interest Rate:</Text>
            <Text style={styles.infoValue}>{product.interest_rate}</Text>
          </View>
        )}
        {product.processing_fee && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Processing Fee:</Text>
            <Text style={styles.infoValue}>{product.processing_fee}</Text>
          </View>
        )}
        {product.max_amount && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Max Amount:</Text>
            <Text style={styles.infoValue}>{product.max_amount}</Text>
          </View>
        )}
        {product.tenure && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tenure:</Text>
            <Text style={styles.infoValue}>{product.tenure}</Text>
          </View>
        )}
      </Card>

      {/* Features */}
      {product.features && product.features.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <Card style={styles.listCard}>
            {product.features.map((feature, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="check-circle" size={16} color={colors.success} />
                <Text style={styles.listItemText}>{feature}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Eligibility */}
      {product.eligibility && product.eligibility.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eligibility Criteria</Text>
          <Card style={styles.listCard}>
            {product.eligibility.map((criteria, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="user-check" size={16} color={colors.primary} />
                <Text style={styles.listItemText}>{criteria}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Documents Required */}
      {product.documents_required && product.documents_required.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents Required</Text>
          <Card style={styles.listCard}>
            {product.documents_required.map((doc, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="file-text" size={16} color={colors.warning} />
                <Text style={styles.listItemText}>{doc}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Apply Button */}
      <View style={styles.ctaContainer}>
        <Button
          title="Apply Now"
          onPress={handleApply}
          style={styles.applyButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
  productCard: {
    margin: spacing.md,
    padding: spacing.lg,
  },
  productBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  productBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  productBank: {
    fontSize: 13,
    color: colors.textMid,
    marginBottom: spacing.xs,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  productDesc: {
    fontSize: 14,
    color: colors.textMid,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMid,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  listCard: {
    padding: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  listItemText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  ctaContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  applyButton: {
    paddingVertical: spacing.md,
  },
});
