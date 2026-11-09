import React, { useState, useRef } from 'react';
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
import { Gradient } from '../../components/Gradient';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const banners = [
    {
      id: 1,
      title: 'Instant Credit Cards',
      subtitle: 'Get approved in minutes',
      color: '#1B74BB',
      gradient: ['#1B74BB', '#0851A1'],
    },
    {
      id: 2,
      title: 'Low Interest Loans',
      subtitle: 'Starting from 10.99% p.a.',
      color: '#9CD83D',
      gradient: ['#9CD83D', '#7BC32E'],
    },
    {
      id: 3,
      title: 'Zero Annual Fee Cards',
      subtitle: 'Lifetime free credit cards',
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706'],
    },
  ];

  const scrollToBanner = (index: number) => {
    setCurrentBannerIndex(index);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentBannerIndex(index);
  };

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
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Hero Banner Carousel */}
      <View style={styles.bannerContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {banners.map((banner) => (
            <View key={banner.id} style={[styles.bannerSlide, { width, backgroundColor: banner.gradient[0] }]}>
              <Gradient
                colors={banner.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  <Button
                    title="Apply Now"
                    onPress={() => router.push('/(auth)/products')}
                    style={styles.bannerButton}
                  />
                </View>
              </Gradient>
            </View>
          ))}
        </ScrollView>
        
        {/* Banner Indicators */}
        <View style={styles.bannerIndicators}>
          {banners.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                currentBannerIndex === index && styles.activeIndicator
              ]}
              onPress={() => scrollToBanner(index)}
            />
          ))}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
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

      {/* Popular Cards Carousel */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Credit Cards</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/products')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All →</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featuredProducts.slice(0, 5).map((product) => (
            <TouchableOpacity
              key={product.id}
              style={[styles.popularCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleProductPress(product.id)}
            >
              <View style={[styles.popularBadge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.popularBadgeText, { color: colors.primary }]}>POPULAR</Text>
              </View>
              <Text style={[styles.popularBank, { color: colors.textMid }]}>{product.bank_name || 'Partner Bank'}</Text>
              <Text style={[styles.popularName, { color: colors.text }]} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={[styles.popularDesc, { color: colors.textMid }]} numberOfLines={2}>
                {product.description || 'Get instant approval and flexible tenure.'}
              </Text>
              <View style={[styles.popularFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.popularApplyText, { color: colors.primary }]}>Apply Now</Text>
                <Icon name="chevron-right" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bank Partners Logos */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Partner Banks</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bankLogosContainer}>
          {['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'IDFC', 'Yes Bank', 'BOB'].map((bank) => (
            <TouchableOpacity 
              key={bank} 
              style={styles.bankLogoItem}
              onPress={() => router.push({ pathname: '/(auth)/bank-cards', params: { bank } })}
            >
              <View style={[styles.bankLogoBadge, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}>
                <Text style={[styles.bankLogoText, { color: colors.text }]}>{bank}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Categories Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore Financial Products</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[styles.categoryLabel, { color: colors.text }]}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Tools */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Tools</Text>
        <View style={styles.quickToolsRow}>
          <TouchableOpacity
            style={[styles.quickToolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(app)/loan-calculator')}
          >
            <Icon name="calculator" size={24} color={colors.primary} />
            <Text style={[styles.quickToolText, { color: colors.text }]}>Loan Calculator</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickToolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(public)/travel-booking')}
          >
            <Icon name="map" size={24} color={colors.warning} />
            <Text style={[styles.quickToolText, { color: colors.text }]}>Travel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickToolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(public)/insurance')}
          >
            <Icon name="shield" size={24} color={colors.error} />
            <Text style={[styles.quickToolText, { color: colors.text }]}>Insurance</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Products</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/products')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMid }]}>Loading products...</Text>
          </View>
        ) : featuredProducts.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleProductPress(product.id)}
              >
                <View style={[styles.productBadge, { backgroundColor: colors.accentLight }]}>
                  <Text style={[styles.productBadgeText, { color: colors.accentDark }]}>{product.category.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={[styles.productBank, { color: colors.textLight }]}>{product.bank_name || 'Partner Bank'}</Text>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={[styles.productDesc, { color: colors.textMid }]} numberOfLines={2}>
                  {product.description || 'Get instant approval and flexible tenure.'}
                </Text>
                <View style={[styles.productFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.applyText, { color: colors.primary }]}>Apply Now</Text>
                  <Icon name="chevron-right" size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMid }]}>No featured products available</Text>
          </View>
        )}
      </View>

      {/* Why Choose Us */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Why Choose GharKaPaisa?</Text>
        <View style={styles.featuresGrid}>
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="shield" size={32} color={colors.primary} />
            <Text style={[styles.featureTitle, { color: colors.text }]}>100% Secure</Text>
            <Text style={[styles.featureDesc, { color: colors.textMid }]}>
              Your data is protected with bank-grade encryption
            </Text>
          </View>
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="clock" size={32} color={colors.primary} />
            <Text style={[styles.featureTitle, { color: colors.text }]}>Fast Approval</Text>
            <Text style={[styles.featureDesc, { color: colors.textMid }]}>
              Get instant approval on most credit cards and loans
            </Text>
          </View>
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="award" size={32} color={colors.primary} />
            <Text style={[styles.featureTitle, { color: colors.text }]}>Best Rates</Text>
            <Text style={[styles.featureDesc, { color: colors.textMid }]}>
              Competitive interest rates from top banks
            </Text>
          </View>
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="user-check" size={32} color={colors.primary} />
            <Text style={[styles.featureTitle, { color: colors.text }]}>Expert Support</Text>
            <Text style={[styles.featureDesc, { color: colors.textMid }]}>
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

      {/* Customer Quick Self-Service */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Services</Text>
        <View style={styles.serviceRow}>
          <TouchableOpacity
            style={styles.serviceBtn}
            onPress={() => router.push('/(public)/track-application' as any)}
          >
            <Icon name="search" size={20} color={colors.primaryLight} />
            <Text style={styles.serviceBtnText}>Track Application</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.serviceBtn}
            onPress={() => router.push('/(public)/chatbot' as any)}
          >
            <Icon name="bot" size={20} color={colors.primaryLight} />
            <Text style={styles.serviceBtnText}>AI Assistant</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.serviceBtn}
            onPress={() => router.push('/(public)/contact' as any)}
          >
            <Icon name="headphones" size={20} color={colors.primaryLight} />
            <Text style={styles.serviceBtnText}>Helpline</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 OIT_Stack All Rights Reserved.</Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/(public)/policy' as any)}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(public)/policy' as any)}>
            <Text style={styles.footerLink}>Terms & Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(public)/contact' as any)}>
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
  bannerContainer: {
    height: 200,
    position: 'relative',
  },
  bannerSlide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  bannerButton: {
    width: 140,
  },
  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 20,
  },
  popularCard: {
    width: 220,
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  popularBank: {
    fontSize: 11,
    color: colors.textMid,
    marginBottom: 4,
  },
  popularName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  popularDesc: {
    fontSize: 12,
    color: colors.textMid,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  popularFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  popularApplyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
  bankLogosContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  bankLogoItem: {
    marginRight: spacing.md,
  },
  bankLogoBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  bankLogoText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginTop: -spacing.lg,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
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
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  quickToolsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickToolCard: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickToolText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
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
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
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
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: colors.bgSecondary,
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
  serviceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  serviceBtn: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.xs,
  },
  serviceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
});
