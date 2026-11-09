import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';

const insuranceTypes = [
  {
    id: 'health',
    title: 'Health Insurance',
    description: 'Comprehensive health coverage for you and your family',
    icon: 'heart-pulse',
    color: '#EF4444',
    bg: '#FEF2F2',
  },
  {
    id: 'life',
    title: 'Life Insurance',
    description: 'Secure your family\'s financial future',
    icon: 'shield',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: 'car',
    title: 'Car Insurance',
    description: 'Protect your vehicle against accidents and theft',
    icon: 'car',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    id: 'bike',
    title: 'Bike Insurance',
    description: 'Two-wheeler insurance for complete protection',
    icon: 'activity',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    id: 'travel',
    title: 'Travel Insurance',
    description: 'Safe travels with comprehensive travel coverage',
    icon: 'plane',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    id: 'home',
    title: 'Home Insurance',
    description: 'Protect your home and belongings',
    icon: 'home',
    color: '#06B6D4',
    bg: '#ECFEFF',
  },
];

export default function InsuranceScreen() {
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insurance</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.hero}>
        <Icon name="shield" size={48} color={colors.primary} />
        <Text style={styles.heroTitle}>Protect What Matters</Text>
        <Text style={styles.heroSubtitle}>
          Comprehensive insurance solutions for all your needs
        </Text>
      </View>

      <View style={styles.insuranceList}>
        {insuranceTypes.map((insurance) => (
          <TouchableOpacity
            key={insurance.id}
            onPress={() => {
              if (insurance.id === 'health') {
                router.push('/(public)/health-insurance');
              } else if (insurance.id === 'life') {
                router.push('/(public)/life-insurance');
              } else if (insurance.id === 'car') {
                router.push('/(public)/car-insurance');
              } else {
                alert(`${insurance.title} page coming soon!`);
              }
            }}
            activeOpacity={0.7}
          >
            <Card style={styles.insuranceCard}>
              <View style={[styles.iconContainer, { backgroundColor: insurance.bg }]}>
                <Icon name={insurance.icon as any} size={32} color={insurance.color} />
              </View>
              <Text style={styles.insuranceTitle}>{insurance.title}</Text>
              <Text style={styles.insuranceDesc} numberOfLines={2}>
                {insurance.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.exploreText}>Explore Plans</Text>
                <Icon name="chevron-right" size={16} color={colors.primary} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={styles.infoCard}>
        <Icon name="info-circle" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Insurance products are provided by our partner banks and insurance companies. Compare plans and choose the best coverage for your needs.
        </Text>
      </Card>
    </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
  hero: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textMid,
    textAlign: 'center',
  },
  insuranceList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  insuranceCard: {
    padding: spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  insuranceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  insuranceDesc: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  infoCard: {
    margin: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMid,
    lineHeight: 16,
  },
});
