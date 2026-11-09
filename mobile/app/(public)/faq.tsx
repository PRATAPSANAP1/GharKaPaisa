import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I apply for a credit card?',
    answer: 'You can apply for a credit card by browsing our catalog, selecting a card that suits your needs, and clicking the "Apply Now" button. Fill in the required details and submit your application. Our team will review it and get back to you.',
    category: 'General',
  },
  {
    id: '2',
    question: 'What documents are required for credit card application?',
    answer: 'You will need to provide: PAN card, Aadhaar card, address proof (electricity bill, rental agreement, etc.), passport size photograph, and income proof (salary slips, ITR, or bank statements).',
    category: 'Documents',
  },
  {
    id: '3',
    question: 'How long does it take to get my credit card approved?',
    answer: 'The approval process typically takes 7-14 working days depending on the bank and your profile. Some banks offer instant approval for pre-approved customers.',
    category: 'General',
  },
  {
    id: '4',
    question: 'What is a Lifetime Free (LTF) credit card?',
    answer: 'A Lifetime Free credit card has no annual fee, meaning you don\'t have to pay any yearly maintenance charges. These cards are great for users who want to avoid maintenance costs while enjoying premium benefits.',
    category: 'Cards',
  },
  {
    id: '5',
    question: 'How can I check my credit card application status?',
    answer: 'You can check your application status by visiting the "Track Application" page and entering your application reference number or registered mobile number.',
    category: 'General',
  },
  {
    id: '6',
    question: 'What is the eligibility criteria for credit cards?',
    answer: 'To be eligible for a credit card, you should: Be 21-60 years old, have a minimum annual income of ₹2.5 Lakhs, have a credit score of 700 or above, and be employed or self-employed for at least 1 year.',
    category: 'Eligibility',
  },
  {
    id: '7',
    question: 'How do I use the loan EMI calculator?',
    answer: 'Our loan EMI calculator helps you estimate your monthly EMI. Enter the loan amount, interest rate, and tenure to see your EMI, total interest, and total payment. This helps you plan your finances better.',
    category: 'Tools',
  },
  {
    id: '8',
    question: 'Can I compare multiple credit cards?',
    answer: 'Yes! You can compare up to 4 credit cards side-by-side. Use the "Compare" button on product cards to add them to comparison, then click "Compare Now" to see a detailed comparison of features, fees, and benefits.',
    category: 'Cards',
  },
  {
    id: '9',
    question: 'What should I do if my credit card application is rejected?',
    answer: 'If your application is rejected, check the reason provided by the bank. Common reasons include low credit score, insufficient income, or existing debt. Improve these factors and reapply after 3-6 months.',
    category: 'General',
  },
  {
    id: '10',
    question: 'How do I become a partner with GharKaPaisa?',
    answer: 'To become a partner, register on our platform. After registration, complete your KYC verification. Once approved, you can start referring customers and earning commissions on successful applications.',
    category: 'Partner',
  },
];

export default function FAQScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

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
