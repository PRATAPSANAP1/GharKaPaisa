import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import {
  fetchDailySalesReports,
  submitDailySalesReport,
} from '../../services/employee.service';

const POPULAR_BANKS = [
  { id: '1', name: 'HDFC Bank' },
  { id: '2', name: 'SBI Cards' },
  { id: '3', name: 'ICICI Bank' },
  { id: '4', name: 'Axis Bank' },
  { id: '5', name: 'Kotak Bank' },
  { id: '6', name: 'IndusInd Bank' },
];

export default function EmployeeSalesReportScreen() {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  // Submit Form State
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalCards, setTotalCards] = useState('');
  const [remark, setRemark] = useState('');
  const [bankCounts, setBankCounts] = useState<{ [key: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [reportsHistory, setReportsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetchDailySalesReports();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setReportsHistory(list);
    } catch (err: any) {
      console.warn('Could not fetch sales reports history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBankCountChange = (bankId: string, countStr: string) => {
    const val = parseInt(countStr) || 0;
    const updated = { ...bankCounts, [bankId]: val };
    setBankCounts(updated);

    // Auto-calculate sum
    const total = Object.values(updated).reduce((sum, n) => sum + n, 0);
    setTotalCards(String(total));
  };

  const handleSubmit = async () => {
    const cardsNum = parseInt(totalCards) || 0;
    if (cardsNum <= 0) {
      Alert.alert('Required', 'Please enter total number of cards sold today.');
      return;
    }

    setSubmitting(true);
    try {
      await submitDailySalesReport({
        report_date: reportDate,
        total_cards: cardsNum,
        remark: remark.trim(),
        banks: Object.entries(bankCounts)
          .filter(([_, count]) => count > 0)
          .map(([bId, count]) => ({ bank_id: bId, cards_sold: count })),
      });

      Alert.alert('Report Submitted', 'Your daily sales report has been submitted for team leader verification.');
      setTotalCards('');
      setRemark('');
      setBankCounts({});
      setActiveTab('history');
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Could not submit sales report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>EMPLOYEE PORTAL</Text>
          <Text style={styles.headerTitle}>Daily Sales Report</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'submit' && styles.activeTabBtn]}
          onPress={() => setActiveTab('submit')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'submit' && styles.activeTabBtnText]}>
            Submit Today's Report
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && styles.activeTabBtn]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'history' && styles.activeTabBtnText]}>
            Report History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'submit' ? (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Daily Cards Log ({reportDate})</Text>
          <Text style={styles.cardSubtitle}>
            Break down the customer cards processed across partnered banks today.
          </Text>

          {/* Bank-wise Breakdown */}
          <Text style={styles.inputLabel}>Bank-wise Card Counts</Text>
          <View style={styles.bankGrid}>
            {POPULAR_BANKS.map((b) => (
              <View key={b.id} style={styles.bankInputRow}>
                <Text style={styles.bankNameLabel}>{b.name}</Text>
                <TextInput
                  style={styles.countInput}
                  placeholder="0"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                  value={bankCounts[b.id] ? String(bankCounts[b.id]) : ''}
                  onChangeText={(t) => handleBankCountChange(b.id, t)}
                />
              </View>
            ))}
          </View>

          {/* Total Cards */}
          <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Total Cards Sold *</Text>
          <TextInput
            style={[styles.textInput, { fontSize: 16, fontWeight: '800', color: '#10B981' }]}
            placeholder="0"
            placeholderTextColor={colors.textLight}
            value={totalCards}
            onChangeText={setTotalCards}
            keyboardType="numeric"
          />

          {/* Remark */}
          <Text style={styles.inputLabel}>Remark / Highlights (Optional)</Text>
          <TextInput
            style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
            placeholder="e.g. 2 HDFC Tata Neu cards approved with pre-approved limits."
            placeholderTextColor={colors.textLight}
            value={remark}
            onChangeText={setRemark}
            multiline
            numberOfLines={3}
          />

          <Button
            title="Submit Daily Sales Report"
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Sales Report Log</Text>
          <Text style={styles.cardSubtitle}>Past submissions reviewed by Manager / TL.</Text>

          {loadingHistory ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : reportsHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="file-text" size={36} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Sales Reports Logged</Text>
              <Text style={styles.emptyDesc}>Submit your end-of-day sales figures above.</Text>
            </View>
          ) : (
            reportsHistory.map((rep, idx) => (
              <View key={rep.id || idx} style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.repDate}>
                    {new Date(rep.report_date || Date.now()).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  {rep.remark && <Text style={styles.repRemark}>{rep.remark}</Text>}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.repCount}>{rep.total_cards} Cards</Text>
                  <Text
                    style={[
                      styles.repStatus,
                      { color: rep.status === 'Approved' ? '#10B981' : '#F59E0B' },
                    ]}
                  >
                    {rep.status || 'Submitted'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>
      )}
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabBtn: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeTabBtnText: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  bankGrid: {
    gap: spacing.xs,
  },
  bankInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bankNameLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  countInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    width: 60,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginTop: spacing.xs,
  },
  emptyDesc: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  repDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  repRemark: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  repCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  repStatus: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
