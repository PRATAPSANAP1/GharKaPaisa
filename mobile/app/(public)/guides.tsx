import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Share,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { fetchGuides } from '../../services/cms.service';

interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  icon: string;
}

export default function GuidesScreen() {
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  useEffect(() => {
    fetchGuides().then((res) => {
      if (res?.success) setGuides(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleShareGuide = async (guide: Guide) => {
    try {
      await Share.share({
        title: guide.title,
        message: `${guide.title}\n\n${guide.description}\n\nRead more financial guides on GharKaPaisa: https://gharkapaisa.in/guides`,
      });
    } catch {}
  };

  const categories = ['ALL', ...Array.from(new Set(guides.map(g => g.category)))];

  const filteredGuides = selectedCategory === 'ALL'
    ? guides
    : guides.filter(g => g.category === selectedCategory);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guides & Tutorials</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.hero}>
        <Icon name="book-open" size={48} color={colors.primary} />
        <Text style={styles.heroTitle}>Learn with GharKaPaisa</Text>
        <Text style={styles.heroSubtitle}>
          Step-by-step guides to help you make informed financial decisions
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
              {
                backgroundColor: selectedCategory === category ? colors.primary : colors.card,
                borderColor: selectedCategory === category ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: selectedCategory === category ? '#fff' : colors.text },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Guides List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading guides...</Text>
        </View>
      ) : filteredGuides.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="info-circle" size={48} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No guides available</Text>
        </View>
      ) : (
        <View style={styles.guidesList}>
          {filteredGuides.map(guide => (
          <TouchableOpacity
            key={guide.id}
            onPress={() => setSelectedGuide(guide)}
            activeOpacity={0.7}
          >
            <Card style={styles.guideCard}>
              <View style={styles.guideHeader}>
                <View style={[styles.guideIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <Icon name={guide.icon as any} size={24} color={colors.primary} />
                </View>
                <View style={styles.guideCategory}>
                  <Text style={styles.categoryText}>{guide.category}</Text>
                  <View style={styles.durationBadge}>
                    <Icon name="clock" size={12} color={colors.textMid} />
                    <Text style={styles.durationText}>{guide.duration}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.guideTitle}>{guide.title}</Text>
              <Text style={styles.guideDescription} numberOfLines={2}>
                {guide.description}
              </Text>
              <View style={styles.guideFooter}>
                <Text style={styles.readMoreText}>Read Guide</Text>
                <Icon name="chevron-right" size={16} color={colors.primary} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
        </View>
      )}

      {/* Tips Card */}
      <Card style={styles.tipsCard}>
        <Icon name="lightbulb" size={24} color={colors.warning} />
        <Text style={styles.tipsTitle}>Pro Tip</Text>
        <Text style={styles.tipsText}>
          Start with "Getting Started" guides if you're new to credit cards and loans.
        </Text>
      </Card>

      {/* Full Guide Detail Reader Modal */}
      <Modal visible={!!selectedGuide} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedGuide(null)} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {selectedGuide?.category || 'Financial Guide'}
            </Text>
            {selectedGuide && (
              <TouchableOpacity onPress={() => handleShareGuide(selectedGuide)} style={styles.shareBtn}>
                <Icon name="share" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedGuide && (
              <>
                <View style={styles.readerMetaRow}>
                  <View style={styles.readerPill}>
                    <Text style={styles.readerPillText}>{selectedGuide.category}</Text>
                  </View>
                  <View style={styles.readerDuration}>
                    <Icon name="clock" size={13} color={colors.textMid} />
                    <Text style={styles.readerDurationText}>{selectedGuide.duration} Read</Text>
                  </View>
                </View>

                <Text style={styles.readerTitle}>{selectedGuide.title}</Text>
                <Text style={styles.readerIntro}>{selectedGuide.description}</Text>

                <Card style={styles.sectionBlock}>
                  <Text style={styles.sectionHeading}>🎯 Key Objectives & Summary</Text>
                  <Text style={styles.sectionBody}>
                    Understanding this topic empowers you to build optimal creditworthiness, avoid costly hidden charges,
                    and maximize financial rewards on verified banking products across India.
                  </Text>
                </Card>

                <Card style={styles.sectionBlock}>
                  <Text style={styles.sectionHeading}>📋 Step-by-Step Recommendations</Text>
                  <View style={styles.stepItem}>
                    <Text style={styles.stepNum}>1</Text>
                    <Text style={styles.stepText}>
                      Always review eligibility criteria including age, minimum income, and credit score (CIBIL 750+) before applying.
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <Text style={styles.stepNum}>2</Text>
                    <Text style={styles.stepText}>
                      Compare lifetime-free options with fee-based reward cards to ensure your spending pattern generates net-positive value.
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <Text style={styles.stepNum}>3</Text>
                    <Text style={styles.stepText}>
                      Set up auto-debit for full credit card statement payments to avoid 3.5%-4% monthly interest charges and late fees.
                    </Text>
                  </View>
                </Card>

                <Card style={[styles.sectionBlock, { backgroundColor: '#FEF3C720', borderColor: '#F59E0B40' }]}>
                  <Text style={[styles.sectionHeading, { color: '#D97706' }]}>⚠️ Common Traps to Avoid</Text>
                  <Text style={styles.sectionBody}>
                    • Never withdraw cash from ATMs using a credit card (cash advance charges accrue daily from day one).{'\n'}
                    • Don't apply for multiple credit cards within short windows (each triggers a hard CIBIL pull).{'\n'}
                    • Maintain credit utilization ratio under 30% of total limit for rapid score improvement.
                  </Text>
                </Card>

                <View style={styles.readerActions}>
                  <Button
                    title="Check My Card Offers"
                    onPress={() => {
                      setSelectedGuide(null);
                      router.push('/(public)/apply' as any);
                    }}
                    style={{ marginBottom: spacing.sm }}
                  />
                  <Button
                    title="Compare Card Benefits"
                    variant="outline"
                    onPress={() => {
                      setSelectedGuide(null);
                      router.push('/(public)/card-benefits' as any);
                    }}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  categoryScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipActive: {},
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  guidesList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  guideCard: {
    padding: spacing.md,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  guideIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCategory: {
    flex: 1,
    marginLeft: spacing.md,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    color: colors.textMid,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  guideDescription: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  guideFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  tipsCard: {
    margin: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMid,
    lineHeight: 16,
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  shareBtn: {
    padding: 6,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  readerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  readerPill: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  readerDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readerDurationText: {
    fontSize: 12,
    color: colors.textMid,
  },
  readerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 28,
    marginBottom: spacing.xs,
  },
  readerIntro: {
    fontSize: 14,
    color: colors.textMid,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  sectionBlock: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 18,
  },
  readerActions: {
    marginVertical: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
