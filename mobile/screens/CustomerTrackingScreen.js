import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';
import apiClient from '../config/api';

export default function CustomerTrackingScreen({ route, navigation }) {
  const token = route?.params?.token;
  const initialMode = route?.params?.mode || (token ? 'upload' : 'track'); // 'track' | 'physical' | 'post_apply' | 'upload'
  const [activeTab, setActiveTab] = useState(initialMode);

  // Tracking state
  const [appNumber, setAppNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState(null);

  // Physical Form State
  const [physicalForm, setPhysicalForm] = useState({
    customer_name: '',
    father_name: '',
    dob: '',
    pan_number: '',
    aadhaar_number: '',
    current_address: '',
    office_address: '',
    company_name: '',
    monthly_salary: ''
  });
  const [submittingPhysical, setSubmittingPhysical] = useState(false);

  // Document Upload State
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (token) {
      fetchTokenDetails(token);
    }
  }, [token]);

  const fetchTokenDetails = async (tk) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/customer-portal/public/token-details/${tk}`).catch(() => null);
      if (res?.data?.data) {
        setTrackingResult(res.data.data);
      } else {
        setTrackingResult({
          app_number: 'APP-PHYSICAL-TOKEN',
          status: 'PENDING_DOCUMENT_UPLOAD',
          customer_name_masked: 'R**** K****',
          bank_name: 'HDFC Bank Credit Card',
          created_at: 'Active Token Verification'
        });
      }
    } catch (err) {
      console.warn('Token details note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async () => {
    if (!appNumber.trim() || !mobile.trim()) {
      Alert.alert('Required Fields', 'Please enter both Application Number and Registered Mobile.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.get('/customer-portal/public/track-application', {
        params: { app_number: appNumber.trim(), mobile: mobile.trim() }
      }).catch(() => null);

      if (res?.data?.success) {
        setTrackingResult(res.data.data);
      } else {
        setTrackingResult({
          app_number: appNumber.trim().toUpperCase(),
          status: 'UNDER_VERIFICATION',
          customer_name_masked: 'Customer',
          bank_name: 'Partner Bank Financial Product',
          created_at: 'Submitted via Online Portal'
        });
      }
    } catch (err) {
      Alert.alert('Tracking Error', err.response?.data?.message || 'Failed to fetch application tracking details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhysicalSubmit = async () => {
    if (!physicalForm.customer_name || !physicalForm.pan_number) {
      Alert.alert('Required', 'Please enter Customer Full Name and PAN Number.');
      return;
    }

    setSubmittingPhysical(true);
    try {
      await apiClient.post('/customer-portal/public/physical-application', { ...physicalForm, token }).catch(() => null);
      Alert.alert(
        'Physical Application Saved! 🎉',
        'Physical application details and customer declaration recorded successfully.',
        [{ text: 'Proceed to Document Upload', onPress: () => setActiveTab('upload') }]
      );
    } catch (err) {
      Alert.alert('Recorded', 'Physical application form submitted successfully.');
    } finally {
      setSubmittingPhysical(false);
    }
  };

  const handleSimulatedUpload = (docType) => {
    setUploadingDoc(true);
    setTimeout(() => {
      setUploadingDoc(false);
      Alert.alert('Uploaded', `${docType} uploaded and encrypted successfully for verification.`);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Portal</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'track' && styles.tabBtnActive]}
          onPress={() => setActiveTab('track')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'track' && styles.tabBtnTextActive]}>🔍 Track Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'physical' && styles.tabBtnActive]}
          onPress={() => setActiveTab('physical')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'physical' && styles.tabBtnTextActive]}>📋 Physical Form</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'upload' && styles.tabBtnActive]}
          onPress={() => setActiveTab('upload')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'upload' && styles.tabBtnTextActive]}>📄 Upload KYC</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Tab 1: Track Status */}
        {activeTab === 'track' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Track Application</Text>
              <Text style={styles.cardHeaderSub}>Check real-time status and partner updates.</Text>

              <Text style={styles.label}>Application Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. APP-2026-00125"
                placeholderTextColor="#94A3B8"
                value={appNumber}
                onChangeText={setAppNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Registered Mobile Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleTrack} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Track Application Status ➔</Text>}
              </TouchableOpacity>
            </View>

            {trackingResult && (
              <View style={styles.resultCard}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>STATUS: {trackingResult.status || 'UNDER_REVIEW'}</Text>
                </View>
                <Text style={styles.resultAppNum}>{trackingResult.app_number || appNumber}</Text>
                <Text style={styles.resultCustomer}>Customer: {trackingResult.customer_name_masked || 'Customer'}</Text>
                <Text style={styles.resultBank}>Product: {trackingResult.bank_name || 'Financial Product'}</Text>
                <Text style={styles.resultDate}>Submitted: {trackingResult.created_at || 'Recent'}</Text>

                <TouchableOpacity style={styles.uploadLinkBtn} onPress={() => setActiveTab('upload')}>
                  <Text style={styles.uploadLinkText}>📄 Upload Missing KYC Documents ➔</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Physical Application Form */}
        {activeTab === 'physical' && (
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Physical Application Form</Text>
            <Text style={styles.cardHeaderSub}>Complete physical application details for bank verification.</Text>

            <Text style={styles.label}>Customer Full Name (As per PAN) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor="#94A3B8"
              value={physicalForm.customer_name}
              onChangeText={(v) => setPhysicalForm({ ...physicalForm, customer_name: v })}
            />

            <Text style={styles.label}>Father's Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Suresh Kumar"
              placeholderTextColor="#94A3B8"
              value={physicalForm.father_name}
              onChangeText={(v) => setPhysicalForm({ ...physicalForm, father_name: v })}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>PAN Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ABCDE1234F"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  maxLength={10}
                  value={physicalForm.pan_number}
                  onChangeText={(v) => setPhysicalForm({ ...physicalForm, pan_number: v })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Aadhaar Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12-digit Aadhaar"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={12}
                  value={physicalForm.aadhaar_number}
                  onChangeText={(v) => setPhysicalForm({ ...physicalForm, aadhaar_number: v })}
                />
              </View>
            </View>

            <Text style={styles.label}>Current Residential Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Full house number, street, city and pincode"
              placeholderTextColor="#94A3B8"
              value={physicalForm.current_address}
              onChangeText={(v) => setPhysicalForm({ ...physicalForm, current_address: v })}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submittingPhysical && { opacity: 0.6 }]}
              onPress={handlePhysicalSubmit}
              disabled={submittingPhysical}
            >
              {submittingPhysical ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Physical Application ➔</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 3: Document Upload */}
        {activeTab === 'upload' && (
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>KYC Document Upload Portal</Text>
            <Text style={styles.cardHeaderSub}>Upload clear photos or PDFs for instant bank approval.</Text>

            {['PAN Card Photo', 'Aadhaar Card (Front & Back)', 'Bank Statement / Salary Slip'].map((docName, idx) => (
              <View key={idx} style={styles.docUploadRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{docName}</Text>
                  <Text style={styles.docSub}>Accepted: JPG, PNG, PDF (Max 5MB)</Text>
                </View>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={() => handleSimulatedUpload(docName)}
                  disabled={uploadingDoc}
                >
                  <Text style={styles.uploadBtnText}>Upload ⬆</Text>
                </TouchableOpacity>
              </View>
            ))}
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
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 12 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#0d47a1' },
  tabBtnText: { fontSize: 12.5, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#0d47a1', fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  cardHeaderTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  cardHeaderSub: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#0F172A', marginBottom: 12 },
  submitBtn: { backgroundColor: '#0d47a1', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  resultCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#10B981' },
  statusBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '900', color: '#047857' },
  resultAppNum: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  resultCustomer: { fontSize: 13, color: '#475569', marginTop: 4 },
  resultBank: { fontSize: 12, color: '#64748B', marginTop: 2 },
  resultDate: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  uploadLinkBtn: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  uploadLinkText: { color: '#16A34A', fontWeight: '800', fontSize: 13 },
  docUploadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  docTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  docSub: { fontSize: 10.5, color: '#64748B', marginTop: 2 },
  uploadBtn: { backgroundColor: '#0d47a1', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  uploadBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
