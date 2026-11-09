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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../../components/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import apiClient from '../../../services/api';

interface Section {
  id?: string;
  key?: string;
  section_key?: string;
  title: string;
  is_active: boolean;
  content?: any;
  items?: any[];
  updated_at?: string;
}

export default function ManageSectionsScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Section Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [title, setTitle] = useState('');
  const [sectionKey, setSectionKey] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Company Footer Branding Settings
  const [companyName, setCompanyName] = useState('GharKaPaisa');
  const [companyPhone, setCompanyPhone] = useState('+91 8087179438');
  const [companyEmail, setCompanyEmail] = useState('support@gharkapaisa.in');
  const [savingSettings, setSavingSettings] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [sectionsRes, settingsRes] = await Promise.allSettled([
        apiClient.get('/cms/sections/all'),
        apiClient.get('/settings'),
      ]);

      if (sectionsRes.status === 'fulfilled') {
        const raw = sectionsRes.value.data?.data || (Array.isArray(sectionsRes.value.data) ? sectionsRes.value.data : []);
        setSections(Array.isArray(raw) ? raw : []);
      }

      if (settingsRes.status === 'fulfilled') {
        const s = settingsRes.value.data?.data || settingsRes.value.data || {};
        if (s.company_name) setCompanyName(s.company_name);
        if (s.company_phone) setCompanyPhone(s.company_phone);
        if (s.company_email) setCompanyEmail(s.company_email);
      }
    } catch (err: any) {
      console.warn('Failed to load CMS sections:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEditModal = (s: Section) => {
    setActiveSection(s);
    setTitle(s.title || '');
    setSectionKey(s.key || s.section_key || '');
    setIsActive(s.is_active ?? true);
    setModalVisible(true);
  };

  const handleSaveSection = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Section title is required.');
      return;
    }

    setSaving(true);
    try {
      const key = sectionKey || activeSection?.key || activeSection?.section_key;
      await apiClient.put(`/cms/sections/${key}`, {
        title: title.trim(),
        is_active: isActive,
      });

      Alert.alert('Updated ✓', 'Layout section updated successfully.');
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Update Failed', err.response?.data?.message || err.message || 'Could not update section.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSectionActive = async (s: Section) => {
    const key = s.key || s.section_key;
    if (!key) return;

    const newStatus = !s.is_active;
    setSections((prev) =>
      prev.map((item) => ((item.key || item.section_key) === key ? { ...item, is_active: newStatus } : item))
    );

    try {
      await apiClient.put(`/cms/sections/${key}`, { is_active: newStatus });
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle section status');
      loadData();
    }
  };

  const handleSaveBranding = async () => {
    setSavingSettings(true);
    try {
      await Promise.all([
        apiClient.post('/settings', { key: 'company_name', value: companyName.trim() }),
        apiClient.post('/settings', { key: 'company_phone', value: companyPhone.trim() }),
        apiClient.post('/settings', { key: 'company_email', value: companyEmail.trim() }),
      ]);
      Alert.alert('Saved ✓', 'Company branding settings updated.');
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Failed to save branding.');
    } finally {
      setSavingSettings(false);
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
          <Text style={styles.headerTitle}>Manage Sections</Text>
          <Text style={styles.headerSub}>Homepage layout sections, visibility & branding</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.subtleText}>Loading layout sections...</Text>
          </View>
        ) : (
          <>
            {/* Sections List */}
            <Text style={styles.sectionHeading}>Homepage Sections ({sections.length})</Text>
            {sections.length === 0 ? (
              <View style={styles.centerContainer}>
                <Icon name="layers" size={42} color="#64748B" />
                <Text style={styles.emptyTitle}>No Sections Configured</Text>
              </View>
            ) : (
              sections.map((item, idx) => {
                const sKey = item.key || item.section_key || `section_${idx}`;
                return (
                  <View key={sKey} style={styles.sectionCard}>
                    <View style={styles.sectionTop}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemKey}>Key: {sKey}</Text>
                      </View>
                      <Switch
                        value={item.is_active}
                        onValueChange={() => handleToggleSectionActive(item)}
                        trackColor={{ false: '#334155', true: colors.primary }}
                      />
                    </View>

                    <View style={styles.sectionFooter}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: item.is_active ? '#065F4630' : '#334155' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: item.is_active ? '#10B981' : '#94A3B8' },
                          ]}
                        >
                          {item.is_active ? 'VISIBLE' : 'HIDDEN'}
                        </Text>
                      </View>

                      <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                        <Icon name="edit" size={14} color="#38BDF8" />
                        <Text style={styles.editBtnText}>Edit Section</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* Global Company Branding */}
            <View style={styles.brandingCard}>
              <Text style={styles.brandingTitle}>Global Company Branding</Text>
              <Text style={styles.subtleText}>
                Controls official contact coordinates and company name displayed in portal footers.
              </Text>

              <Text style={styles.inputLabel}>Company Legal / Brand Name</Text>
              <TextInput
                style={styles.textInput}
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={styles.inputLabel}>Support Helpline Phone</Text>
              <TextInput
                style={styles.textInput}
                value={companyPhone}
                onChangeText={setCompanyPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Support Contact Email</Text>
              <TextInput
                style={styles.textInput}
                value={companyEmail}
                onChangeText={setCompanyEmail}
                keyboardType="email-address"
              />

              <TouchableOpacity
                style={[styles.saveBrandingBtn, savingSettings && { opacity: 0.7 }]}
                onPress={handleSaveBranding}
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check" size={16} color="#fff" />
                    <Text style={styles.saveBrandingText}>Update Company Branding</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Section</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Section Key (Identifier)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: '#0F172A80', color: '#94A3B8' }]}
              value={sectionKey}
              editable={false}
            />

            <Text style={styles.inputLabel}>Display Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Display on Homepage</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#334155', true: colors.primary }}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveSection}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Changes</Text>
                )}
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
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  sectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemKey: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  sectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C720',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  brandingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  brandingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 12,
    marginBottom: 6,
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
  saveBrandingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: spacing.lg,
  },
  saveBrandingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
