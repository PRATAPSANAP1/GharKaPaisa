import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Card } from './Card';
import { Button } from './Button';
import { Icon } from './Icon';

export default function CardEligibilityChecker() {
  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [creditScore, setCreditScore] = useState('');
  const [showResult, setShowResult] = useState(false);

  const employmentTypes = ['Salaried', 'Self-Employed', 'Business Owner', 'Professional'];

  const checkEligibility = () => {
    setShowResult(true);
  };

  const getEligibilityResult = () => {
    const ageNum = parseInt(age);
    const incomeNum = parseInt(income);
    const scoreNum = parseInt(creditScore);

    if (!ageNum || !incomeNum || !creditScore) {
      return {
        status: 'pending',
        message: 'Please fill all fields to check eligibility',
        color: colors.warning,
      };
    }

    if (ageNum < 21 || ageNum > 60) {
      return {
        status: 'not_eligible',
        message: 'Age must be between 21 and 60 years',
        color: colors.error,
      };
    }

    if (incomeNum < 250000) {
      return {
        status: 'not_eligible',
        message: 'Minimum annual income should be ₹2.5 Lakhs',
        color: colors.error,
      };
    }

    if (scoreNum < 700) {
      return {
        status: 'not_eligible',
        message: 'Credit score should be at least 700',
        color: colors.error,
      };
    }

    if (scoreNum >= 750 && incomeNum >= 500000) {
      return {
        status: 'high_eligible',
        message: 'High eligibility for premium cards',
        color: colors.success,
      };
    }

    return {
      status: 'eligible',
      message: 'You are eligible for most credit cards',
      color: colors.primary,
    };
  };

  const result = showResult ? getEligibilityResult() : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Credit Card Eligibility Checker</Text>
      <Text style={styles.subtitle}>Check if you qualify for premium credit cards</Text>

      <Card style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            placeholder="Enter your age"
            placeholderTextColor={colors.textLight}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Annual Income (₹)</Text>
          <TextInput
            style={styles.input}
            value={income}
            onChangeText={setIncome}
            keyboardType="numeric"
            placeholder="Enter annual income"
            placeholderTextColor={colors.textLight}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Employment Type</Text>
          <View style={styles.employmentTypes}>
            {employmentTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.employmentChip,
                  employmentType === type && styles.employmentChipActive,
                  { backgroundColor: employmentType === type ? colors.primary : colors.bgTertiary }
                ]}
                onPress={() => setEmploymentType(type)}
              >
                <Text style={[
                  styles.employmentChipText,
                  { color: employmentType === type ? '#fff' : colors.text }
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Credit Score</Text>
          <TextInput
            style={styles.input}
            value={creditScore}
            onChangeText={setCreditScore}
            keyboardType="numeric"
            placeholder="Enter credit score (300-900)"
            placeholderTextColor={colors.textLight}
          />
        </View>

        <Button
          title="Check Eligibility"
          onPress={checkEligibility}
          style={styles.checkButton}
        />
      </Card>

      {result && (
        <Card style={[styles.resultCard, { borderColor: result.color }]}>
          <View style={styles.resultHeader}>
            <Icon 
              name={result.status === 'eligible' || result.status === 'high_eligible' ? 'check-circle' : 'x-circle'} 
              size={32} 
              color={result.color} 
            />
            <Text style={[styles.resultTitle, { color: result.color }]}>
              {result.status === 'high_eligible' ? 'Highly Eligible' : 
               result.status === 'eligible' ? 'Eligible' : 
               result.status === 'not_eligible' ? 'Not Eligible' : 'Pending'}
            </Text>
          </View>
          <Text style={styles.resultMessage}>{result.message}</Text>

          {result.status === 'eligible' || result.status === 'high_eligible' ? (
            <View style={styles.recommendationSection}>
              <Text style={styles.recommendationTitle}>Recommended Cards:</Text>
              <View style={styles.recommendationItem}>
                <Icon name="credit-card" size={16} color={colors.primary} />
                <Text style={styles.recommendationText}>Lifetime Free Cards</Text>
              </View>
              <View style={styles.recommendationItem}>
                <Icon name="credit-card" size={16} color={colors.primary} />
                <Text style={styles.recommendationText}>Rewards Cards</Text>
              </View>
            </View>
          ) : null}
        </Card>
      )}

      <Card style={styles.infoCard}>
        <View style={styles.infoItem}>
          <Icon name="info-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            This eligibility checker provides an estimate based on general criteria. Actual eligibility depends on bank policies and credit history.
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMid,
    marginBottom: spacing.lg,
  },
  formCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  employmentTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  employmentChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  employmentChipActive: {
    borderWidth: 1,
  },
  employmentChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkButton: {
    marginTop: spacing.sm,
  },
  resultCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  resultMessage: {
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  recommendationSection: {
    marginTop: spacing.md,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.textMid,
  },
  infoCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMid,
    lineHeight: 18,
  },
});
