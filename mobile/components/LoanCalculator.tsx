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

export default function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState('500000');
  const [interestRate, setInterestRate] = useState('12');
  const [tenure, setTenure] = useState('24');
  const [showResult, setShowResult] = useState(false);

  const calculateEMI = () => {
    const principal = parseFloat(loanAmount);
    const rate = parseFloat(interestRate) / 12 / 100;
    const months = parseFloat(tenure);

    if (principal <= 0 || rate <= 0 || months <= 0) {
      return null;
    }

    const emi = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;

    return {
      emi: emi.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
    };
  };

  const handleCalculate = () => {
    const result = calculateEMI();
    if (result) {
      setShowResult(true);
    }
  };

  const result = showResult ? calculateEMI() : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Loan EMI Calculator</Text>
      <Text style={styles.subtitle}>Calculate your monthly EMI instantly</Text>

      <Card style={styles.calculatorCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Loan Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={loanAmount}
            onChangeText={setLoanAmount}
            keyboardType="numeric"
            placeholder="Enter loan amount"
            placeholderTextColor={colors.textLight}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Interest Rate (% p.a.)</Text>
          <TextInput
            style={styles.input}
            value={interestRate}
            onChangeText={setInterestRate}
            keyboardType="numeric"
            placeholder="Enter interest rate"
            placeholderTextColor={colors.textLight}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Loan Tenure (Months)</Text>
          <TextInput
            style={styles.input}
            value={tenure}
            onChangeText={setTenure}
            keyboardType="numeric"
            placeholder="Enter tenure in months"
            placeholderTextColor={colors.textLight}
          />
        </View>

        <Button
          title="Calculate EMI"
          onPress={handleCalculate}
          style={styles.calculateButton}
        />
      </Card>

      {result && (
        <Card style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Icon name="calculator" size={24} color={colors.primary} />
            <Text style={styles.resultTitle}>EMI Calculation Result</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Monthly EMI</Text>
            <Text style={styles.resultValue}>₹{result.emi}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Interest</Text>
            <Text style={styles.resultValue}>₹{result.totalInterest}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Payment</Text>
            <Text style={[styles.resultValue, styles.resultValueHighlight]}>₹{result.totalPayment}</Text>
          </View>

          <View style={styles.resultBreakdown}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownBar, { backgroundColor: colors.primary, width: '70%' }]} />
              <Text style={styles.breakdownLabel}>Principal: 70%</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownBar, { backgroundColor: colors.accent, width: '30%' }]} />
              <Text style={styles.breakdownLabel}>Interest: 30%</Text>
            </View>
          </View>
        </Card>
      )}

      <Card style={styles.infoCard}>
        <View style={styles.infoItem}>
          <Icon name="info-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            This calculator provides an estimate. Actual EMI may vary based on bank policies and credit score.
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
  calculatorCard: {
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
  calculateButton: {
    marginTop: spacing.sm,
  },
  resultCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textMid,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  resultValueHighlight: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  resultBreakdown: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakdownBar: {
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontSize: 12,
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
