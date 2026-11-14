import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { fetchFAQs } from '../../services/cms.service';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FAQScreen() {
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    fetchFAQs().then((res) => {
      if (res?.success) setFaqs(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categories = ['ALL', ...Array.from(new Set(faqs.map(f => f.category)))];

  const filteredFAQs = selectedCategory === 'ALL'
    ? faqs
    : faqs.filter(f => f.category === selectedCategory);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
        <Text style={styles.headerSubtitle}>Find answers to common questions</Text>
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

      {/* FAQ List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading FAQs...</Text>
        </View>
      ) : filteredFAQs.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="info-circle" size={48} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No FAQs available</Text>
        </View>
      ) : (
        <View style={styles.faqList}>
          {filteredFAQs.map(faq => (
          <Card key={faq.id} style={styles.faqCard}>
            <TouchableOpacity
              style={styles.faqHeader}
              onPress={() => toggleExpand(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqQuestionContainer}>
                <Text style={styles.faqCategory}>{faq.category}</Text>
                <Text style={styles.faqQuestion} numberOfLines={2}>
                  {faq.question}
                </Text>
              </View>
              <Icon
                name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMid}
              />
            </TouchableOpacity>
            {expandedId === faq.id && (
              <View style={styles.faqAnswerContainer}>
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              </View>
            )}
          </Card>
        ))}
        </View>
      )}

      {/* Contact Support */}
      <Card style={styles.supportCard}>
        <Icon name="headphones" size={32} color={colors.primary} />
        <Text style={styles.supportTitle}>Still have questions?</Text>
        <Text style={styles.supportText}>
          Our support team is here to help you with any queries.
        </Text>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMid,
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
  faqList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  faqCard: {
    padding: spacing.md,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestionContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  faqCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  faqAnswerContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  faqAnswer: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 20,
  },
  supportCard: {
    margin: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  supportText: {
    fontSize: 13,
    color: colors.textMid,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
