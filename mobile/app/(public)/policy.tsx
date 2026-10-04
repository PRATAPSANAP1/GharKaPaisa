import React, { useState } from 'react';
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

const POLICIES = [
  {
    key: 'terms',
    title: 'Terms & Conditions',
    content: `1. Platform Usage\nGharKaPaisa provides financial distribution and referral tracking technology to registered partners and verified users.\n\n2. Lead Fulfillment\nAll submitted leads are processed through regulated banking partners and credit bureaus strictly in compliance with RBI guidelines.\n\n3. Partner Responsibilities\nPartners must ensure accurate customer consent is acquired before submitting financial applications. Misrepresentation or fraudulent submissions will result in immediate account termination.`,
  },
  {
    key: 'privacy',
    title: 'Privacy Policy & DPDP',
    content: `1. Data Collection\nWe collect personal identity, KYC documents, and application data solely to facilitate loan and credit card processing.\n\n2. Security Standards\nAll transmission is encrypted with 256-Bit SSL. Sensitive tokens and credentials are securely stored.\n\n3. Third-Party Sharing\nYour data is only shared with partnered financial institutions (Banks and NBFCs) for underwriting and credit verification with your explicit consent.`,
  },
  {
    key: 'refund',
    title: 'Refund & Payout Policy',
    content: `1. Commission Disbursals\nCommissions earned on approved and disbursed products are credited to the partner wallet in accordance with agreed payout cycles.\n\n2. Reversals & Adjustments\nIn the event of cancellation or fraudulent disbursal by customer, associated commission advances may be reversed.\n\n3. Wallet Settlements\nWithdrawal requests to verified bank accounts are typically settled within 24 to 48 business hours.`,
  },
];

export default function PolicyScreen() {
  const [selectedKey, setSelectedKey] = useState('terms');

  const currentPolicy = POLICIES.find((p) => p.key === selectedKey) || POLICIES[0];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>LEGAL & COMPLIANCE</Text>
          <Text style={styles.headerTitle}>Platform Policies</Text>
        </View>
      </View>

      {/* Policy Selector Pills */}
      <View style={styles.pillsRow}>
        {POLICIES.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.pill, selectedKey === p.key && styles.activePill]}
            onPress={() => setSelectedKey(p.key)}
          >
            <Text style={[styles.pillText, selectedKey === p.key && styles.activePillText]}>
              {p.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Card */}
      <Card style={styles.card}>
        <Text style={styles.policyHeading}>{currentPolicy.title}</Text>
        <Text style={styles.policyBody}>{currentPolicy.content}</Text>
      </Card>
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
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activePill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  activePillText: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  policyHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.md,
  },
  policyBody: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 22,
  },
});
