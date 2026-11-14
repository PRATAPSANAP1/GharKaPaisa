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
import { Icon } from '../../components/Icon';
import { fetchPaymentMethods } from '../../services/cms.service';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: string;
}

export default function MoneyTransferScreen() {
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    fetchPaymentMethods().then((res) => {
      if (res?.success) setMethods(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
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
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : methods.length === 0 ? (
          <View style={styles.centered}>
            <Icon name="info-circle" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No methods</Text>
          </View>
        ) : (
          methods.map((method) => (
            <TouchableOpacity key={method.id} onPress={() => alert(`${method.name} coming soon!`)} activeOpacity={0.7}>
              <Card style={styles.transferCard}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                  <Icon name={method.icon as any} size={32} color={colors.primary} />
                </View>
                <Text style={styles.transferTitle}>{method.name}</Text>
                <Text style={styles.transferDesc} numberOfLines={2}>{method.type}</Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
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
