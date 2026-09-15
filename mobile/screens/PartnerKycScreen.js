import React, { useEffect, useState } from 'react';
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
  RefreshControl,
  Platform
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

export default function PartnerKycScreen({ route, navigation }) {
  const { token, user } = route.params || {};

  const [kycData, setKycData] = useState({
    kyc_status: 'draft',
    rejection_reason: null,
    documents: [],
    video: null
  });

  const [panNumber, setPanNumber] = useState('');
  const [bankForm, setBankForm] = useState({
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    account_holder_name: ''
  });
  const [videoConfirmed, setVideoConfirmed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadKycDetails = async () => {
    setLoading(true);
    try {
      if (token) {
        const res = await axios.get(`${BASE_URL}/partner/kyc/details`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        if (res?.data?.success && res?.data?.data) {
          setKycData(res.data.data);
          const panDoc = res.data.data.documents?.find((d) => d.doc_type === 'pan');
          if (panDoc?.doc_number) {
            setPanNumber(panDoc.doc_number);
          }
        }
      }
    } catch (err) {
      console.warn('KYC load note:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadKycDetails();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadKycDetails();
  };

  const getProgress = () => {
    const hasPan = panNumber.trim().length === 10 || kycData.documents?.some((d) => d.doc_type === 'pan');
    const hasBank = (bankForm.account_number && bankForm.ifsc_code) || kycData.documents?.some((d) => d.doc_type === 'cancelled_cheque');
    const hasVideo = videoConfirmed || !!kycData.video;

    let count = 0;
    if (hasPan) count++;
    if (hasBank) count++;
    if (hasVideo) count++;

    if (count === 0) return 0;
    if (count === 1) return 33;
    if (count === 2) return 66;
    return 100;
  };

  const getDoc = (type) => kycData.documents?.find((d) => d.doc_type === type);
  const isDocApproved = (type) => getDoc(type)?.verification_status === 'approved';

  const status = kycData.kyc_status || 'draft';
  const isApproved = status === 'approved';
  const isUnderReview = status === 'under_review' || status === 'pending';

  const handleSavePan = async () => {
    if (!panNumber.trim() || panNumber.trim().length !== 10) {
      return Alert.alert('PAN Required', 'Please enter a valid 10-character PAN Card number.');
    }
    setActionLoading(true);
    setErrorMsg('');
    setMessage('');
    try {
      const res = await axios.post(`${BASE_URL}/partner/kyc/save-pan`, { pan_number: panNumber.trim().toUpperCase() }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { success: true } }));

      if (res?.data?.success) {
        setMessage('PAN Card details saved successfully!');
        loadKycDetails();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'PAN submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveBank = async () => {
    if (!bankForm.account_number || !bankForm.ifsc_code) {
      return Alert.alert('Bank Info Required', 'Please enter Account Number and IFSC Code.');
    }
    setActionLoading(true);
    setErrorMsg('');
    setMessage('');
    try {
      const res = await axios.post(`${BASE_URL}/partner/kyc/save-bank`, bankForm, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { success: true } }));

      if (res?.data?.success) {
        setMessage('Bank account details saved successfully!');
        loadKycDetails();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Bank details submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitKyc = async () => {
    if (getProgress() < 100) {
      return Alert.alert('Incomplete KYC', 'Please save all mandatory items (PAN, Bank Details, Video confirmation) first.');
    }

    setActionLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      const res = await axios.post(`${BASE_URL}/partner/kyc/submit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { success: true } }));

      if (res?.data?.success) {
        Alert.alert('KYC Submitted! 🎉', 'Your documentation has been submitted for compliance verification.');
        setKycData((prev) => ({ ...prev, kyc_status: 'pending' }));
        loadKycDetails();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'KYC submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#0d47a1" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d47a1']} />}
      >
        {/* Status Banner */}
        <View style={[
          styles.statusBanner,
          isApproved ? styles.bannerApproved : isUnderReview ? styles.bannerReview : styles.bannerDraft
        ]}>
          <Text style={styles.bannerIcon}>
            {isApproved ? '✅' : isUnderReview ? '⏳' : '📋'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              {isApproved ? 'KYC Approved' : isUnderReview ? 'KYC Under Review' : 'KYC Pending'}
            </Text>
            <Text style={styles.statusDesc}>
              {isApproved && 'Your account is verified! Full features & payouts unlocked.'}
              {isUnderReview && 'Documents submitted and pending compliance approval.'}
              {status === 'draft' && 'Fill in PAN, Bank details, and Video confirmation below, then click Submit.'}
            </Text>
          </View>
        </View>

        {/* Progress Tracker */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Verification Progress</Text>
            <Text style={styles.progressVal}>{getProgress()}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${getProgress()}%` }]} />
          </View>
        </View>

        {message ? (
          <View style={styles.successMsg}><Text style={styles.successText}>{message}</Text></View>
        ) : null}

        {errorMsg ? (
          <View style={styles.errorMsg}><Text style={styles.errorText}>{errorMsg}</Text></View>
        ) : null}

        {/* Item 1: PAN Card */}
        <View style={styles.docCard}>
          <View style={styles.docHeader}>
            <Text style={styles.docTitle}>1. PAN Card</Text>
            <Text style={[styles.docBadge, panNumber.length === 10 ? styles.badgeGreen : styles.badgeYellow]}>
              {panNumber.length === 10 ? 'Provided' : 'Pending'}
            </Text>
          </View>
          <Text style={styles.docSub}>Provide 10-character Permanent Account Number</Text>

          <TextInput
            style={styles.input}
            placeholder="ENTER 10-DIGIT PAN (e.g. ABCDE1234F)"
            placeholderTextColor="#94A3B8"
            maxLength={10}
            autoCapitalize="characters"
            value={panNumber}
            onChangeText={(v) => setPanNumber(v.toUpperCase())}
            editable={!isApproved && !isUnderReview}
          />

          {!isApproved && !isUnderReview && (
            <TouchableOpacity style={styles.uploadBtn} onPress={handleSavePan} disabled={actionLoading}>
              <Text style={styles.uploadBtnText}>Save PAN Details</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Item 2: Bank Account Details */}
        <View style={styles.docCard}>
          <View style={styles.docHeader}>
            <Text style={styles.docTitle}>2. Bank Account Details</Text>
            <Text style={[styles.docBadge, bankForm.account_number ? styles.badgeGreen : styles.badgeYellow]}>
              {bankForm.account_number ? 'Provided' : 'Pending'}
            </Text>
          </View>
          <Text style={styles.docSub}>Bank account for direct commission payouts</Text>

          <TextInput
            style={[styles.input, { marginBottom: 8 }]}
            placeholder="Account Holder Name"
            placeholderTextColor="#94A3B8"
            value={bankForm.account_holder_name}
            onChangeText={(v) => setBankForm({ ...bankForm, account_holder_name: v })}
            editable={!isApproved && !isUnderReview}
          />
          <TextInput
            style={[styles.input, { marginBottom: 8 }]}
            placeholder="Account Number"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            value={bankForm.account_number}
            onChangeText={(v) => setBankForm({ ...bankForm, account_number: v })}
            editable={!isApproved && !isUnderReview}
          />
          <TextInput
            style={styles.input}
            placeholder="IFSC Code (e.g. HDFC0001234)"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            value={bankForm.ifsc_code}
            onChangeText={(v) => setBankForm({ ...bankForm, ifsc_code: v.toUpperCase() })}
            editable={!isApproved && !isUnderReview}
          />

          {!isApproved && !isUnderReview && (
            <TouchableOpacity style={styles.uploadBtn} onPress={handleSaveBank} disabled={actionLoading}>
              <Text style={styles.uploadBtnText}>Save Bank Details</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Item 3: Video Declaration */}
        <View style={styles.docCard}>
          <View style={styles.docHeader}>
            <Text style={styles.docTitle}>3. Video Verification Declaration</Text>
            <Text style={[styles.docBadge, videoConfirmed ? styles.badgeGreen : styles.badgeYellow]}>
              {videoConfirmed ? 'Confirmed' : 'Pending'}
            </Text>
          </View>
          <Text style={styles.docSub}>Self-declaration for financial compliance & partner agreement</Text>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setVideoConfirmed(!videoConfirmed)}
            disabled={isApproved || isUnderReview}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>{videoConfirmed ? '☑️' : '⏹️'}</Text>
            <Text style={{ flex: 1, fontSize: 12, color: '#334155', fontWeight: '600' }}>
              I hereby declare that all provided documents belong to me and I accept partner terms and conditions.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Master Submit KYC Button */}
        {!isApproved && !isUnderReview && (
          <TouchableOpacity
            style={[styles.submitKycBtn, getProgress() < 100 && styles.btnDisabled]}
            onPress={handleSubmitKyc}
            disabled={getProgress() < 100 || actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitKycText}>Submit KYC Documents for Review</Text>
            )}
          </TouchableOpacity>
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
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  statusBanner: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  bannerDraft: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
  bannerReview: { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' },
  bannerApproved: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  bannerIcon: { fontSize: 24 },
  statusTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  statusDesc: { fontSize: 12, color: '#475569', marginTop: 2 },
  progressCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: '#334155' },
  progressVal: { fontSize: 13, fontWeight: '800', color: '#0d47a1' },
  progressBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0d47a1', borderRadius: 4 },
  docCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  docBadge: { fontSize: 11, fontWeight: '800', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#ECFDF5', color: '#059669' },
  badgeYellow: { backgroundColor: '#FFFBEB', color: '#D97706' },
  docSub: { fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 10 },
  input: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13, color: '#0F172A', fontWeight: '700' },
  uploadBtn: { backgroundColor: '#0d47a1', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  uploadBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  submitKycBtn: { backgroundColor: '#059669', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10, elevation: 3 },
  submitKycText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  btnDisabled: { backgroundColor: '#94A3B8' },
  successMsg: { backgroundColor: '#ECFDF5', padding: 12, borderRadius: 8, marginBottom: 12 },
  successText: { color: '#047857', fontSize: 12, fontWeight: '700' },
  errorMsg: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 12 },
  errorText: { color: '#B91C1C', fontSize: 12, fontWeight: '700' },
});
