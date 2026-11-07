import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import apiClient from '../config/api';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Application Approved 🎉', body: 'Application APP-884931 for HDFC Pixel Go Card has been approved by bank underwriting.', time: '10 mins ago', type: 'application' },
    { id: '2', title: 'Commission Credited ⚡', body: '₹1,500 commission has been credited to your available wallet balance.', time: '1 hour ago', type: 'wallet' },
    { id: '3', title: 'KYC Document Verified ✓', body: 'Your PAN card verification is complete. Daily instant bank withdrawals are enabled.', time: 'Yesterday', type: 'kyc' },
    { id: '4', title: 'New Bank Product Added 💳', body: 'AU Small Finance Bank Altura Plus Credit Card is now available with ₹2,000 commission.', time: '2 days ago', type: 'product' }
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

  const getIcon = (type) => {
    switch (type) {
      case 'wallet': return '💰';
      case 'kyc': return '🛡️';
      case 'product': return '💳';
      default: return '📋';
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#080E1A" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications & Alerts</Text>
        <View style={{ width: 45 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 16 }}>{getIcon(item.type)}</Text>
              </View>
              <View style={styles.contentCol}>
                <View style={styles.topRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>
                <Text style={styles.cardBody}>{item.body}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#080E1A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800'
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '900'
  },
  list: {
    padding: 16
  },
  card: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  contentCol: {
    flex: 1
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#F8FAFC',
    flex: 1
  },
  cardTime: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600'
  },
  cardBody: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginTop: 2
  }
});