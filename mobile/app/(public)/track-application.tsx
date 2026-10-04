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
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import apiClient from '../../services/api';

export default function TrackApplicationScreen() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrack = async () => {
    if (!identifier.trim()) {
      setErrorMsg('Please enter Application ID or Mobile Number');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setApplicationData(null);

    try {
      // Try fetching by application reference or phone search
      const res = await apiClient.get('/applications/track', {
        params: { identifier: identifier.trim() },
      }).catch(async () => {
        return await apiClient.get(`/applications/search?query=${identifier.trim()}`);
      });

      if (res?.data?.success && res?.data?.data) {
        setApplicationData(res.data.data);
      } else if (res?.data?.application) {
        setApplicationData(res.data.application);
      } else if (Array.isArray(res?.data) && res.data.length > 0) {
        setApplicationData(res.data[0]);
      } else {
        setErrorMsg('No application found with the provided details. Please verify and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Application not found. Please verify your reference ID.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toUpperCase();
    if (['APPROVED', 'DISBURSED', 'CARD_ISSUED', 'SUCCESS'].includes(s)) return '#10B981';
    if (['REJECTED', 'DECLINED', 'CANCELLED'].includes(s)) return '#EF4444';
    if (['IN_REVIEW', 'DOCUMENT_VERIFICATION', 'VKYC_PENDING', 'PROCESSING'].includes(s)) return '#3B82F6';
    return '#F59E0B';
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>CUSTOMER SELF-SERVICE</Text>
          <Text style={styles.headerTitle}>Track Application</Text>
        </View>
      </View>

      {/* Search Card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Application Status Tracker</Text>
        <Text style={styles.cardSubtitle}>
          Enter your Application Reference Number or 10-digit registered mobile number to check real-time approval status.
        </Text>

        <Text style={styles.inputLabel}>Application ID or Mobile Number</Text>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. APP100234 or 9876543210"
            placeholderTextColor={colors.textLight}
            value={identifier}
            onChangeText={(t) => {
              setIdentifier(t);
              setErrorMsg(null);
            }}
            autoCapitalize="characters"
          />
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Icon name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <Button
          title="Track Status"
          onPress={handleTrack}
          loading={loading}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      {/* Result Card */}
      {applicationData && (
        <Card style={[styles.card, { marginTop: spacing.md }]}>
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.productName}>
                {applicationData.product_name || applicationData.card_name || 'Credit / Loan Product'}
              </Text>
              <Text style={styles.bankName}>
                {applicationData.bank_name || 'Partnered Bank'} • App ID: {applicationData.app_number || applicationData.id?.substring(0, 8)}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(applicationData.status)}20` },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(applicationData.status) },
                ]}
              >
                {(applicationData.status || 'PROCESSING').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Applicant Name</Text>
              <Text style={styles.detailValue}>
                {applicationData.customer_name || applicationData.full_name || 'Customer'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Applied Date</Text>
              <Text style={styles.detailValue}>
                {new Date(applicationData.created_at || Date.now()).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {applicationData.remark && (
            <View style={styles.remarkBox}>
              <Text style={styles.remarkLabel}>Latest Bank Update</Text>
              <Text style={styles.remarkText}>{applicationData.remark}</Text>
            </View>
          )}

          {/* Live Progress Stage */}
          <View style={styles.progressTracker}>
            <Text style={styles.progressTitle}>Application Lifecycle</Text>
            <View style={styles.stagesRow}>
              {['Submitted', 'Document Verification', 'Bank Review', 'Final Decision'].map(
                (st, i) => (
                  <View key={st} style={styles.stageStep}>
                    <View style={[styles.stageDot, i === 0 && styles.activeDot]}>
                      <Text style={styles.stageDotText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stageStepName}>{st}</Text>
                  </View>
                )
              )}
            </View>
          </View>
        </Card>
      )}
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
    fontSize: 22,
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
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    padding: 0,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: spacing.sm,
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  bankName: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailsGrid: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  detailItem: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: spacing.sm,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  remarkBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  remarkLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  remarkText: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 2,
  },
  progressTracker: {
    marginTop: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  stagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageStep: {
    alignItems: 'center',
    flex: 1,
  },
  stageDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeDot: {
    backgroundColor: colors.primary,
  },
  stageDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  stageStepName: {
    fontSize: 9,
    color: colors.textLight,
    textAlign: 'center',
  },
});
