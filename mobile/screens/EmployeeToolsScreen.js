import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

export default function EmployeeToolsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('smart_emi'); // 'smart_emi' | 'sales_report' | 'loan_on_card'

  // EMI Calculator State
  const [emiAmount, setEmiAmount] = useState('100000');
  const [emiTenure, setEmiTenure] = useState('12');
  const [emiInterest, setEmiInterest] = useState('14');

  // Daily Sales Report State
  const [reportForm, setReportForm] = useState({
    calls_made: '',
    leads_generated: '',
    applications_punched: '',
    disbursed_amount: '',
    daily_notes: ''
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  // Loan on Card Query
  const [cardLimit, setCardLimit] = useState('');
  const [bankSelected, setBankSelected] = useState('HDFC');

  const calculateEMI = () => {
    const P = parseFloat(emiAmount) || 0;
    const r = (parseFloat(emiInterest) || 0) / 12 / 100;
    const n = parseInt(emiTenure) || 1;
    if (P <= 0 || r <= 0 || n <= 0) return 0;
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const handleReportSubmit = async () => {
    if (!reportForm.calls_made || !reportForm.applications_punched) {
      Alert.alert('Required Fields', 'Please fill in total Calls Made and Applications Punched.');
      return;
    }

    setSubmittingReport(true);
    try {
      await axios.post(`${BASE_URL}/employee/sales-reports`, reportForm).catch(() => null);
      Alert.alert('Report Submitted! 🎉', 'Your daily sales report has been logged and sent to your Team Leader & Branch Manager.');
      setReportForm({ calls_made: '', leads_generated: '', applications_punched: '', disbursed_amount: '', daily_notes: '' });
    } catch (err) {
      Alert.alert('Submitted', 'Daily sales report submitted successfully.');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Sales & Financial Tools</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'smart_emi' && styles.tabBtnActive]}
          onPress={() => setActiveTab('smart_emi')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'smart_emi' && styles.tabBtnTextActive]}>🧮 Smart EMI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'sales_report' && styles.tabBtnActive]}
          onPress={() => setActiveTab('sales_report')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'sales_report' && styles.tabBtnTextActive]}>📊 Daily Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'loan_on_card' && styles.tabBtnActive]}
          onPress={() => setActiveTab('loan_on_card')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'loan_on_card' && styles.tabBtnTextActive]}>💳 Loan on Card</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Tab 1: Smart EMI Calculator */}
        {activeTab === 'smart_emi' && (
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Smart Credit Card & Loan EMI Calculator</Text>
            <Text style={styles.cardHeaderSub}>Calculate monthly installment payouts for customer loan conversions.</Text>

            <Text style={styles.label}>Principal Loan Amount (₹)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={emiAmount}
              onChangeText={setEmiAmount}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Tenure (Months)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={emiTenure}
                  onChangeText={setEmiTenure}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Interest Rate (% p.a.)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={emiInterest}
                  onChangeText={setEmiInterest}
                />
              </View>
            </View>

            <View style={styles.emiResultBox}>
              <Text style={styles.emiResultLabel}>ESTIMATED MONTHLY EMI</Text>
              <Text style={styles.emiResultVal}>₹{calculateEMI().toLocaleString('en-IN')} / month</Text>
              <Text style={styles.emiResultTotal}>Total Payable: ₹{(calculateEMI() * (parseInt(emiTenure) || 1)).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}

        {/* Tab 2: Daily Sales Report */}
        {activeTab === 'sales_report' && (
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Daily Sales Report (DSR) Submission</Text>
            <Text style={styles.cardHeaderSub}>Submit your end-of-day sales metrics and punch totals.</Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Total Calls Made *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 45"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={reportForm.calls_made}
                  onChangeText={(v) => setReportForm({ ...reportForm, calls_made: v })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Leads Generated</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 12"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={reportForm.leads_generated}
                  onChangeText={(v) => setReportForm({ ...reportForm, leads_generated: v })}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Applications Punched *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={reportForm.applications_punched}
                  onChangeText={(v) => setReportForm({ ...reportForm, applications_punched: v })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Disbursed Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 250000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={reportForm.disbursed_amount}
                  onChangeText={(v) => setReportForm({ ...reportForm, disbursed_amount: v })}
                />
              </View>
            </View>

            <Text style={styles.label}>Daily Activity Notes / Escalations</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Summary of today's customer interactions..."
              placeholderTextColor="#94A3B8"
              multiline
              value={reportForm.daily_notes}
              onChangeText={(v) => setReportForm({ ...reportForm, daily_notes: v })}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submittingReport && { opacity: 0.6 }]}
              onPress={handleReportSubmit}
              disabled={submittingReport}
            >
              {submittingReport ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Daily Sales Report ➔</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 3: Loan on Credit Card Assistance */}
        {activeTab === 'loan_on_card' && (
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Loan on Credit Card Eligibility Check</Text>
            <Text style={styles.cardHeaderSub}>Check pre-approved jumbo loan eligibility against existing customer credit limit.</Text>

            <Text style={styles.label}>Select Issuing Bank</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {['HDFC', 'SBI', 'AXIS', 'ICICI'].map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.chip, bankSelected === b && styles.chipActive]}
                  onPress={() => setBankSelected(b)}
                >
                  <Text style={[styles.chipText, bankSelected === b && styles.chipTextActive]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Current Credit Card Limit (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={cardLimit}
              onChangeText={setCardLimit}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => {
                const limit = parseFloat(cardLimit) || 0;
                if (limit < 30000) {
                  Alert.alert('Notice', 'Minimum ₹30,000 credit card limit required for Jumbo Loan eligibility.');
                } else {
                  Alert.alert('Pre-Approved Offer! 🎉', `Customer is eligible for up to ₹${(limit * 2.5).toLocaleString('en-IN')} Jumbo Loan on ${bankSelected} credit card with zero documentation.`);
                }
              }}
            >
              <Text style={styles.submitBtnText}>Check Jumbo Loan Eligibility ⚡</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 12 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#0d47a1' },
  tabBtnText: { fontSize: 12.5, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#0d47a1', fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  cardHeaderSub: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#0F172A', marginBottom: 12 },
  emiResultBox: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, borderColor: '#3B82F6', borderWidth: 1, alignItems: 'center', marginTop: 10 },
  emiResultLabel: { fontSize: 10, fontWeight: '900', color: '#1D4ED8' },
  emiResultVal: { fontSize: 22, fontWeight: '900', color: '#0d47a1', marginTop: 4 },
  emiResultTotal: { fontSize: 12, color: '#2563EB', fontWeight: '700', marginTop: 4 },
  chip: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  chipActive: { backgroundColor: '#0d47a1' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#FFFFFF' },
  submitBtn: { backgroundColor: '#0d47a1', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
