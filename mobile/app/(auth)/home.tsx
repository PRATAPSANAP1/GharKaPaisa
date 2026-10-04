import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import apiClient from '../../services/api';

const { width } = Dimensions.get('window');

interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  image?: any;
}

interface ProductItem {
  id: string;
  name: string;
  bank_name: string;
  category: string;
  description: string;
  image_url?: string;
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);

  const categories: CategoryItem[] = [
    { id: 'credit_card', label: 'Credit Cards', icon: '💳' },
    { id: 'personal_loan', label: 'Personal Loan', icon: '💰' },
    { id: 'home_loan', label: 'Home Loan', icon: '🏠' },
    { id: 'business_loan', label: 'Business Loan', icon: '🏢' },
    { id: 'health_insurance', label: 'Health Insurance', icon: '🏥' },
    { id: 'life_insurance', label: 'Life Insurance', icon: '🛡️' },
    { id: 'car_loan', label: 'Car Loan', icon: '🚗' },
    { id: 'education_loan', label: 'Education Loan', icon: '🎓' },
  ];

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/products', { params: { limit: 6 } });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setFeaturedProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load featured products:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const handleCategoryPress = (category: string) => {
    router.push({
      pathname: '/(auth)/products',
      params: { category }
    });
  };

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/(auth)/product-detail',
      params: { id: productId }
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>GharKaPaisa</Text>
          <Text style={styles.heroSubtitle}>
            Your One-Stop Financial Solution for Credit Cards, Loans & Insurance
          </Text>
          <View style={styles.heroButtons}>
            <Button
              title="Get Started"
              onPress={() => router.push('/(auth)/login')}
              style={styles.heroButton}
            />
            <Button
              title="Partner With Us"
              onPress={() => router.push('/(auth)/login')}
              variant="outline"
              style={styles.heroButton}
            />
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>50+</Text>
          <Text style={styles.statLabel}>Partner Banks</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>100+</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>10K+</Text>
          <Text style={styles.statLabel}>Happy Customers</Text>
        </View>
      </View>

      {/* Categories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore Financial Products</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/products')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : featuredProducts.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => handleProductPress(product.id)}
              >
                <View style={styles.productBadge}>
                  <Text style={styles.productBadgeText}>{product.category.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.productBank}>{product.bank_name || 'Partner Bank'}</Text>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productDesc} numberOfLines={2}>
                  {product.description || 'Get instant approval and flexible tenure.'}
                </Text>
                <View style={styles.productFooter}>
                  <Text style={styles.applyText}>Apply Now</Text>
                  <Icon name="chevron-right" size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No featured products available</Text>
          </View>
        )}
      </View>

      {/* Why Choose Us */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose GharKaPaisa?</Text>
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Icon name="shield" size={32} color={colors.primary} />
            <Text style={styles.featureTitle}>100% Secure</Text>
            <Text style={styles.featureDesc}>
              Your data is protected with bank-grade encryption
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Icon name="clock" size={32} color={colors.primary} />
            <Text style={styles.featureTitle}>Fast Approval</Text>
            <Text style={styles.featureDesc}>
              Get instant approval on most credit cards and loans
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Icon name="award" size={32} color={colors.primary} />
            <Text style={styles.featureTitle}>Best Rates</Text>
            <Text style={styles.featureDesc}>
              Competitive interest rates from top banks
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Icon name="user-check" size={32} color={colors.primary} />
            <Text style={styles.featureTitle}>Expert Support</Text>
            <Text style={styles.featureDesc}>
              Dedicated support team to assist you
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <Card style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Start Your Financial Journey Today</Text>
        <Text style={styles.ctaSubtitle}>
          Join thousands of customers who trust GharKaPaisa for their financial needs
        </Text>
        <Button
          title="Create Free Account"
          onPress={() => router.push('/(auth)/login')}
          style={styles.ctaButton}
        />
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 GharKaPaisa. All rights reserved.</Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  heroSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    paddingTop: spacing.xxl,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  heroButton: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginTop: -spacing.lg,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: (width - spacing.md * 2 - spacing.sm * 3) / 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMid,
    marginTop: spacing.sm,
  },
  productCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.xs,
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
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  productDesc: {
    fontSize: 12,
    color: colors.textMid,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  applyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMid,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureCard: {
    width: (width - spacing.md * 2 - spacing.sm) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  featureDesc: {
    fontSize: 11,
    color: colors.textMid,
    textAlign: 'center',
    lineHeight: 16,
  },
  ctaCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#fff',
  },
  footer: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMid,
    marginBottom: spacing.sm,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});
