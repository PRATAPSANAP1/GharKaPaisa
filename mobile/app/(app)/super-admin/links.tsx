import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  Modal,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../../components/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import apiClient from '../../../services/api';

interface BankLink {
  id?: string;
  bank_id: string;
  bank_name?: string;
  direct_process_url: string;
  is_enabled: boolean;
  redirect_mode?: 'DIRECT' | 'IFRAME' | 'CO_BROWSE';
  updated_at?: string;
}

interface BankOption {
  id: string;
  name: string;
  code?: string;
}

export default function ManageLinksScreen() {
  const router = useRouter();
  const [bankLinks, setBankLinks] = useState<BankLink[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Digital Journey Global Link
  const [digitalJourneyLink, setDigitalJourneyLink] = useState('');
  const [savingGlobal, setSavingGlobal] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [redirectMode, setRedirectMode] = useState<'DIRECT' | 'IFRAME' | 'CO_BROWSE'>('DIRECT');
  const [savingLink, setSavingLink] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [banksRes, linksRes, settingsRes] = await Promise.allSettled([
        apiClient.get('/banks'),
        apiClient.get('/settings/bank-direct-links'),
        apiClient.get('/settings'),
      ]);

      if (banksRes.status === 'fulfilled') {
        const bData = banksRes.value.data?.data || (Array.isArray(banksRes.value.data) ? banksRes.value.data : []);
        setBanks(Array.isArray(bData) ? bData : []);
      }

      if (linksRes.status === 'fulfilled') {
        const lData = linksRes.value.data?.data || (Array.isArray(linksRes.value.data) ? linksRes.value.data : []);
        setBankLinks(Array.isArray(lData) ? lData : []);
      }

      if (settingsRes.status === 'fulfilled') {
        const s = settingsRes.value.data?.data || settingsRes.value.data || {};
        if (s.digital_journey_link) setDigitalJourneyLink(s.digital_journey_link);
      }
    } catch (err: any) {
      console.warn('Failed to load bank links:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setSelectedBankId(banks[0]?.id || '');
    setDirectUrl('');
    setIsEnabled(true);
    setRedirectMode('DIRECT');
    setModalVisible(true);
  };

  const openEditModal = (link: BankLink) => {
    setSelectedBankId(link.bank_id);
    setDirectUrl(link.direct_process_url || '');
    setIsEnabled(link.is_enabled ?? true);
    setRedirectMode(link.redirect_mode || 'DIRECT');
    setModalVisible(true);
  };

  const handleSaveBankLink = async () => {
    if (!selectedBankId) {
      Alert.alert('Validation Error', 'Please select a bank partner.');
      return;
    }
    if (!directUrl.trim()) {
      Alert.alert('Validation Error', 'Direct application URL is required.');
      return;
    }

    setSavingLink(true);
    try {
      await apiClient.post('/settings/bank-direct-links', {
        bank_id: selectedBankId,
        direct_process_url: directUrl.trim(),
        is_enabled: isEnabled,
        redirect_mode: redirectMode,
      });

      Alert.alert('Saved ✓', 'Bank direct process link configured.');
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.message || err.message || 'Could not save bank link');
    } finally {
      setSavingLink(false);
    }
  };

  const handleSaveGlobalLink = async () => {
    setSavingGlobal(true);
    try {
      await apiClient.post('/settings', {
        key: 'digital_journey_link',
        value: digitalJourneyLink.trim(),
      });
      Alert.alert('Updated ✓', 'Digital Journey redirection URL updated.');
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Could not save digital journey URL.');
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleShareLink = async (url: string, name: string) => {
    try {
      await Share.share({
        message: `GharKaPaisa Direct Bank Application for ${name}:\n${url}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Manage Direct Links</Text>
          <Text style={styles.headerSub}>Bank-partner direct application journeys & tracking</Text>
        </View>
        <TouchableOpacity style={styles.createHeaderBtn} onPress={openCreateModal}>
          <Icon name="plus" size={16} color="#fff" />
          <Text style={styles.createHeaderBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.subtleText}>Loading bank direct links...</Text>
          </View>
        ) : (
          <>
            {/* Global Digital Journey */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Master Digital Journey Redirect URL</Text>
              <Text style={styles.subtleText}>
                Default fallback digital application destination for customer self-fulfillment.
              </Text>
              <TextInput
                style={[styles.textInput, { marginTop: 10 }]}
                value={digitalJourneyLink}
                onChangeText={setDigitalJourneyLink}
                placeholder="https://apply.gharkapaisa.in/journey"
                placeholderTextColor="#64748B"
              />
              <TouchableOpacity
                style={[styles.saveGlobalBtn, savingGlobal && { opacity: 0.7 }]}
                onPress={handleSaveGlobalLink}
                disabled={savingGlobal}
              >
                {savingGlobal ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check" size={14} color="#fff" />
                    <Text style={styles.saveGlobalBtnText}>Save Master Link</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Bank Links List */}
            <Text style={styles.sectionHeading}>Bank-Direct Process Portals ({bankLinks.length})</Text>
            {bankLinks.length === 0 ? (
              <View style={styles.centerContainer}>
                <Icon name="link" size={42} color="#64748B" />
                <Text style={styles.emptyTitle}>No Bank Direct Links</Text>
                <Text style={styles.emptySubText}>
                  Map specific bank partner application URLs for instant co-browsing and lead redirection.
                </Text>
              </View>
            ) : (
              bankLinks.map((item, idx) => {
                const bObj = banks.find((b) => b.id === item.bank_id);
                const bankName = item.bank_name || bObj?.name || `Bank #${idx + 1}`;
                return (
                  <View key={item.id || item.bank_id || idx} style={styles.linkCard}>
                    <View style={styles.linkTop}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.bankName}>{bankName}</Text>
                        <Text style={styles.linkUrl} numberOfLines={1}>
                          🔗 {item.direct_process_url}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.modeBadge,
                          { backgroundColor: item.is_enabled ? '#065F4630' : '#334155' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modeBadgeText,
                            { color: item.is_enabled ? '#10B981' : '#94A3B8' },
                          ]}
                        >
                          {item.is_enabled ? 'ENABLED' : 'DISABLED'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.linkActions}>
                      <Text style={styles.modeText}>Mode: {item.redirect_mode || 'DIRECT'}</Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => handleShareLink(item.direct_process_url, bankName)}
                        >
                          <Icon name="share-2" size={13} color="#38BDF8" />
                          <Text style={styles.actionBtnText}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
                          <Icon name="edit" size={13} color="#38BDF8" />
                          <Text style={styles.actionBtnText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* CREATE / EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure Bank Link</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Select Bank */}
            <Text style={styles.inputLabel}>Bank Partner</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankPillRow}>
              {banks.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.bankPill, selectedBankId === b.id && styles.bankPillActive]}
                  onPress={() => setSelectedBankId(b.id)}
                >
                  <Text style={[styles.bankPillText, selectedBankId === b.id && styles.bankPillTextActive]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Direct Application URL *</Text>
            <TextInput
              style={styles.textInput}
              value={directUrl}
              onChangeText={setDirectUrl}
              placeholder="https://leads.hdfcbank.com/apply/..."
              placeholderTextColor="#64748B"
            />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Enable Direct Redirection</Text>
              <Switch
                value={isEnabled}
                onValueChange={setIsEnabled}
                trackColor={{ false: '#334155', true: colors.primary }}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingLink && { opacity: 0.7 }]}
                onPress={handleSaveBankLink}
                disabled={savingLink}
              >
                {savingLink ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitText}>Save Link</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
    marginRight: spacing.sm,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  createHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  subtleText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    color: '#FFFFFF',
    fontSize: 13,
  },
  saveGlobalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
  },
  saveGlobalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  linkCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  linkTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bankName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  linkUrl: {
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 4,
  },
  modeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  linkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  modeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C720',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  bankPillRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bankPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  bankPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bankPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  bankPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: spacing.lg,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  modalSubmitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
