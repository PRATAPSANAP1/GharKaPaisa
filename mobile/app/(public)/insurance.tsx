import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { submitCustomerApplication } from '../../services/application.service';

const insuranceTypes = [
  {
    id: 'health',
    title: 'Health Insurance',
    description: 'Comprehensive health coverage for you and your family',
    icon: 'heart-pulse',
    color: '#EF4444',
    bg: '#FEF2F2',
  },
  {
    id: 'life',
    title: 'Life Insurance',
    description: 'Secure your family\'s financial future',
    icon: 'shield',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: 'car',
    title: 'Car Insurance',
    description: 'Protect your vehicle against accidents and theft',
    icon: 'car',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    id: 'bike',
    title: 'Bike Insurance',
    description: 'Two-wheeler insurance for complete protection',
    icon: 'activity',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    id: 'travel',
    title: 'Travel Insurance',
    description: 'Safe travels with comprehensive travel coverage',
    icon: 'plane',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    id: 'home',
    title: 'Home Insurance',
    description: 'Protect your home and belongings',
    icon: 'home',
    color: '#06B6D4',
    bg: '#ECFEFF',
  },
];

export default function InsuranceScreen() {
  const [selectedInsurance, setSelectedInsurance] = useState<any | null>(null);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [extraDetail, setExtraDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successReference, setSuccessReference] = useState<string | null>(null);

  const handleApply = async () => {
    if (!fullName.trim() || !mobile.trim() || mobile.trim().length < 10) {
      Alert.alert('Required Fields', 'Please enter your full name and valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitCustomerApplication({
        product_id: `${selectedInsurance?.id || 'general'}-insurance`,
        customer_name: fullName.trim(),
        customer_mobile: mobile.trim(),
        city: city.trim() || 'Pune',
        employment_type: 'Salaried',
      });

      if (res?.success) {
        setSuccessReference(res.application?.application_number || res.data?.application_number || 'INS-' + Date.now().toString().slice(-6));
      } else {
        Alert.alert('Submission Error', res?.message || 'Could not submit insurance application.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeSheet = () => {
    setSelectedInsurance(null);
    setFullName('');
    setMobile('');
    setCity('');
    setExtraDetail('');
    setSuccessReference(null);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insurance</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.hero}>
        <Icon name="shield" size={48} color={colors.primary} />
        <Text style={styles.heroTitle}>Protect What Matters</Text>
        <Text style={styles.heroSubtitle}>
          Comprehensive insurance solutions for all your needs
        </Text>
      </View>

      <View style={styles.insuranceList}>
        {insuranceTypes.map((insurance) => (
          <TouchableOpacity
            key={insurance.id}
            onPress={() => {
              if (insurance.id === 'health') {
                router.push('/(public)/health-insurance');
              } else if (insurance.id === 'life') {
                router.push('/(public)/life-insurance');
              } else if (insurance.id === 'car') {
                router.push('/(public)/car-insurance');
              } else {
                setSelectedInsurance(insurance);
              }
            }}
            activeOpacity={0.7}
          >
            <Card style={styles.insuranceCard}>
              <View style={[styles.iconContainer, { backgroundColor: insurance.bg }]}>
                <Icon name={insurance.icon as any} size={32} color={insurance.color} />
              </View>
              <Text style={styles.insuranceTitle}>{insurance.title}</Text>
              <Text style={styles.insuranceDesc} numberOfLines={2}>
                {insurance.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.exploreText}>Explore Plans</Text>
                <Icon name="chevron-right" size={16} color={colors.primary} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={styles.infoCard}>
        <Icon name="info-circle" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Insurance products are provided by our partner banks and insurance companies. Compare plans and choose the best coverage for your needs.
        </Text>
      </Card>

      {/* Interactive Insurance Quote & Application Modal */}
      <Modal visible={!!selectedInsurance} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSheet} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              {selectedInsurance?.title || 'Insurance Application'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {successReference ? (
              <View style={styles.successBlock}>
                <Icon name="check-circle" size={56} color="#10B981" />
                <Text style={styles.successTitle}>Application Submitted!</Text>
                <Text style={styles.successSub}>
                  Your inquiry for {selectedInsurance?.title} has been received successfully.
                </Text>
                <View style={styles.refBox}>
                  <Text style={styles.refLabel}>Application Reference</Text>
                  <Text style={styles.refCode}>{successReference}</Text>
                </View>
                <Text style={styles.supportNote}>
                  An authorized insurance specialist will contact you on {mobile} to share customized policy quotes and cash-less garage/hospital networks.
                </Text>
                <Button title="Done" onPress={closeSheet} style={{ marginTop: spacing.lg }} />
              </View>
            ) : (
              <>
                <View style={[styles.modalHero, { backgroundColor: selectedInsurance?.bg || '#F8FAFC' }]}>
                  <Icon
                    name={selectedInsurance?.icon as any || 'shield'}
                    size={40}
                    color={selectedInsurance?.color || colors.primary}
                  />
                  <Text style={styles.modalHeroTitle}>{selectedInsurance?.title}</Text>
                  <Text style={styles.modalHeroDesc}>{selectedInsurance?.description}</Text>
                </View>

                <Card style={styles.formCard}>
                  <Text style={styles.formHeading}>Get Instant Policy Quotation</Text>

                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter applicant full name"
                    placeholderTextColor={colors.textLight}
                    value={fullName}
                    onChangeText={setFullName}
                  />

                  <Text style={styles.label}>10-Digit Mobile Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor={colors.textLight}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={mobile}
                    onChangeText={setMobile}
                  />

                  <Text style={styles.label}>City of Residence</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Mumbai, Pune, Delhi"
                    placeholderTextColor={colors.textLight}
                    value={city}
                    onChangeText={setCity}
                  />

                  <Text style={styles.label}>
                    {selectedInsurance?.id === 'bike'
                      ? 'Vehicle / Registration Number (Optional)'
                      : selectedInsurance?.id === 'travel'
                      ? 'Destination Country / Region'
                      : 'Property / Apartment Type'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      selectedInsurance?.id === 'bike'
                        ? 'e.g. MH12AB1234'
                        : selectedInsurance?.id === 'travel'
                        ? 'e.g. Europe, USA, UAE'
                        : 'e.g. 2BHK Apartment, Villa'
                    }
                    placeholderTextColor={colors.textLight}
                    value={extraDetail}
                    onChangeText={setExtraDetail}
                  />

                  <View style={styles.perksRow}>
                    <Icon name="check" size={16} color="#10B981" />
                    <Text style={styles.perkText}>Instant digital policy issuing within 5 minutes</Text>
                  </View>
                  <View style={styles.perksRow}>
                    <Icon name="check" size={16} color="#10B981" />
                    <Text style={styles.perkText}>Cashless claims with 10,000+ verified network partners</Text>
                  </View>
                  <View style={styles.perksRow}>
                    <Icon name="check" size={16} color="#10B981" />
                    <Text style={styles.perkText}>Zero paperwork & guaranteed lowest premium rate</Text>
                  </View>

                  <Button
                    title={submitting ? 'Submitting...' : 'Request Free Quotes'}
                    loading={submitting}
                    disabled={submitting}
                    onPress={handleApply}
                    style={{ marginTop: spacing.md }}
                  />
                </Card>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  hero: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textMid,
    textAlign: 'center',
  },
  insuranceList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  insuranceCard: {
    padding: spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  insuranceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  insuranceDesc: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  infoCard: {
    margin: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMid,
    lineHeight: 16,
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modalBody: {
    flex: 1,
    padding: spacing.md,
  },
  modalHero: {
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalHeroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  modalHeroDesc: {
    fontSize: 13,
    color: colors.textMid,
    textAlign: 'center',
  },
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  formHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#fff',
  },
  perksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  perkText: {
    fontSize: 12,
    color: colors.textMid,
  },
  successBlock: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10B981',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  successSub: {
    fontSize: 14,
    color: colors.textMid,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  refBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  refLabel: {
    fontSize: 11,
    color: colors.textLight,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  refCode: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 4,
  },
  supportNote: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
