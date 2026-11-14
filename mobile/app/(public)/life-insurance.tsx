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
import { fetchLifePlans } from '../../services/cms.service';

interface HealthPlan {
  id: string;
  name: string;
  insurer: string;
  coverage: string;
  premium: string;
  features: string[];
}

export default function LifeInsuranceScreen() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<HealthPlan[]>([]);

  useEffect(() => {
    fetchLifePlans().then((res) => {
      if (res?.success) setPlans(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Life Insurance</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.hero}>
        <Icon name="shield" size={48} color="#3B82F6" />
        <Text style={styles.heroTitle}>Secure Your Family's Future</Text>
        <Text style={styles.heroSubtitle}>
          Life insurance plans to protect your loved ones financially
        </Text>
      </View>

      <View style={styles.plansList}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.centered}>
            <Icon name="info-circle" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No plans available</Text>
          </View>
        ) : (
          plans.map((plan) => (
          <Card key={plan.id} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.insurerBadge}>
                <Text style={styles.insurerText}>{plan.insurer}</Text>
              </View>
            </View>
            
            <View style={styles.planDetails}>
              <View style={styles.detailItem}>
                <Icon name="shield" size={16} color={colors.textMid} />
                <Text style={styles.detailText}>Coverage: {plan.coverage}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="credit-card" size={16} color={colors.textMid} />
                <Text style={styles.detailText}>Premium: {plan.premium}</Text>
              </View>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Key Features:</Text>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <Icon name="check" size={12} color={colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <Button
              title="Get Quote"
              style={styles.ctaButton}
              onPress={() => router.push({ pathname: '/(public)/apply', params: { productId: 'life-insurance', productName: plan.name } })}
            />
          </Card>
          ))
        )}
      </View>

      <Card style={styles.infoCard}>
        <Icon name="info-circle" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Life insurance plans are provided by our partner insurers. Compare plans and choose the best coverage for your family's future.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  hero: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  heroSubtitle: { fontSize: 14, color: colors.textMid, textAlign: 'center' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textMid,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMid,
  },
  plansList: { padding: spacing.md, gap: spacing.md },
  planCard: { padding: spacing.md },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  planName: { fontSize: 16, fontWeight: '800', color: colors.text },
  insurerBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  insurerText: { fontSize: 11, fontWeight: '700', color: '#3B82F6' },
  planDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detailText: { fontSize: 12, color: colors.textMid },
  featuresSection: { marginBottom: spacing.md },
  featuresTitle: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  featureText: { fontSize: 12, color: colors.textMid },
  ctaButton: { width: '100%' },
  infoCard: {
    margin: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoText: { flex: 1, fontSize: 12, color: colors.textMid, lineHeight: 16 },
});
