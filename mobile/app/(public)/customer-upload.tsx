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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { uploadCustomerDocument } from '../../services/application.service';

export default function CustomerUploadScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [tokenInput, setTokenInput] = useState(params.token || '');
  const [docType, setDocType] = useState('PAN_CARD');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

  const handleSimulatePick = () => {
    // Pick photo / document
    setSelectedFile(`doc_${docType.toLowerCase()}_${Date.now()}.pdf`);
  };

  const handleUpload = async () => {
    if (!tokenInput.trim()) {
      Alert.alert('Required', 'Please enter your Upload Token or Application Reference Number.');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Required', 'Please select a document file to upload.');
      return;
    }

    setUploading(true);
    try {
      await uploadCustomerDocument(tokenInput.trim(), {
        document_type: docType,
        file_name: selectedFile,
        uploaded_at: new Date().toISOString(),
      });

      setUploadedDocs((prev) => [...prev, docType]);
      setSelectedFile(null);
      Alert.alert('Uploaded', `${docType.replace('_', ' ')} has been uploaded successfully for verification.`);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload document.');
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
        <TouchableOpacity style={styles.pickerBox} onPress={handleSimulatePick}>
          <Icon name="upload-cloud" size={32} color={colors.primaryLight} />
          <Text style={styles.pickerTitle}>
            {selectedFile ? selectedFile : 'Tap to Choose File (PDF, JPG, PNG)'}
          </Text>
          <Text style={styles.pickerSubtitle}>Max file size: 10MB • Clear & Readable scan</Text>
        </TouchableOpacity>

        <Button
          title="Upload Document"
          onPress={handleUpload}
          loading={uploading}
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
  pickerSubtitle: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
});
