import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { fetchCardBenefits } from '../../services/application.service';

export default function CardBenefitsScreen() {
  const params = useLocalSearchParams<{ cardId?: string; bankId?: string }>();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (params.cardId) {
      loadDetails();
    }
  }, [params.cardId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await fetchCardBenefits(params.cardId || '');
      setProduct(res?.data || res?.product || res);
    } catch (err: any) {
      console.warn('Failed to load card benefits:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>PRODUCT SPECIFICATION</Text>
          <Text style={styles.headerTitle}>Card Benefits & Features</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching card breakdown...</Text>
        </View>
      ) : (
        <>
          {/* Main Card Overview */}
          <Card style={styles.mainCard}>
            <Text style={styles.cardName}>{product?.name || 'Premium Credit Card'}</Text>
            <Text style={styles.bankName}>{product?.bank_name || 'Partnered Bank'}</Text>

            <View style={styles.feeRow}>
              <View style={styles.feeBox}>
                <Text style={styles.feeLabel}>Joining Fee</Text>
                <Text style={styles.feeValue}>
                  {product?.joining_fee === 0 || product?.is_ltf ? 'FREE' : `₹${product?.joining_fee || 500}`}
                </Text>
              </View>
              <View style={styles.feeBox}>
                <Text style={styles.feeLabel}>Annual Fee</Text>
                <Text style={styles.feeValue}>
                  {product?.annual_fee === 0 || product?.is_ltf ? 'LIFETIME FREE' : `₹${product?.annual_fee || 500}/yr`}
                </Text>
              </View>
            </View>
          </Card>

          {/* Key Benefits List */}
          <Card style={[styles.mainCard, { marginTop: spacing.md }]}>
            <Text style={styles.sectionHeading}>Reward Points & Cashback</Text>
            <View style={styles.benefitItem}>
              <Icon name="gift" size={18} color={colors.primaryLight} />
              <Text style={styles.benefitText}>
                {product?.reward_rate || 'Earn up to 5X reward points on online dining, grocery & utility spends.'}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="zap" size={18} color="#F59E0B" />
              <Text style={styles.benefitText}>
                1% Fuel Surcharge waiver at all petrol pumps across India.
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="award" size={18} color="#10B981" />
              <Text style={styles.benefitText}>
                Complimentary domestic airport lounge access every quarter.
              </Text>
            </View>
          </Card>

          {/* Eligibility Criteria */}
          <Card style={[styles.mainCard, { marginTop: spacing.md }]}>
            <Text style={styles.sectionHeading}>Eligibility Criteria</Text>
            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaLabel}>Age Limit</Text>
              <Text style={styles.criteriaValue}>21 - 65 Years</Text>
            </View>
            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaLabel}>Min. Monthly Income</Text>
              <Text style={styles.criteriaValue}>₹25,000 / month (Salaried)</Text>
            </View>
            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaLabel}>Required CIBIL Score</Text>
              <Text style={styles.criteriaValue}>720+ / Good credit history</Text>
            </View>
          </Card>

          <Button
            title="Instant Apply for this Card"
            onPress={() =>
              router.push({
                pathname: '/(public)/apply' as any,
                params: { productId: product?.id || params.cardId, productName: product?.name },
              })
            }
            style={{ marginTop: spacing.lg }}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.md,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.textMid,
  },
  mainCard: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  bankName: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  feeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  feeBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: spacing.sm,
    borderRadius: 10,
  },
  feeLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMid,
    lineHeight: 18,
  },
  criteriaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  criteriaLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  criteriaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
