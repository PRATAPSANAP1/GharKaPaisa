import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import apiClient from '../config/api';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Application Approved', body: 'Application APP-2026-00125 for HDFC Credit Card has been approved by bank.', time: '10 mins ago', type: 'application' },
    { id: '2', title: 'Commission Released', body: '₹1,500 payout credited to your GharKaPaisa wallet ledger.', time: '1 hour ago', type: 'wallet' },
    { id: '3', title: 'KYC Document Verified', body: 'Your PAN card verification is complete. Wallet payouts unlocked.', time: 'Yesterday', type: 'kyc' }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/notifications').catch(() => null);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setNotifications(res.data.data);
      }
    } catch (_) {
      // Keep initial list
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications & Alerts</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardTime}>{item.time}</Text>
              </View>
              <Text style={styles.cardBody}>{item.body}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backText: { color: '#0284C7', fontWeight: '700', fontSize: 14 },
  title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  list: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  cardTime: { fontSize: 11, color: '#94A3B8' },
  cardBody: { fontSize: 13, color: '#475569', lineHeight: 18 }
});
