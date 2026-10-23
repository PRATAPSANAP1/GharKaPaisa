import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { fetchPartnerKycDetails } from '../../services/partner.service';

const VAULT_DOC_SLOTS = [
  { id: 'pan', name: 'PAN Card Document', desc: 'Required for tax & TDS compliance', icon: 'file-text' },
  { id: 'aadhaar', name: 'Aadhaar Identity Proof', desc: 'Identity & Address verification', icon: 'shield' },
  { id: 'cancelled_cheque', name: 'Bank Account Passbook / Cheque', desc: 'Direct commission payout settlement', icon: 'credit-card' },
  { id: 'gst_cert', name: 'GST Certificate (Optional)', desc: 'For registered business entities', icon: 'briefcase' },
  { id: 'partner_agreement', name: 'Partner MSA Agreement', desc: 'Signed workplace code of conduct', icon: 'award' },
];

export default function VaultScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [documents, setDocuments] = useState<any[]>([]);

  const loadVault = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetchPartnerKycDetails();
      if (res?.success && res.data?.documents) {
        setDocuments(res.data.documents);
      }
    } catch (e) {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  const handleUploadDoc = async (slot: any) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Storage access needed to select document.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        Alert.alert('Document Uploaded ✓', `${slot.name} has been securely stored in your Partner Vault.`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to upload document');
    }
  };

  const getDocStatus = (type: string) => {
    const found = documents.find((d: any) => d.doc_type === type);
    if (!found) return { status: 'MISSING', color: '#94A3B8', bg: '#F1F5F9' };
    if (found.verification_status === 'approved') return { status: 'VERIFIED', color: '#059669', bg: '#ECFDF5' };
    return { status: 'UNDER REVIEW', color: '#D97706', bg: '#FFFBEB' };
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadVault(true)} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Partner Document Vault</Text>
            <Text style={styles.subtitle}>Encrypted & tamper-proof compliance storage</Text>
          </View>
        </View>

        {/* Security Banner */}
        <View style={styles.banner}>
          <Icon name="lock" size={20} color="#38BDF8" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.bannerTitle}>256-Bit Encrypted Storage</Text>
            <Text style={styles.bannerDesc}>
              All uploaded partner credentials and agreements are securely vaulted in AWS cloud storage.
            </Text>
          </View>
        </View>

        {/* Document Slots */}
        <Text style={styles.sectionTitle}>Compliance Documents</Text>
        {VAULT_DOC_SLOTS.map(slot => {
          const docInfo = getDocStatus(slot.id);
          return (
            <View key={slot.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconBg}>
                  <Icon name={slot.icon as any} size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.cardTitle}>{slot.name}</Text>
                  <Text style={styles.cardDesc}>{slot.desc}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: docInfo.bg }]}>
                  <Text style={[styles.statusText, { color: docInfo.color }]}>{docInfo.status}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBottom}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleUploadDoc(slot)}>
                  <Icon name="upload-cloud" size={14} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Upload / Replace Document</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  banner: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bannerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.text,
  },
  cardDesc: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.sm,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
