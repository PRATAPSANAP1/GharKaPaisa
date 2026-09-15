import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadKycFile } from '../services/kyc.service';

const DocumentUploadPicker = ({ label, documentType, onUploadSuccess, currentUrl }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState(currentUrl || null);

  const pickAndUploadImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Media library access is needed to upload documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        setUploading(true);

        const fileName = asset.uri.split('/').pop() || `${documentType}_${Date.now()}.jpg`;
        const uploadRes = await uploadKycFile(documentType, asset.uri, fileName, 'image/jpeg');

        if (uploadRes?.success) {
          Alert.alert('Success', `${label} uploaded successfully.`);
          if (typeof onUploadSuccess === 'function') {
            onUploadSuccess(uploadRes.data);
          }
        }
      }
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={[styles.uploadBox, previewUri && styles.uploadedBox]} 
        onPress={pickAndUploadImage}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#0284C7" />
        ) : previewUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
            <Text style={styles.uploadedText}>✓ Uploaded (Tap to replace)</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.emptyText}>Tap to upload {label}</Text>
            <Text style={styles.subText}>JPEG, PNG or PDF (Max 5MB)</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6
  },
  uploadBox: {
    height: 110,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  uploadedBox: {
    borderColor: '#10B981',
    borderStyle: 'solid',
    backgroundColor: '#F0FDF4'
  },
  emptyContainer: {
    alignItems: 'center'
  },
  uploadIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7'
  },
  subText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6
  },
  previewImage: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    marginBottom: 4
  },
  uploadedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  }
});

export default DocumentUploadPicker;
