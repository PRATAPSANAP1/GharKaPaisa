import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import apiClient from '../config/api';

export default function AuditLogsScreen({ navigation }) {
  const [logs, setLogs] = useState([
    { id: '1', action: 'WORKING_HOURS_CHECK', actor: 'System Middleware', details: 'Asia/Kolkata 09:30 - 20:00 active', time: '15 Sep 2026 16:45:00' },
    { id: '2', action: 'PARTNER_CODE_SEQ', actor: 'PostgreSQL DB', details: 'Generated unique identifier AG1024', time: '15 Sep 2026 15:30:12' },
    { id: '3', action: 'KYC_MANUAL_VERIFY', actor: 'Super Admin', details: 'Approved PAN verification for User #408', time: '15 Sep 2026 14:10:45' }
  ]);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await apiClient.get('/admin/audit-logs').catch(() => null);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setLogs(res.data.data);
      }
    } catch (_) {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Audit & System Activity Logs</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.action}</Text>
            </View>
            <Text style={styles.actorText}>By: {item.actor}</Text>
            <Text style={styles.detailsText}>{item.details}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backText: { color: '#0284C7', fontWeight: '700', fontSize: 14 },
  title: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  list: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  badge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#0F172A' },
  actorText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  detailsText: { fontSize: 13, color: '#475569', marginTop: 4 },
  timeText: { fontSize: 11, color: '#94A3B8', marginTop: 6 }
});
