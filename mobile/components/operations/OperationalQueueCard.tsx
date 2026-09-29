import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card } from '../Card';
import { StatusBadge } from '../StatusBadge';

export interface OperationalQueueCardProps {
  item?: any;
  application?: any;
  userDesignation?: string;
  onPress: () => void;
  onAction?: (actionType: string) => void;
  showOperatorInfo?: boolean;
  showFinalStatus?: boolean;
  showDispatchStage?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const OperationalQueueCard: React.FC<OperationalQueueCardProps> = ({
  item,
  application,
  userDesignation = '',
  onPress,
  onAction,
  style,
}) => {
  const appItem = item || application || {};
  // Privacy Helper: Mask Mobile
  const maskMobile = (num?: string) => {
    if (!num || num === 'N/A') return 'N/A';
    const clean = num.replace(/\D/g, '');
    if (clean.length < 10) return num;
    return `${clean.slice(0, 2)}XXXXXX${clean.slice(8)}`;
  };

  // Privacy Helper: Mask PAN
  const maskPan = (pan?: string) => {
    if (!pan || pan === 'N/A') return 'N/A';
    if (pan.length !== 10) return pan;
    return `${pan.slice(0, 2)}****${pan.slice(6)}`;
  };

  const formattedDate = appItem.created_at || appItem.submitted_at
    ? new Date(appItem.created_at || appItem.submitted_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const desigUpper = (userDesignation || '').toUpperCase();
  const isKycOp = desigUpper.includes('KYC');
  const isPanChecker = desigUpper.includes('PAN');
  const isQdOp = desigUpper.includes('QD');
  const isRemarkOp = desigUpper.includes('REMARK');
  const isFinalOp = desigUpper.includes('FINAL');

  return (
    <Card style={[styles.cardContainer, style]} onPress={onPress}>
      {/* Header Row: App # and Status Badge */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.appNumberText}>
            {appItem.app_number || appItem.application_number || `APP-${(appItem.id || '').slice(0, 8)}`}
          </Text>
          {appItem.bank_application_number && appItem.bank_application_number !== 'N/A' && (
            <Text style={styles.bankRefText}>Bank Ref: {appItem.bank_application_number}</Text>
          )}
        </View>
        <StatusBadge status={appItem.status || appItem.application_status || 'details_submitted'} />
      </View>

      {/* Main Info Section */}
      <View style={styles.infoGrid}>
        {/* Customer & Contact */}
        <View style={styles.infoCol}>
          <Text style={styles.label}>Customer Name</Text>
          <Text style={styles.valueText}>{appItem.customer_name || appItem.full_name || 'Customer'}</Text>
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.label}>Masked Mobile</Text>
          <Text style={styles.valueText}>{maskMobile(appItem.customer_mobile || appItem.mobile)}</Text>
        </View>

        {/* Bank & Product */}
        <View style={styles.infoCol}>
          <Text style={styles.label}>Bank / Product</Text>
          <Text style={styles.valueText} numberOfLines={1}>
            {appItem.bank_name || 'Bank'} • {appItem.product_name || 'Product'}
          </Text>
        </View>

        {/* PAN / Stage */}
        <View style={styles.infoCol}>
          <Text style={styles.label}>Masked PAN</Text>
          <Text style={[styles.valueText, styles.panText]}>
            {maskPan(appItem.pan_number || appItem.pan)}
          </Text>
        </View>
      </View>

      {/* Stage & Operator Badges */}
      <View style={styles.badgeRow}>
        {appItem.vkyc_stage || appItem.kyc_stage ? (
          <View style={[styles.miniBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Text style={[styles.miniBadgeText, { color: colors.info }]}>
              KYC: {appItem.vkyc_stage || appItem.kyc_stage}
            </Text>
          </View>
        ) : null}

        {appItem.soft_approval_status ? (
          <View style={[styles.miniBadge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.miniBadgeText, { color: '#92400E' }]}>
              Soft Appr: {appItem.soft_approval_status}
            </Text>
          </View>
        ) : null}

        {appItem.currently_working_by || appItem.admin_code ? (
          <View style={[styles.miniBadge, { backgroundColor: colors.bgSecondary }]}>
            <Text style={[styles.miniBadgeText, { color: colors.textMid }]}>
              Op: {appItem.currently_working_by || appItem.admin_code}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Quick Action Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.dateText}>{formattedDate}</Text>

        <View style={styles.actionButtonGroup}>
          {onAction && isKycOp && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => onAction('VERIFY_KYC')}
            >
              <Text style={styles.actionBtnText}>Verify KYC</Text>
            </TouchableOpacity>
          )}

          {onAction && isPanChecker && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.info }]}
              onPress={() => onAction('VERIFY_PAN')}
            >
              <Text style={styles.actionBtnText}>Check PAN</Text>
            </TouchableOpacity>
          )}

          {onAction && isQdOp && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => onAction('UPDATE_QD')}
            >
              <Text style={styles.actionBtnText}>QD Update</Text>
            </TouchableOpacity>
          )}

          {onAction && isRemarkOp && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.warning }]}
              onPress={() => onAction('UPDATE_REMARK')}
            >
              <Text style={styles.actionBtnText}>Add Remark</Text>
            </TouchableOpacity>
          )}

          {onAction && isFinalOp && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={() => onAction('FINAL_STATUS')}
            >
              <Text style={styles.actionBtnText}>Final Action</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.detailsBtn} onPress={onPress}>
            <Text style={styles.detailsBtnText}>360° View →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  appNumberText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.extrabold,
    color: colors.primary,
  },
  bankRefText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoCol: {
    width: '50%',
    paddingRight: spacing.xs,
  },
  label: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: 1,
  },
  panText: {
    letterSpacing: 1,
    color: colors.primaryDark,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.extrabold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateText: {
    fontSize: 11,
    color: colors.textLight,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: spacing.radius.sm,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  detailsBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
  },
  detailsBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
});

export default OperationalQueueCard;
