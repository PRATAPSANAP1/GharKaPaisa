import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useAuth } from '../../contexts/AuthContext';

const MARKETING_ASSETS = [
  {
    id: '1',
    title: 'HDFC Pixel Credit Card Campaign',
    category: 'Credit Cards',
    type: 'Social Media Poster',
    format: 'Square (1080x1080)',
    description: 'Promote 5% cashback on Dining, Swiggy, Zomato & Online Shopping with instant digital issuance.',
    tag: 'HIGH CONVERSION',
  },
  {
    id: '2',
    title: 'SBI Cashback & SimplyClick Special',
    category: 'Credit Cards',
    type: 'WhatsApp Story Flyer',
    format: 'Story (1080x1920)',
    description: 'Zero joining fee for eligible salaried & self-employed clients. Direct payout ₹1,800/approval.',
    tag: 'POPULAR',
  },
  {
    id: '3',
    title: 'Instant Personal Loan Low Interest Rate',
    category: 'Personal Loans',
    type: 'Flyer & Brochure',
    format: 'PDF / Image Flyer',
    description: 'Low rate starting @ 10.49% p.a. Minimal documentation & instant disbursement within 24 hours.',
    tag: 'BIG PAYOUT',
  },
  {
    id: '4',
    title: 'Family Health Insurance Comprehensive',
    category: 'Insurance',
    type: 'Infographic Pamphlet',
    format: 'Landscape Banner',
    description: 'Cashless hospital network with no medical test up to ₹1 Crore cover. Instant policy download.',
    tag: 'RECURRING',
  },
  {
    id: '5',
    title: 'Business & Micro Loan Festive Offer',
    category: 'Business Loans',
    type: 'Banner Poster',
    format: 'HD Square (1080x1080)',
    description: 'Collateral-free business expansion capital up to ₹50 Lakhs for MSME & traders.',
    tag: 'FAST TRACK',
  },
];

export default function MarketingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const partnerCode = (user as any)?.partner_code || (user as any)?.employee_code || 'GKP';

  const handleShareAsset = async (item: any) => {
    try {
      const shareUrl = `https://gharkapaisa.in/apply/${partnerCode}`;
      await Share.share({
        title: item.title,
        message: `📢 *${item.title}*\n\n${item.description}\n\n👉 Apply online in 2 minutes: ${shareUrl}\n\n*Partner Reference Code:* ${partnerCode}`,
        url: shareUrl,
      });
    } catch (err) {
      Alert.alert('Share', 'Could not open native share dialog.');
    }
  };

  const categories = ['ALL', 'Credit Cards', 'Personal Loans', 'Insurance', 'Business Loans'];
  const filtered = selectedCategory === 'ALL'
    ? MARKETING_ASSETS
    : MARKETING_ASSETS.filter(a => a.category === selectedCategory);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Marketing & Creatives</Text>
            <Text style={styles.subtitle}>Branded posters & banners to boost customer leads</Text>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Grow Your Partner Business 🚀</Text>
          <Text style={styles.heroDescription}>
            Share high-converting promotional banners directly to WhatsApp Status, Facebook Groups, and Instagram stories with your embedded partner referral code.
          </Text>
        </View>

        {/* Categories Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          {categories.map(c => {
            const isActive = selectedCategory === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.catChip, isActive && styles.catChipActive]}
                onPress={() => setSelectedCategory(c)}
              >
                <Text style={[styles.catChipText, isActive && styles.catChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Assets List */}
        {filtered.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{item.tag}</Text>
              </View>
              <Text style={styles.formatText}>{item.format}</Text>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
              <View style={styles.typeBadge}>
                <Icon name="image" size={12} color="#475569" />
                <Text style={styles.typeBadgeText}>{item.type}</Text>
              </View>

              <TouchableOpacity style={styles.shareBtn} onPress={() => handleShareAsset(item)}>
                <Icon name="share-2" size={14} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Share Flyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: typography.sizes.xs,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  catRow: {
    marginBottom: spacing.md,
  },
  catChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.text,
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  formatText: {
    fontSize: 11,
    color: colors.textLight,
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
