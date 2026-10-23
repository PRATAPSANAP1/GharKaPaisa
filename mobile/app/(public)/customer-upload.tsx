import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { uploadCustomerDocument } from '../../services/application.service';

interface PickedFile {
  uri: string;
  name: string;
  size: number;
  type: string;
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function CustomerUploadScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [tokenInput, setTokenInput] = useState(params.token || '');
  const [docType, setDocType] = useState('PAN_CARD');
  const [selectedFile, setSelectedFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [showSourceModal, setShowSourceModal] = useState(false);

  const processSelectedFile = async (uri: string, name?: string, mimeType?: string, fileSize?: number) => {
    try {
      let resolvedSize = fileSize;
      if (!resolvedSize) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        resolvedSize = fileInfo.exists ? fileInfo.size : 0;
      }

      const MAX_SIZE = 5 * 1024 * 1024; // 5MB (server-side portal controller limit)
      if (resolvedSize > MAX_SIZE) {
        Alert.alert('File Too Large', 'Maximum file size is 5MB. Please select a smaller file.');
        return;
      }

      const fileName = name || uri.split('/').pop() || `${docType.toLowerCase()}_${Date.now()}.jpg`;
      const detectedType = mimeType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      setSelectedFile({
        uri,
        name: fileName,
        size: resolvedSize,
        type: detectedType,
      });
    } catch (err: any) {
      console.error('File processing error:', err);
      Alert.alert('File Error', 'Could not read selected file.');
    }
  };

  const handlePickDocument = async () => {
    setShowSourceModal(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      await processSelectedFile(asset.uri, asset.name, asset.mimeType, asset.size);
    } catch (err: any) {
      console.error('Document picker error:', err);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    setShowSourceModal(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is required to take photo proofs.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const fileName = `${docType.toLowerCase()}_${Date.now()}.jpg`;
      await processSelectedFile(asset.uri, fileName, 'image/jpeg', asset.fileSize);
    } catch (err: any) {
      console.error('Camera error:', err);
      Alert.alert('Error', 'Failed to capture photo with camera.');
    }
  };

  const handlePickFromGallery = async () => {
    setShowSourceModal(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is required to choose photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.fileName || `${docType.toLowerCase()}_${Date.now()}.jpg`;
      await processSelectedFile(asset.uri, fileName, asset.mimeType || 'image/jpeg', asset.fileSize);
    } catch (err: any) {
      console.error('Gallery picker error:', err);
      Alert.alert('Error', 'Failed to select image from photo library.');
    }
  };

  const handleUpload = async () => {
    if (!tokenInput.trim()) {
      Alert.alert('Required', 'Please enter your Upload Token or Application Reference ID.');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Required', 'Please select a document or capture a photo first.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document_type', docType);
      formData.append('document', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.type,
      } as any);

      await uploadCustomerDocument(tokenInput.trim(), formData);

      setUploadedDocs((prev) => [...prev, docType]);
      const uploadedName = selectedFile.name;
      setSelectedFile(null);
      Alert.alert('Uploaded Successfully', `${docType.replace('_', ' ')} (${uploadedName}) uploaded for verification.`);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload document.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const docOptions = [
    { key: 'PAN_CARD', label: 'PAN Card Copy' },
    { key: 'AADHAAR_CARD', label: 'Aadhaar Card (Front/Back)' },
    { key: 'SALARY_SLIP', label: 'Latest 3 Months Salary Slip' },
    { key: 'BANK_STATEMENT', label: '6 Months Bank Statement' },
    { key: 'ELECTRICITY_BILL', label: 'Utility Bill (Address Proof)' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>CUSTOMER SELF-SERVICE</Text>
          <Text style={styles.headerTitle}>Document Upload Desk</Text>
        </View>
      </View>

      {/* Main Card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Upload Verification Proofs</Text>
        <Text style={styles.cardSubtitle}>
          Upload documents securely to fast-track your credit card or loan sanction.
        </Text>

        <Text style={styles.inputLabel}>Upload Token / Application Reference ID *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. APP100293 or token_xyz"
          placeholderTextColor={colors.textLight}
          value={tokenInput}
          onChangeText={setTokenInput}
          autoCapitalize="characters"
        />

        <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Select Document Type *</Text>
        <View style={styles.docTypeGrid}>
          {docOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.docTypeBtn,
                docType === opt.key && styles.activeDocTypeBtn,
              ]}
              onPress={() => setDocType(opt.key)}
            >
              <Text
                style={[
                  styles.docTypeBtnText,
                  docType === opt.key && styles.activeDocTypeBtnText,
                ]}
              >
                {opt.label}
              </Text>
              {uploadedDocs.includes(opt.key) && (
                <Icon name="check-circle" size={14} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* File Picker Box */}
        <TouchableOpacity style={styles.pickerBox} onPress={() => setShowSourceModal(true)}>
          <Icon name="upload-cloud" size={32} color={colors.primaryLight} />
          <Text style={styles.pickerTitle}>
            {selectedFile ? selectedFile.name : 'Tap to Choose / Capture Document'}
          </Text>
          {selectedFile ? (
            <Text style={styles.pickerInfo}>
              {formatFileSize(selectedFile.size)} • {selectedFile.type}
            </Text>
          ) : (
            <Text style={styles.pickerSubtitle}>Camera Photo • PDF • JPG • PNG (Max 10MB)</Text>
          )}
        </TouchableOpacity>

        <Button
          title="Upload Document"
          onPress={handleUpload}
          loading={uploading}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      {/* Document Source Modal */}
      <Modal visible={showSourceModal} transparent animationType="fade" onRequestClose={() => setShowSourceModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowSourceModal(false)}>
          <View style={styles.sourceModalContent}>
            <Text style={styles.sourceModalTitle}>Select Document Source</Text>
            <Text style={styles.sourceModalSubtitle}>Upload {docType.replace('_', ' ')}</Text>

            <TouchableOpacity style={styles.sourceOptionBtn} onPress={handleTakePhoto}>
              <View style={[styles.sourceIconWrap, { backgroundColor: '#3B82F620' }]}>
                <Icon name="camera" size={20} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sourceOptionTitle}>Take Photo</Text>
                <Text style={styles.sourceOptionDesc}>Capture clear photo with device camera</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sourceOptionBtn} onPress={handlePickFromGallery}>
              <View style={[styles.sourceIconWrap, { backgroundColor: '#10B98120' }]}>
                <Icon name="image" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sourceOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.sourceOptionDesc}>Select an existing image from photos</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sourceOptionBtn} onPress={handlePickDocument}>
              <View style={[styles.sourceIconWrap, { backgroundColor: '#8B5CF620' }]}>
                <Icon name="file-text" size={20} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sourceOptionTitle}>Browse File / PDF</Text>
                <Text style={styles.sourceOptionDesc}>Pick PDF document or scan from storage</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelSourceBtn} onPress={() => setShowSourceModal(false)}>
              <Text style={styles.cancelSourceBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    fontSize: 20,
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
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
    marginBottom: spacing.xs,
  },
  docTypeGrid: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  docTypeBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeDocTypeBtn: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  docTypeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeDocTypeBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  pickerBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#334155',
    padding: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  pickerInfo: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  pickerSubtitle: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sourceModalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sourceModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  sourceModalSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  sourceOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
    gap: spacing.md,
  },
  sourceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  sourceOptionDesc: {
    fontSize: 11,
    color: colors.textLight,
  },
  cancelSourceBtn: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  cancelSourceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
