import { colors } from './colors';
import { spacing } from './spacing';

// Premium elevation system — soft, layered shadows for dark UI
export const shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  goldGlow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Reusable premium surface styles
export const surfaces = {
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardElevated: {
    backgroundColor: colors.cardElevated,
    borderRadius: spacing.radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  glass: {
    backgroundColor: 'rgba(19, 31, 56, 0.72)',
    borderRadius: spacing.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chip: {
    borderRadius: spacing.radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
};
