import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Button } from '../Button';

export interface QueueFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: {
    status?: string;
    kyc_status?: string;
    vkyc_stage?: string;
    start_date?: string;
    end_date?: string;
  }) => void;
  onReset: () => void;
  initialFilters?: {
    status?: string;
    kyc_status?: string;
    vkyc_stage?: string;
    start_date?: string;
    end_date?: string;
  };
}

export const QueueFilterSheet: React.FC<QueueFilterSheetProps> = ({
  visible,
  onClose,
  onApply,
  onReset,
  initialFilters = {},
}) => {
  const [status, setStatus] = useState(initialFilters.status || '');
  const [kycStatus, setKycStatus] = useState(initialFilters.kyc_status || '');
  const [vkycStage, setVkycStage] = useState(initialFilters.vkyc_stage || '');
  const [startDate, setStartDate] = useState(initialFilters.start_date || '');
  const [endDate, setEndDate] = useState(initialFilters.end_date || '');

  const STATUS_OPTIONS = [
    { label: 'All Statuses', value: '' },
    { label: 'Details Submitted', value: 'details_submitted' },
    { label: 'Operational Verified', value: 'operational_verified' },
    { label: 'In Process', value: 'in_process' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const KYC_STATUS_OPTIONS = [
    { label: 'All KYC', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Verified', value: 'verified' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const handleApply = () => {
    onApply({
      status: status || undefined,
      kyc_status: kycStatus || undefined,
      vkyc_stage: vkycStage || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setStatus('');
    setKycStatus('');
    setVkycStage('');
    setStartDate('');
    setEndDate('');
    onReset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter Operational Queue</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetContent}>
            {/* Application Status Filter */}
            <Text style={styles.sectionLabel}>Application Status</Text>
            <View style={styles.chipRow}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, status === opt.value && styles.chipActive]}
                  onPress={() => setStatus(opt.value)}
                >
                  <Text style={[styles.chipText, status === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* KYC Status Filter */}
            <Text style={styles.sectionLabel}>KYC Status</Text>
            <View style={styles.chipRow}>
              {KYC_STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, kycStatus === opt.value && styles.chipActive]}
                  onPress={() => setKycStatus(opt.value)}
                >
                  <Text style={[styles.chipText, kycStatus === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stage Search Input */}
            <Text style={styles.sectionLabel}>VKYC Stage / Keyword</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Vkyc pending, Bio pending..."
              placeholderTextColor={colors.textLight}
              value={vkycStage}
              onChangeText={setVkycStage}
            />

            {/* Date Filters */}
            <Text style={styles.sectionLabel}>Date Range (YYYY-MM-DD)</Text>
            <View style={styles.dateRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Start Date"
                placeholderTextColor={colors.textLight}
                value={startDate}
                onChangeText={setStartDate}
              />
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="End Date"
                placeholderTextColor={colors.textLight}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Button title="Reset" onPress={handleReset} variant="outline" style={{ flex: 1 }} />
            <Button title="Apply Filters" onPress={handleApply} style={{ flex: 2 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: spacing.radius.lg,
    borderTopRightRadius: spacing.radius.lg,
    maxHeight: '80%',
    padding: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.extrabold,
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.textLight,
  },
  sheetContent: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMid,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: spacing.radius.sm,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  chipTextActive: {
    color: '#FFF',
  },
  textInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radius.md,
    paddingHorizontal: spacing.sm,
    height: 42,
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
});

export default QueueFilterSheet;
