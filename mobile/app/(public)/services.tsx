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

const services = [
  {
    id: 'mobile-recharge',
    title: 'Mobile Recharge',
    icon: 'smartphone',
    color: '#3B82F6',
    description: 'Recharge any mobile operator instantly',
  },
  {
    id: 'electricity',
    title: 'Electricity Bill',
    icon: 'zap',
    color: '#F59E0B',
    description: 'Pay electricity bills for all providers',
  },
  {
    id: 'fastag',
    title: 'FASTag Recharge',
    icon: 'credit-card',
    color: '#10B981',
    description: 'Recharge FASTag for seamless travel',
  },
  {
    id: 'dth',
    title: 'DTH Recharge',
    icon: 'tv',
    color: '#8B5CF6',
    description: 'Recharge DTH services',
  },
  {
    id: 'gas',
    title: 'Gas Bill',
    icon: 'flame',
    color: '#EF4444',
    description: 'Pay gas bills online',
  },
  {
    id: 'water',
    title: 'Water Bill',
    icon: 'droplet',
    color: '#06B6D4',
    description: 'Pay water bills',
  },
  {
    id: 'broadband',
    title: 'Broadband',
    icon: 'wifi',
    color: '#6366F1',
    description: 'Pay broadband bills',
  },
  {
    id: 'loan-repayment',
    title: 'Loan Repayment',
    icon: 'arrow-up-circle',
    color: '#14B8A6',
    description: 'Repay your loans easily',
  },
];

export default function ServicesScreen() {
  const handleServicePress = (serviceId: string) => {
    // For now, show a coming soon alert
    // In production, this would navigate to the specific service page
    alert(`${serviceId} service coming soon!`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Payments & Recharge</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Pay bills and recharge instantly for all major service providers
        </Text>

        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => handleServicePress(service.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.serviceIcon, { backgroundColor: `${service.color}20` }]}>
                <Icon name={service.icon as any} size={32} color={service.color} />
              </View>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDesc} numberOfLines={2}>
                {service.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Icon name="info-circle" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Bill payment services are currently being integrated. Coming soon with support for all major service providers.
            </Text>
          </View>
        </Card>
      </View>
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
  content: {
    padding: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMid,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  serviceCard: {
    width: (160 - spacing.md),
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
  serviceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  serviceDesc: {
    fontSize: 11,
    color: colors.textMid,
    textAlign: 'center',
    lineHeight: 14,
  },
  infoCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  infoContent: {
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
