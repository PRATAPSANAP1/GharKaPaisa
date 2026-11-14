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

  useEffect(() => {
    fetchGuides().then((res) => {
      if (res?.success) setGuides(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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
            onPress={() => {
              // In production, this would navigate to the guide detail page
              alert('Guide detail page coming soon!');
            }}
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
});
