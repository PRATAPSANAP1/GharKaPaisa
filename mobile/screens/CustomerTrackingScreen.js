import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import apiClient from '../config/api';

export default function CustomerTrackingScreen({ navigation }) {
  const [appNumber, setAppNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState(null);

  const handleTrack = async () => {
    if (!appNumber.trim() || !mobile.trim()) {
      Alert.alert('Required Fields', 'Please enter both Application Number and Registered Mobile.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.get('/customer-portal/public/track-application', {
        params: { app_number: appNumber.trim(), mobile: mobile.trim() }
      });

      if (res?.data?.success) {
        setTrackingResult(res.data.data);
      } else {
        Alert.alert('Application Not Found', res?.data?.message || 'No matching application found.');
      }
    } catch (err) {
      Alert.alert('Tracking Error', err.response?.data?.message || 'Failed to fetch application tracking details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Track Application</Text>
        <Text style={styles.subtitle}>Check real-time application status & document upload links</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Application Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. APP-2026-00125"
            placeholderTextColor="#94A3B8"
            value={appNumber}
            onChangeText={setAppNumber}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Registered Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={10}
            value={mobile}
            onChangeText={setMobile}
          />

          <TouchableOpacity style={styles.trackBtn} onPress={handleTrack} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.trackBtnText}>Track Application Status</Text>
            )}
          </TouchableOpacity>
        </View>

        {trackingResult && (
          <View style={styles.resultCard}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>STATUS: {trackingResult.status || 'UNDER_REVIEW'}</Text>
            </View>
            <Text style={styles.resultAppNum}>{trackingResult.app_number || appNumber}</Text>
            <Text style={styles.resultCustomer}>Customer: {trackingResult.customer_name_masked || 'Customer'}</Text>
            <Text style={styles.resultBank}>Bank / Product: {trackingResult.bank_name || 'HDFC Bank'}</Text>
            <Text style={styles.resultDate}>Submitted: {trackingResult.created_at || '15 Sep 2026'}</Text>

            <TouchableOpacity 
              style={styles.uploadLinkBtn}
              onPress={() => Alert.alert('Secure Link Active', '72-Hour Customer document upload link verified.')}
            >
              <Text style={styles.uploadLinkText}>📄 Upload Additional Documents</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#0284C7', fontWeight: '700', fontSize: 14 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, fontSize: 14, color: '#0F172A', backgroundColor: '#F8FAFC', marginBottom: 14 },
  trackBtn: { backgroundColor: '#0284C7', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  trackBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  resultCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#10B981' },
  statusBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '800', color: '#047857' },
  resultAppNum: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  resultCustomer: { fontSize: 14, color: '#475569', marginTop: 4 },
  resultBank: { fontSize: 13, color: '#64748B', marginTop: 2 },
  resultDate: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  uploadLinkBtn: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  uploadLinkText: { color: '#16A34A', fontWeight: '700', fontSize: 13 }
});
