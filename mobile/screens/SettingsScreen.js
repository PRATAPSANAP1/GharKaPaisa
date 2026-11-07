import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Linking,
  Platform,
  Share
} from 'react-native';

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी (Hindi)' },
  { id: 'mr', label: 'मराठी (Marathi)' },
  { id: 'te', label: 'తెలుగు (Telugu)' },
  { id: 'ta', label: 'தமிழ் (Tamil)' }
];

export default function SettingsScreen({ route, navigation }) {
  const { user, token } = route.params || {};
  const [selectedLang, setSelectedLang] = useState('en');

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your partner account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Home') }
    ]);
  };

  const handleOpenLink = (url, fallbackTitle) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert(fallbackTitle, 'Available on the production portal.'));
    } else {
      Alert.alert(fallbackTitle, 'Available on the production portal.');
    }
  };

  const partnerCode = user?.partner_code || 'GKP-9021';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#080E1A" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account & Settings</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.first_name?.[0] || 'P'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.userName}>{user?.first_name || 'Partner'} {user?.last_name || ''}</Text>
            <Text style={styles.userSub}>{user?.email || 'partner@gharkapaisa.in'}</Text>
            {user?.mobile && (
              <Text style={styles.userMobile}>📱 +91 {user.mobile}</Text>
            )}
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>PARTNER CODE: {partnerCode}</Text>
            </View>
          </View>
        </View>

        {/* Quick Navigation Rows */}
        <Text style={styles.sectionTitle}>Partner Management</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('PartnerKyc', { token, user })}
            activeOpacity={0.8}
          >
            <View style={styles.menuRowLeft}>
              <Text style={styles.menuIcon}>🛡️</Text>
              <Text style={styles.menuText}>KYC & Bank Verification</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('Wallet', { token, user })}
            activeOpacity={0.8}
          >
            <View style={styles.menuRowLeft}>
              <Text style={styles.menuIcon}>💰</Text>
              <Text style={styles.menuText}>Payout Bank Account</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('TeamManagement', { token, user })}
            activeOpacity={0.8}
          >
            <View style={styles.menuRowLeft}>
              <Text style={styles.menuIcon}>👥</Text>
              <Text style={styles.menuText}>Downline Team Network</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Language Selection */}
        <Text style={styles.sectionTitle}>App Language / भाषा</Text>
        <View style={styles.menuCard}>
          {LANGUAGES.map((lang, index) => (
            <React.Fragment key={lang.id}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setSelectedLang(lang.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.menuText}>{lang.label}</Text>
                <Text style={{ fontSize: 16, color: selectedLang === lang.id ? '#38BDF8' : '#64748B' }}>
                  {selectedLang === lang.id ? '●' : '○'}
                </Text>
              </TouchableOpacity>
              {index < LANGUAGES.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Support & Legal */}
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Linking.openURL('tel:18001234567').catch(() => Alert.alert('Support', 'Dial 1800-123-4567'))}
            activeOpacity={0.8}
          >
            <View style={styles.menuRowLeft}>
              <Text style={styles.menuIcon}>📞</Text>
              <Text style={styles.menuText}>Toll-Free Partner Support</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleOpenLink('https://gharkapaisa.in/terms', 'Terms')}
            activeOpacity={0.8}
          >
            <View style={styles.menuRowLeft}>
              <Text style={styles.menuIcon}>📜</Text>
              <Text style={styles.menuText}>Terms of Service</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleOpenLink('https://gharkapaisa.in/privacy', 'Privacy')}
            activeOpacity={0.8}
          >
            <View style={styles.menuRowLeft}>
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={styles.menuText}>Privacy Policy</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutBtnText}>Sign Out of Partner Portal</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: {
    padding: 16,
    paddingBottom: 40
  },
  userCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#60A5FA'
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900'
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800'
  },
  userSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2
  },
  userMobile: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 2
  },
  codeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6
  },
  codeBadgeText: {
    color: '#FCD34D',
    fontSize: 9.5,
    fontWeight: '900'
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8
  },
  menuCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    overflow: 'hidden'
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  menuIcon: {
    fontSize: 16,
    marginRight: 12
  },
  menuText: {
    color: '#F8FAFC',
    fontSize: 13.5,
    fontWeight: '700'
  },
  menuArrow: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '800'
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#1E293B'
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: 10,
    marginBottom: 20
  },
  logoutBtnText: {
    color: '#F87171',
    fontSize: 13.5,
    fontWeight: '900'
  }
});