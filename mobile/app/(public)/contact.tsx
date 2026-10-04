import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import apiClient from '../../services/api';

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !emailOrPhone.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in all fields before sending.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/support/tickets', {
        subject: subject.trim() || 'General Inquiry from Mobile App',
        message: `Name: ${name}\nContact: ${emailOrPhone}\n\n${message}`,
        category: 'Inquiry',
        priority: 'Medium',
      }).catch(async () => {
        // Fallback endpoint
        return await apiClient.post('/public/contact', {
          name,
          emailOrPhone,
          subject,
          message,
        });
      });

      Alert.alert('Message Sent', 'Thank you! Our support desk has received your message and will respond shortly.');
      setName('');
      setEmailOrPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit query. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>SUPPORT & INQUIRY</Text>
          <Text style={styles.headerTitle}>Contact Us</Text>
        </View>
      </View>

      {/* Office Info Card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Headquarters & Office</Text>

        <View style={styles.contactRow}>
          <Icon name="map-pin" size={18} color={colors.primaryLight} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Main Office</Text>
            <Text style={styles.contactValue}>
              GharKaPaisa HQ, Financial Hub, Pune, Maharashtra - 411001
            </Text>
          </View>
        </View>

        <View style={styles.contactRow}>
          <Icon name="mail" size={18} color={colors.primaryLight} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Official Email</Text>
            <Text style={styles.contactValue}>support@gharkapaisa.in</Text>
          </View>
        </View>

        <View style={styles.contactRow}>
          <Icon name="phone" size={18} color={colors.primaryLight} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Customer Helpline</Text>
            <Text style={styles.contactValue}>+91 98765 43210 (Mon-Sat, 9:30 AM - 6:30 PM)</Text>
          </View>
        </View>
      </Card>

      {/* Query Form */}
      <Card style={[styles.card, { marginTop: spacing.md }]}>
        <Text style={styles.cardTitle}>Send us a Message</Text>
        <Text style={styles.cardSubtitle}>
          Have questions about loans, partner earnings, or credit cards? Fill out the form below.
        </Text>

        <Text style={styles.inputLabel}>Your Full Name *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Ramesh Kumar"
          placeholderTextColor={colors.textLight}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>Email or Mobile Number *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. ramesh@gmail.com or 9876543210"
          placeholderTextColor={colors.textLight}
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
        />

        <Text style={styles.inputLabel}>Subject</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Partner onboarding inquiry"
          placeholderTextColor={colors.textLight}
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={styles.inputLabel}>Message *</Text>
        <TextInput
          style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
          placeholder="Describe your query in detail..."
          placeholderTextColor={colors.textLight}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />

        <Button
          title="Send Message"
          onPress={handleSubmit}
          loading={submitting}
          style={{ marginTop: spacing.md }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.md,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: '#0F172A',
    padding: spacing.sm,
    borderRadius: 10,
  },
  contactLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  contactValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
  },
});
