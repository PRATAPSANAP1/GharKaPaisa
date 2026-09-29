import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export interface QueueHeaderProps {
  title: string;
  subtitle?: string;
  totalCount?: number;
  count?: number;
  pendingCount?: number;
  verifiedCount?: number;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onFilterPress?: () => void;
  hasActiveFilters?: boolean;
}

export const QueueHeader: React.FC<QueueHeaderProps> = ({
  title,
  subtitle,
  totalCount,
  count,
  pendingCount,
  verifiedCount,
  searchValue = '',
  onSearchChange = () => {},
  onFilterPress = () => {},
  hasActiveFilters,
}) => {
  const displayTotal = totalCount !== undefined ? totalCount : count || 0;

  return (
    <View style={styles.container}>
      {/* Title & Stats */}
      <View style={styles.titleRow}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{displayTotal}</Text>
        </View>
      </View>

      {/* KPI Badges if available */}
      {(pendingCount !== undefined || verifiedCount !== undefined) && (
        <View style={styles.statsRow}>
          {pendingCount !== undefined && (
            <View style={[styles.statBox, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.statLabel, { color: '#92400E' }]}>Pending</Text>
              <Text style={[styles.statValue, { color: '#92400E' }]}>{pendingCount}</Text>
            </View>
          )}

          {verifiedCount !== undefined && (
            <View style={[styles.statBox, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.statLabel, { color: colors.success }]}>Verified</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{verifiedCount}</Text>
            </View>
          )}
        </View>
      )}

      {/* Search Input and Filter Trigger */}
      <View style={styles.searchRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search App #, Name, Mobile, PAN..."
            placeholderTextColor={colors.textLight}
            value={searchValue}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchValue ? (
            <TouchableOpacity style={styles.clearBtn} onPress={() => onSearchChange('')}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={onFilterPress}
        >
          <Text style={[styles.filterIcon, hasActiveFilters && styles.filterIconActive]}>⚡ Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: spacing.radius.lg,
  },
  totalBadgeText: {
    color: '#FFF',
    fontWeight: typography.weights.extrabold,
    fontSize: typography.sizes.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.radius.sm,
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  statValue: {
    fontSize: 12,
    fontWeight: typography.weights.extrabold,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.text,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 12,
    color: colors.textLight,
  },
  filterBtn: {
    paddingHorizontal: spacing.sm,
    height: 40,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primary,
  },
  filterIcon: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  filterIconActive: {
    color: '#FFF',
  },
});

export default QueueHeader;
