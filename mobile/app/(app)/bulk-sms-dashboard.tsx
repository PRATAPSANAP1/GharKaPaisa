import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Campaign {
  id: string;
  campaign_name: string;
  template_id?: string;
  sender_id?: string;
  status: string;
  total_recipients?: number;
  valid_recipients?: number;
  sent_count?: number;
  delivered_count?: number;
  failed_count?: number;
  pending_count?: number;
  scheduled_at?: string;
  created_at?: string;
}

interface Template {
  id: string;
  name: string;
  provider?: string;
  provider_template_id?: string;
  sender_id?: string;
  content?: string;
  template_type?: string;
  approval_status?: string;
  variables?: unknown;
  preview_url?: string;
}

export default function BulkSmsDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates'>('campaigns');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'campaigns') {
        const response = await apiClient.get('/superadmin/bulk-sms/campaigns', {
          params: { limit: '50' },
        });
        setCampaigns(response.data?.data || []);
      } else {
        const response = await apiClient.get('/superadmin/bulk-sms/templates');
        setTemplates(response.data?.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    Alert.alert(
      'Send Campaign',
      'Are you sure you want to send this campaign now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'default',
          onPress: async () => {
            try {
              await apiClient.post(`/superadmin/bulk-sms/campaigns/${campaignId}/send`);
              fetchData();
              Alert.alert('Success', 'Campaign triggered successfully');
            } catch (error) {
              console.error('Failed to send campaign:', error);
              Alert.alert('Error', 'Failed to send campaign');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bulk SMS Dashboard</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'campaigns' && styles.tabActive]}
          onPress={() => setActiveTab('campaigns')}
        >
          <Text style={[styles.tabText, activeTab === 'campaigns' && styles.tabTextActive]}>
            Campaigns
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
            Templates
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'campaigns' ? (
        <View style={styles.contentContainer}>
          {campaigns.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No campaigns found</Text>
            </View>
          ) : (
            campaigns.map((campaign) => (
              <View key={campaign.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{campaign.campaign_name}</Text>
                    <Text style={styles.cardSubtitle}>
                      {campaign.total_recipients ?? 0} recipients
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(campaign.status) }
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {(campaign.status || 'DRAFT').charAt(0).toUpperCase() + (campaign.status || 'DRAFT').slice(1).toLowerCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{campaign.sent_count ?? 0}</Text>
                    <Text style={styles.statLabel}>Sent</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{campaign.delivered_count ?? 0}</Text>
                    <Text style={styles.statLabel}>Delivered</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{campaign.failed_count ?? 0}</Text>
                    <Text style={styles.statLabel}>Failed</Text>
                  </View>
                </View>

                {!!campaign.scheduled_at && (
                  <Text style={styles.scheduledText}>
                    Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => handleSendCampaign(campaign.id)}
                >
                  <Text style={styles.sendButtonText}>Send Now</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {templates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No templates found</Text>
            </View>
          ) : (
            templates.map((template) => (
              <View key={template.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{template.name}</Text>
                    <Text style={styles.cardSubtitle}>
                      {template.provider_template_id || '—'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getApprovalColor(template.approval_status) }
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {(template.approval_status || 'pending').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.templateContent}>
                  <Text style={styles.templateText} numberOfLines={3}>
                    {template.content || ''}
                  </Text>
                </View>

                <Text style={styles.scheduledText}>
                  {template.provider || 'MSG91'} • {template.sender_id || 'GHARKP'}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const getStatusColor = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'COMPLETED': return '#10B981';
    case 'SCHEDULED': return '#3B82F6';
    case 'SENDING':
    case 'PROCESSING': return '#F59E0B';
    case 'FAILED':
    case 'REJECTED': return '#EF4444';
    default: return '#6B7280';
  }
};

const getApprovalColor = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'approved': return '#10B981';
    case 'pending': return '#F59E0B';
    case 'rejected': return '#EF4444';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: typography.sizes.sm,
  },
  header: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.md,
    color: colors.textLight,
    fontWeight: typography.weights.semibold,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textLight,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  scheduledText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 12,
  },
  templateContent: {
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: 8,
  },
  templateText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
