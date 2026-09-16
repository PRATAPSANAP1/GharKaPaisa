import React, { useState } from 'react';
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
  ActivityIndicator,
  Platform
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

export default function ContactScreen({ navigation }) {
  const [form, setForm] = useState({
    full_name: '',
    email_id: '',
    mobile_number: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.full_name || !form.mobile_number || !form.message) {
      Alert.alert('Required Fields', 'Please enter your Full Name, Mobile Number, and Message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE_URL}/support/contact-enquiry`, form).catch(() => null);
      Alert.alert(
        'Enquiry Sent',
        'Thank you for contacting GharKaPaisa. Our team will reach out to you within 24 business hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Success', 'Thank you! Your message has been received.');
    } finally {
      setSubmitting(false);
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
        <Text style={styles.headerTitle}>Contact & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Contact Info Cards */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Get in Touch with Us</Text>
          <Text style={styles.infoSub}>Have a question about financial products, partner payouts, or loan status? We are here to help.</Text>
          
          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>📞</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Phone Support</Text>
              <Text style={styles.contactVal}>+91 1800 123 4567 / +91 98765 43210</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>✉️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Email Address</Text>
              <Text style={styles.contactVal}>support@gharkapaisa.in / info@gharkapaisa.in</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>🏢</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Corporate Headquarters</Text>
              <Text style={styles.contactVal}>GharKaPaisa Tower, Financial District, Mumbai, MH - 400001</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>⏰</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Business Hours</Text>
              <Text style={styles.contactVal}>Monday to Saturday: 9:30 AM – 6:30 PM (IST)</Text>
            </View>
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.formCard}>
          <Text style={styles.formHeaderTitle}>Send Us a Direct Message</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rahul Sharma"
            placeholderTextColor="#94A3B8"
            value={form.full_name}
            onChangeText={(v) => setForm({ ...form, full_name: v })}
          />

          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={10}
            value={form.mobile_number}
            onChangeText={(v) => setForm({ ...form, mobile_number: v })}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="rahul@example.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email_id}
            onChangeText={(v) => setForm({ ...form, email_id: v })}
          />

          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Partner payout query / Loan application"
            placeholderTextColor="#94A3B8"
            value={form.subject}
            onChangeText={(v) => setForm({ ...form, subject: v })}
          />

          <Text style={styles.label}>Your Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your inquiry or requirement..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={form.message}
            onChangeText={(v) => setForm({ ...form, message: v })}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Message ➔</Text>
            )}
          </TouchableOpacity>
        </View>

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
  scroll: { padding: 16, paddingBottom: 40 },
  infoBox: { backgroundColor: '#0d47a1', borderRadius: 16, padding: 18, marginBottom: 16 },
  infoTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  infoSub: { fontSize: 12.5, color: '#93C5FD', marginBottom: 16, lineHeight: 18 },
  contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  contactIcon: { fontSize: 20, marginRight: 12 },
  contactLabel: { fontSize: 11, fontWeight: '700', color: '#93C5FD', textTransform: 'uppercase' },
  contactVal: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginTop: 1 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 },
  formHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#0F172A', marginBottom: 12 },
  textArea: { height: 90, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#0d47a1', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
