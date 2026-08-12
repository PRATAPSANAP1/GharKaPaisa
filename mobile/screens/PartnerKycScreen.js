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
  ActivityIndicator
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
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadKycDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/partner/kyc/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setKycData(res.data.data);
        const panDoc = res.data.data.documents?.find((d) => d.doc_type === 'pan');
        if (panDoc?.doc_number) {
          setPanNumber(panDoc.doc_number);
        }
      }
    } catch (err) {
      console.warn('KYC load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKycDetails();
  }, []);

  const getProgress = () => {
    const hasPan = kycData.documents?.some((d) => d.doc_type === 'pan' && d.verification_status !== 'rejected');
    const hasCheque = kycData.documents?.some((d) => d.doc_type === 'cancelled_cheque' && d.verification_status !== 'rejected');
    const hasVideo = kycData.video && kycData.video.verification_status !== 'rejected';

    let count = 0;
    if (hasPan) count++;
    if (hasCheque) count++;
    if (hasVideo) count++;

    if (count === 0) return 0;
    if (count === 1) return 33;
    if (count === 2) return 66;
    return 100;
  };

  const getDoc = (type) => kycData.documents?.find((d) => d.doc_type === type);
  const isDocApproved = (type) => getDoc(type)?.verification_status === 'approved';
  const isVideoApproved = () => kycData.video?.verification_status === 'approved';

  const status = kycData.kyc_status || 'draft';
  const isApproved = status === 'approved';
  const isUnderReview = status === 'under_review' || status === 'pending';

  const handleUploadPanMock = async () => {
    if (!panNumber.trim() || panNumber.trim().length !== 10) {
      return Alert.alert('PAN Required', 'Please enter a valid 10-digit PAN Card number.');
    }
    setActionLoading(true);
    setErrorMsg('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('pan_number', panNumber.trim().toUpperCase());

      const res = await axios.post(`${BASE_URL}/partner/kyc/upload-pan`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data?.success) {
        setMessage('PAN Card details submitted successfully!');
        loadKycDetails();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'PAN Card submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitKyc = async () => {
    if (getProgress() < 100) {
      return Alert.alert('Incomplete KYC', 'Please upload/submit all mandatory items (PAN, Bank Proof, Video) first.');
    }

    setActionLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      const res = await axios.post(`${BASE_URL}/partner/kyc/submit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        Alert.alert('Success!', 'KYC Verification Submitted Successfully for Review.');
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

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
              {isApproved && 'Your account is verified! Full features are unlocked.'}
              {isUnderReview && 'Documents submitted and pending compliance review.'}
              {status === 'draft' && 'Upload PAN, Bank Proof, and Video below, then click Submit.'}
            </Text>
          </View>
        </View>

        {/* Progress Tracker */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Completion Progress</Text>
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
            <Text style={[styles.docBadge, isDocApproved('pan') ? styles.badgeGreen : styles.badgeYellow]}>
              {isDocApproved('pan') ? 'Verified' : getDoc('pan') ? 'Uploaded' : 'Pending'}
            </Text>
          </View>
          <Text style={styles.docSub}>Provide 10-digit permanent account number</Text>

          <TextInput
            style={styles.input}
            placeholder="ENTER 10-DIGIT PAN"
            placeholderTextColor="#94A3B8"
            maxLength={10}
            autoCapitalize="characters"
            value={panNumber}
            onChangeText={setPanNumber}
            editable={!isApproved && !isUnderReview}
          />

          {!isApproved && !isUnderReview && (
            <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadPanMock} disabled={actionLoading}>
              <Text style={styles.uploadBtnText}>Save PAN Details</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Item 2: Bank Account Proof */}
        <View style={styles.docCard}>
          <View style={styles.docHeader}>
            <Text style={styles.docTitle}>2. Bank Account Proof</Text>
            <Text style={[styles.docBadge, isDocApproved('cancelled_cheque') ? styles.badgeGreen : styles.badgeYellow]}>
              {isDocApproved('cancelled_cheque') ? 'Verified' : getDoc('cancelled_cheque') ? 'Uploaded' : 'Pending'}
            </Text>
          </View>
          <Text style={styles.docSub}>Cancelled Cheque or Bank Passbook photo</Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginVertical: 8 }}>
            Status: {getDoc('cancelled_cheque') ? 'Proof document on record.' : 'No proof document uploaded yet.'}
          </Text>
        </View>

        {/* Item 3: Video Verification */}
        <View style={styles.docCard}>
          <View style={styles.docHeader}>
            <Text style={styles.docTitle}>3. Video Verification</Text>
            <Text style={[styles.docBadge, isVideoApproved() ? styles.badgeGreen : styles.badgeYellow]}>
              {isVideoApproved() ? 'Verified' : kycData.video ? 'Recorded' : 'Pending'}
            </Text>
          </View>
          <Text style={styles.docSub}>Short video reading terms & compliance declaration</Text>
          {!(getDoc('pan') && getDoc('cancelled_cheque')) && !isApproved && !isUnderReview && (
            <Text style={{ fontSize: 12, color: '#D97706', fontWeight: '700', marginVertical: 6 }}>
              🔒 Locked: Please upload both PAN Card and Bank Proof first to unlock Video Verification.
            </Text>
          )}
          <Text style={{ fontSize: 12, color: '#64748B', marginVertical: 4 }}>
            Status: {kycData.video ? 'Video declaration recorded.' : 'Video not recorded yet.'}
          </Text>
        </View>

        {/* Explicit Submit KYC Button */}
        {!isApproved && !isUnderReview && (
          <TouchableOpacity
            style={[styles.submitKycBtn, getProgress() < 100 && styles.btnDisabled]}
            onPress={handleSubmitKyc}
            disabled={getProgress() < 100 || actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitKycText}>Submit KYC Documents</Text>
            )}
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 16,
    paddingTop: 45,
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
  submitKycBtn: { backgroundColor: '#059669', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10, elevation: 3 },
  submitKycText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  btnDisabled: { backgroundColor: '#94A3B8' },
  successMsg: { backgroundColor: '#ECFDF5', padding: 12, borderRadius: 8, marginBottom: 12 },
  successText: { color: '#047857', fontSize: 12, fontWeight: '700' },
  errorMsg: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 12 },
  errorText: { color: '#B91C1C', fontSize: 12, fontWeight: '700' },
});
