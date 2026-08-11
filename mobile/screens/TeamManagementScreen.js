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

export default function TeamManagementScreen({ route, navigation }) {
  const { token, user } = route.params || {};

  const [teamMembers, setTeamMembers] = useState([]);
  const [stats, setStats] = useState({ total_team: 0, level1: 0, level2: 0, override_earned: 0 });
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    role: 'TEAM_MEMBER'
  });

  useEffect(() => {
    fetchTeamNetwork();
  }, []);

  const fetchTeamNetwork = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/partner/team`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (res?.data?.data) {
        setTeamMembers(res.data.data.members || []);
        setStats(res.data.data.stats || stats);
      } else {
        // Fallback demo data
        setTeamMembers([
          { id: '1', first_name: 'Vikas', last_name: 'Gupta', mobile: '9876543210', team_level: 1, kyc_status: 'approved', total_leads: 12 },
          { id: '2', first_name: 'Sneh', last_name: 'Rana', mobile: '9123456789', team_level: 2, kyc_status: 'draft', total_leads: 3 },
        ]);
      }
    } catch (err) {
      console.warn('Team fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteForm.first_name || !inviteForm.mobile || !inviteForm.email) {
      return Alert.alert('Missing Info', 'Please provide First Name, Mobile, and Email.');
    }

    try {
      const res = await axios.post(`${BASE_URL}/partner/team/add-member`, inviteForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        Alert.alert('Invite Sent', 'Team member invited successfully!');
        setShowInviteModal(false);
        fetchTeamNetwork();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send invitation.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Network</Text>
        <TouchableOpacity onPress={() => setShowInviteModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Override Commission Summary Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Downline Network Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{teamMembers.length}</Text>
              <Text style={styles.statSub}>Total Team</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>10%</Text>
              <Text style={styles.statSub}>Level 1 Override</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>5%</Text>
              <Text style={styles.statSub}>Level 2 Override</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Downline Members</Text>
          <TouchableOpacity onPress={() => setShowInviteModal(true)}>
            <Text style={styles.inviteLink}>+ Invite Member</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0d47a1" style={{ marginTop: 20 }} />
        ) : (
          teamMembers.map((m) => (
            <View key={m.id} style={styles.memberCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{m.first_name?.[0] || 'M'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.first_name} {m.last_name}</Text>
                <Text style={styles.memberSub}>Level {m.team_level || 1} • {m.mobile}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.kycTag}>{m.kyc_status?.toUpperCase() || 'DRAFT'}</Text>
                <Text style={styles.leadsTag}>{m.total_leads || 0} Leads</Text>
              </View>
            </View>
          ))
        )}

        {/* Invite Member Simple Box */}
        {showInviteModal && (
          <View style={styles.inviteBox}>
            <Text style={styles.inviteBoxTitle}>Invite Team Member</Text>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#94A3B8"
              value={inviteForm.first_name}
              onChangeText={(v) => setInviteForm({ ...inviteForm, first_name: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#94A3B8"
              value={inviteForm.last_name}
              onChangeText={(v) => setInviteForm({ ...inviteForm, last_name: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={10}
              value={inviteForm.mobile}
              onChangeText={(v) => setInviteForm({ ...inviteForm, mobile: v.replace(/\D/g, '') })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              value={inviteForm.email}
              onChangeText={(v) => setInviteForm({ ...inviteForm, email: v })}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]}
                onPress={() => setShowInviteModal(false)}
              >
                <Text style={{ color: '#475569', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#0d47a1', flex: 1 }]}
                onPress={handleSendInvite}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Send Invitation</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  statsCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, elevation: 1 },
  statsTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 20, fontWeight: '900', color: '#0d47a1' },
  statSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  inviteLink: { fontSize: 13, fontWeight: '800', color: '#0d47a1' },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 12,
  },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#0d47a1' },
  memberName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  memberSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  kycTag: { fontSize: 10, fontWeight: '800', color: '#059669', backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  leadsTag: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '600' },
  inviteBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#0d47a1', marginTop: 16 },
  inviteBoxTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13, color: '#0F172A', marginBottom: 10 },
  modalBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
});
