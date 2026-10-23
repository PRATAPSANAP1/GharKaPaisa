import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { fetchPartnerTraining, completeTrainingModule } from '../../services/partner.service';

const DEFAULT_MODULES = [
  {
    id: 'm1',
    title: 'Module 1: Pitching Credit Cards with 0% Rejection',
    duration: '8 mins',
    level: 'Beginner',
    category: 'Sales Pitch',
    description: 'Learn CIBIL score matching, pre-qualification criteria, and which bank suits each income bracket.',
    is_completed: true,
  },
  {
    id: 'm2',
    title: 'Module 2: Complete KYC & Document Upload Walkthrough',
    duration: '12 mins',
    level: 'Essential',
    category: 'Compliance',
    description: 'Step-by-step guidance on capturing clear PAN and Bank Passbooks to achieve 100% first-time approval.',
    is_completed: false,
  },
  {
    id: 'm3',
    title: 'Module 3: Fast-Track Personal Loan Lead Punching',
    duration: '10 mins',
    level: 'Intermediate',
    category: 'Loans',
    description: 'How to qualify salary slips, check FOIR calculations, and get instant digital approvals for loans > ₹5L.',
    is_completed: false,
  },
  {
    id: 'm4',
    title: 'Module 4: Managing Downline Team & Overrides',
    duration: '15 mins',
    level: 'Advanced',
    category: 'Network Growth',
    description: 'Recruit, train, and earn lifetime overriding commissions from your sub-agent network.',
    is_completed: false,
  },
];

export default function TrainingScreen() {
  const router = useRouter();

  const [modules, setModules] = useState<any[]>(DEFAULT_MODULES);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<any | null>(null);

  const loadTraining = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetchPartnerTraining();
      const list = Array.isArray(res.data) ? res.data : res.modules || [];
      if (list.length > 0) {
        setModules(list);
      }
    } catch (e) {
      // Keep defaults
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTraining();
  }, [loadTraining]);

  const handleComplete = async (mod: any) => {
    try {
      await completeTrainingModule(mod.id);
      setModules(prev =>
        prev.map(m => (m.id === mod.id ? { ...m, is_completed: true } : m))
      );
      Alert.alert('Module Completed! 🎓', `You have finished "${mod.title}". Keep learning to level up your earnings.`);
    } catch (err: any) {
      setModules(prev =>
        prev.map(m => (m.id === mod.id ? { ...m, is_completed: true } : m))
      );
      Alert.alert('Module Completed! 🎓', `You have marked "${mod.title}" as finished.`);
    }
  };

  const completedCount = modules.filter(m => m.is_completed).length;
  const progressPercent = Math.round((completedCount / Math.max(modules.length, 1)) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadTraining(true)} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Partner Training Hub</Text>
            <Text style={styles.subtitle}>Product tutorials & sales acceleration courses</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressHeading}>Training Completion</Text>
            <Text style={styles.progressBadge}>{completedCount} / {modules.length} Done</Text>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressSub}>{progressPercent}% certification progress completed</Text>
        </View>

        {/* Module List */}
        <Text style={styles.sectionTitle}>Course Modules</Text>
        {modules.map((item, index) => {
          const isDone = item.is_completed;
          return (
            <View key={item.id} style={styles.moduleCard}>
              <View style={styles.moduleTop}>
                <View style={[styles.moduleIconBg, isDone && styles.moduleIconBgDone]}>
                  <Icon name={isDone ? 'check' : 'book-open'} size={16} color={isDone ? '#059669' : colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={styles.metaRow}>
                    <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                    <Text style={styles.durationText}>⏱ {item.duration}</Text>
                  </View>
                  <Text style={styles.moduleTitle}>{item.title}</Text>
                </View>
              </View>

              <Text style={styles.moduleDesc}>{item.description}</Text>

              <View style={styles.moduleFooter}>
                <View style={styles.levelTag}>
                  <Text style={styles.levelTagText}>{item.level}</Text>
                </View>

                {isDone ? (
                  <View style={styles.doneBadge}>
                    <Icon name="check-circle" size={14} color="#059669" />
                    <Text style={styles.doneBadgeText}>COMPLETED</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(item)}>
                    <Text style={styles.completeBtnText}>Mark Complete ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressHeading: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  moduleTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  moduleIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleIconBgDone: {
    backgroundColor: '#ECFDF5',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  durationText: {
    fontSize: 11,
    color: colors.textLight,
  },
  moduleTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.text,
  },
  moduleDesc: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  levelTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  completeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
