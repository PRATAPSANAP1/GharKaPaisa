import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar, ScrollView, Alert
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import LogoLoader from '../components/LogoLoader';

export default function DashboardScreen({ route, navigation }) {
  const { user, token } = route.params;
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setWallet(res.data.wallet);
      } else {
        setWallet(res.data);
      }
    } catch (error) {
      console.warn('Wallet fetch error:', error.message);
      // Fallback/dummy values if endpoint holds different schema
      setWallet({
        available_balance: 0,
        hold_balance: 0,
        total_earned: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            navigation.replace('Home', { loggedOut: true });
          }
        }
      ]
    );
  };

  if (loading) {
    return <LogoLoader text="Loading your partner workspace..." />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roleTag}>{user?.role || 'Partner'}</Text>
          <Text style={styles.welcomeText}>
            Welcome, {user?.first_name || 'User'}!
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Text style={styles.cardHeader}>Account Info</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.val}>{user?.first_name} {user?.last_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.val}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mobile:</Text>
            <Text style={styles.val}>{user?.mobile || 'N/A'}</Text>
          </View>
          {user?.Partner_code && (
            <View style={styles.row}>
              <Text style={styles.label}>Partner Code:</Text>
              <Text style={styles.val}>{user.Partner_code}</Text>
            </View>
          )}
        </View>

        {/* Wallet Overview */}
        <Text style={styles.sectionTitle}>Wallet Balance</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#0d47a1" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { borderLeftColor: '#2e7d32' }]}>
              <Text style={styles.statLabel}>Available Balance</Text>
              <Text style={[styles.statValue, { color: '#2e7d32' }]}>
                ₹{wallet?.available_balance || 0}
              </Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#f57c00' }]}>
              <Text style={styles.statLabel}>Hold Balance</Text>
              <Text style={[styles.statValue, { color: '#f57c00' }]}>
                ₹{wallet?.hold_balance || 0}
              </Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#1565c0' }]}>
              <Text style={styles.statLabel}>Total Earned</Text>
              <Text style={[styles.statValue, { color: '#1565c0' }]}>
                ₹{wallet?.total_earned || 0}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchWalletData}>
          <Text style={styles.refreshText}>Refresh Balance</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  header: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  roleTag: {
    color: '#bbdefb',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  val: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  refreshBtn: {
    backgroundColor: '#0d47a1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
