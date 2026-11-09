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

const transferTypes = [
  {
    id: 'upi',
    title: 'UPI Transfer',
    description: 'Instant money transfer using UPI ID or QR code',
    icon: 'smartphone',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: 'bank',
    title: 'Bank Transfer',
    description: 'Transfer to any bank account using IMPS/NEFT/RTGS',
    icon: 'credit-card',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    id: 'wallet',
    title: 'Wallet Transfer',
    description: 'Transfer funds between wallets',
    icon: 'wallet',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
];

export default function MoneyTransferScreen() {
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Money Transfer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.hero}>
        <Icon name="send" size={48} color={colors.primary} />
        <Text style={styles.heroTitle}>Send Money Instantly</Text>
        <Text style={styles.heroSubtitle}>
          Fast, secure, and convenient money transfer services
        </Text>
      </View>

      <View style={styles.transferList}>
        {transferTypes.map((transfer) => (
          <TouchableOpacity
            key={transfer.id}
            onPress={() => {
              alert(`${transfer.title} coming soon!`);
            }}
            activeOpacity={0.7}
          >
            <Card style={styles.transferCard}>
              <View style={[styles.iconContainer, { backgroundColor: transfer.bg }]}>
                <Icon name={transfer.icon as any} size={32} color={transfer.color} />
              </View>
              <Text style={styles.transferTitle}>{transfer.title}</Text>
              <Text style={styles.transferDesc} numberOfLines={2}>
                {transfer.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.exploreText}>Get Started</Text>
                <Icon name="chevron-right" size={16} color={colors.primary} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={styles.infoCard}>
        <Icon name="shield" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Money transfer services are powered by our banking partners. All transactions are secure and encrypted.
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
  transferList: { padding: spacing.md, gap: spacing.md },
  transferCard: { padding: spacing.md },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  transferTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  transferDesc: { fontSize: 13, color: colors.textMid, lineHeight: 18, marginBottom: spacing.md },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exploreText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  infoCard: {
    margin: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoText: { flex: 1, fontSize: 12, color: colors.textMid, lineHeight: 16 },
});
