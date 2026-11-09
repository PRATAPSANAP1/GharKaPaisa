import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../../../components/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import apiClient from '../../../services/api';

interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  target?: string;
  position?: number;
  is_active: boolean;
  created_at?: string;
}

export default function ManageBannersScreen() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Create / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [position, setPosition] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadBanners = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await apiClient.get('/banners/all');
      const list = res.data?.data || res.data?.banners || (Array.isArray(res.data) ? res.data : []);
      setBanners(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.warn('Failed to load banners:', err);
      // Fallback to public banners endpoint if /banners/all is unauthorized
      try {
        const fallbackRes = await apiClient.get('/banners');
        const fList = fallbackRes.data?.data || (Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
        setBanners(fList);
      } catch (fErr) {
        setBanners([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle('');
    setDescription('');
    setLinkUrl('');
    setPosition(String(banners.length + 1));
    setIsActive(true);
    setSelectedImage(null);
    setModalVisible(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title || '');
    setDescription(banner.description || '');
    setLinkUrl(banner.link_url || '');
    setPosition(String(banner.position || 1));
    setIsActive(banner.is_active ?? true);
    setSelectedImage(null);
    setModalVisible(true);
  };

  const pickBannerImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Photo library access is needed to select a banner creative.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || `banner_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Banner title is required.');
      return;
    }

    if (!editingBanner && !selectedImage) {
      Alert.alert('Validation Error', 'Please select a banner image creative.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('link_url', linkUrl.trim());
      formData.append('position', position);
      formData.append('is_active', String(isActive));

      if (selectedImage) {
        formData.append('image', {
          uri: selectedImage.uri,
          name: selectedImage.name,
          type: selectedImage.type,
        } as any);
      }

      if (editingBanner) {
        await apiClient.put(`/banners/${editingBanner.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Updated ✓', 'Promotional banner updated successfully.');
      } else {
        await apiClient.post('/banners', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Published 🎉', 'Promotional banner published successfully.');
      }

      setModalVisible(false);
      loadBanners();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    const updatedStatus = !banner.is_active;
    try {
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: updatedStatus } : b))
      );
      await apiClient.put(`/banners/${banner.id}`, { is_active: updatedStatus });
    } catch (err) {
      Alert.alert('Error', 'Could not update banner status');
      loadBanners();
    }
  };

  const handleDelete = (id: string, bannerTitle: string) => {
    Alert.alert('Delete Banner', `Are you sure you want to remove banner "${bannerTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/banners/${id}`);
            Alert.alert('Deleted', 'Banner deleted successfully.');
            loadBanners();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Could not delete banner');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Manage Banners</Text>
          <Text style={styles.headerSub}>Promotional sliders, heroes & marketing creatives</Text>
        </View>
        <TouchableOpacity style={styles.createHeaderBtn} onPress={openCreateModal}>
          <Icon name="plus" size={16} color="#fff" />
          <Text style={styles.createHeaderBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBanners(true)} colors={[colors.primary]} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.subtleText}>Loading banner directory...</Text>
          </View>
        ) : banners.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="image" size={48} color="#64748B" />
            <Text style={styles.emptyTitle}>No Banners Found</Text>
            <Text style={styles.emptySubText}>
              Create your first promotional carousel banner to showcase offers and loans.
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openCreateModal}>
              <Icon name="plus" size={16} color="#fff" />
              <Text style={styles.emptyAddBtnText}>Create Banner</Text>
            </TouchableOpacity>
          </View>
        ) : (
          banners.map((item) => (
            <View key={item.id} style={styles.bannerCard}>
              <View style={styles.imageBox}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.bannerImage} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Icon name="image" size={32} color="#64748B" />
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#10B981' : '#64748B' }]}>
                  <Text style={styles.statusBadgeText}>{item.is_active ? 'ACTIVE' : 'INACTIVE'}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.rowBetween}>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <Switch
                    value={item.is_active}
                    onValueChange={() => handleToggleActive(item)}
                    trackColor={{ false: '#334155', true: colors.primary }}
                  />
                </View>

                {item.description ? <Text style={styles.bannerDesc}>{item.description}</Text> : null}

                {item.link_url ? (
                  <Text style={styles.bannerLink} numberOfLines={1}>
                    🔗 {item.link_url}
                  </Text>
                ) : null}

                <View style={styles.cardActions}>
                  <Text style={styles.positionText}>Order Position: #{item.position || 1}</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                      <Icon name="edit" size={14} color="#38BDF8" />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.title)}>
                      <Icon name="trash" size={14} color="#EF4444" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* CREATE / EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBanner ? 'Edit Banner' : 'Create Banner'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="x" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image Picker */}
              <Text style={styles.inputLabel}>Banner Creative Image *</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickBannerImage}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage.uri }} style={styles.selectedPreview} resizeMode="cover" />
                ) : editingBanner?.image_url ? (
                  <Image source={{ uri: editingBanner.image_url }} style={styles.selectedPreview} resizeMode="cover" />
                ) : (
                  <View style={styles.uploadPrompt}>
                    <Icon name="upload-cloud" size={32} color={colors.primary} />
                    <Text style={styles.uploadPromptTitle}>Tap to select 16:9 creative</Text>
                    <Text style={styles.uploadPromptSub}>PNG, JPG, or WEBP</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Title */}
              <Text style={styles.inputLabel}>Banner Headline *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Instant Personal Loans at 10.49%"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />

              {/* Description */}
              <Text style={styles.inputLabel}>Sub-Text / Details</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                placeholder="Optional promotional description..."
                placeholderTextColor="#64748B"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              {/* Link URL */}
              <Text style={styles.inputLabel}>Redirect / Deep-link URL</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. /products/credit-cards or https://..."
                placeholderTextColor="#64748B"
                value={linkUrl}
                onChangeText={setLinkUrl}
              />

              {/* Position & Active */}
              <View style={styles.rowBetweenModal}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.inputLabel}>Display Position</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={position}
                    onChangeText={setPosition}
                  />
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.inputLabel}>Active Status</Text>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: '#334155', true: colors.primary }}
                  />
                </View>
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, saving && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalSubmitText}>{editingBanner ? 'Update Banner' : 'Publish Banner'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

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
    paddingVertical: 60,
  },
  subtleText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  bannerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  imageBox: {
    width: '100%',
    height: 160,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
    lineHeight: 18,
  },
  bannerLink: {
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  positionText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
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
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF444420',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 10,
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
  imagePickerBtn: {
    width: '100%',
    height: 150,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPreview: {
    width: '100%',
    height: '100%',
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  uploadPromptTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
  },
  uploadPromptSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  rowBetweenModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: spacing.lg,
    marginBottom: 10,
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
