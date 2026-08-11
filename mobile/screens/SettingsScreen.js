import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी (Hindi)' },
  { id: 'mr', label: 'मराठी (Marathi)' },
  { id: 'te', label: 'తెలుగు (Telugu)' },
  { id: 'ta', label: 'தமிழ் (Tamil)' }
];

export default function SettingsScreen({ route, navigation }) {
  const { user } = route.params || {};
  const [selectedLang, setSelectedLang] = useState('en');

  const handleLogout = () => {
    Alert.alert('Logout', 'Log out of your partner account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Home') }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.first_name?.[0] || 'P'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.userSub}>{user?.email || 'partner@gharkapaisa.in'}</Text>
            <Text style={styles.userCode}>Partner Code: {user?.partner_code || 'AG10024'}</Text>
          </View>
        </View>

        {/* Language Selection */}
        <Text style={styles.sectionTitle}>App Language / भाषा</Text>
        <View style={styles.card}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={styles.langRow}
              onPress={() => setSelectedLang(lang.id)}
            >
              <Text style={styles.langLabel}>{lang.label}</Text>
              <Text style={{ fontSize: 16 }}>{selectedLang === lang.id ? '🔘' : '⚪'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Help & Support */}
        <Text style={styles.sectionTitle}>Help & Legal</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>📞 Contact Partner Support</Text>
            <Text style={styles.arrow}>➔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>📜 Terms of Service</Text>
            <Text style={styles.arrow}>➔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>🔒 Privacy Policy</Text>
            <Text style={styles.arrow}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Sign Out of App</Text>
        </TouchableOpacity>

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
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, gap: 14 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#0d47a1', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  userName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  userSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  userCode: { fontSize: 11, fontWeight: '700', color: '#0d47a1', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, overflow: 'hidden' },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  langLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  arrow: { color: '#94A3B8', fontWeight: '800' },
  logoutBtn: { backgroundColor: '#FEF2F2', borderBottomWidth: 1, borderColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  logoutBtnText: { color: '#DC2626', fontSize: 15, fontWeight: '800' },
});
