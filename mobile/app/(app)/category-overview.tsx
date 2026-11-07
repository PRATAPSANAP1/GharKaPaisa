import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface CategoryStats {
  category: string;
  applications: number;
  approved: number;
  conversionRate: number;
  commission: number;
}

const categories = [
  { id: 'credit-card', name: 'Credit Cards', icon: '💳', color: '#3B82F6' },
  { id: 'personal-loan', name: 'Personal Loans', icon: '💰', color: '#10B981' },
  { id: 'business-loan', name: 'Business Loans', icon: '🏢', color: '#F59E0B' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', color: '#8B5CF6' },
];

// UI category -> backend `products.category` values
const CATEGORY_GROUPS: Record<string, string[]> = {
  'credit-card': ['credit_card', 'co_branded_card', 'fd_card'],
  'personal-loan': ['personal_loan'],
  'business-loan': ['business_loan'],
  'insurance': ['insurance'],
};

export default function CategoryOverviewScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CategoryStats[]>([]);

  useEffect(() => {
    fetchCategoryStats();
  }, []);

  const fetchCategoryStats = async () => {
    try {
      setLoading(true);
      // Per-product application totals (includes category / total / approved / commission)
      const response = await apiClient.get('/reports/applications-by-product');
      const rows = response.data?.data || [];

      const categoryMap = new Map<string, CategoryStats>();
      categories.forEach((cat) => {
        const keys = CATEGORY_GROUPS[cat.id] || [];
        const matched = rows.filter((r: any) =>
          keys.includes(String(r.category || '').toLowerCase())
        );
        const applications = matched.reduce((sum: number, r: any) => sum + Number(r.total || 0), 0);
        const approved = matched.reduce((sum: number, r: any) => sum + Number(r.approved || 0), 0);
        const commission = matched.reduce((sum: number, r: any) => sum + Number(r.commission || 0), 0);

        categoryMap.set(cat.id, {
          category: cat.id,
          applications,
          approved,
          conversionRate: applications > 0 ? (approved / applications) * 100 : 0,
          commission,
        });
      });

      setStats(Array.from(categoryMap.values()));
    } catch (error) {
      console.error('Failed to fetch category stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading category overview...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Category Overview</Text>
        <Text style={styles.subtitle}>Track performance by product category</Text>
      </View>

      <View style={styles.cardsContainer}>
        {categories.map((category) => {
          const categoryStat = stats.find(s => s.category === category.id);
          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { borderLeftColor: category.color }]}
              onPress={() => router.push({
                pathname: '/applications',
                params: { category: category.id }
              })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Applications</Text>
                  <Text style={styles.statValue}>
                    {categoryStat?.applications || 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Approved</Text>
                  <Text style={styles.statValue}>
                    {categoryStat?.approved || 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Conversion</Text>
                  <Text style={styles.statValue}>
                    {categoryStat?.conversionRate ? `${categoryStat.conversionRate.toFixed(1)}%` : '0%'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Commission</Text>
                  <Text style={styles.statValue}>
                    ₹{Math.round(categoryStat?.commission || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.viewDetails}>View Details →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: typography.sizes.sm,
  },
  header: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
  cardsContainer: {
    padding: 16,
    gap: 16,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  categoryName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statItem: {
    width: '50%',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  viewDetails: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
});
