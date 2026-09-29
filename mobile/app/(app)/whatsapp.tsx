import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card, Button, LoadingState, ErrorState, StatusBadge } from '../../components';
import { Icon } from '../../components/Icon';
import { whatsappService } from '../../services/whatsapp.service';
import {
  WhatsAppRecipient,
  WhatsAppRecipientType,
  WhatsAppTemplate,
  WhatsAppMessage,
  WhatsAppDeliveryStatus,
} from '../../types';

export default function WhatsAppScreen() {
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');

  // Recipient Search State
  const [recipientType, setRecipientType] = useState<WhatsAppRecipientType>('CUSTOMER');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WhatsAppRecipient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<WhatsAppRecipient | null>(null);

  // Template & Message Composition State
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Document Attachment State
  const [includeDocument, setIncludeDocument] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  // Send State
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Audit History State
  const [historyMessages, setHistoryMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshingHistory, setRefreshingHistory] = useState(false);

  // Search Debounce Ref
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch Templates on Mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const list = await whatsappService.fetchTemplates();
      setTemplates(list);
      if (list.length > 0) {
        setSelectedTemplate(list[0]);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Debounced Search Handler
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text, recipientType);
    }, 400); // 400ms Debounce
  };

  const performSearch = async (query: string, type: WhatsAppRecipientType) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      if (type === 'CUSTOMER') {
        const results = await whatsappService.searchApplications(query);
        setSearchResults(results);
      } else {
        const results = await whatsappService.searchStaff(query);
        setSearchResults(results);
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        Alert.alert('Rate Limit Exceeded', 'Too many requests. Please wait a moment before searching again.');
      }
    } finally {
      setSearching(false);
    }
  };

  // Switch Recipient Type
  const handleRecipientTypeChange = (type: WhatsAppRecipientType) => {
    setRecipientType(type);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedRecipient(null);
  };

  // Select Recipient
  const handleSelectRecipient = (rec: WhatsAppRecipient) => {
    setSelectedRecipient(rec);
    setSearchResults([]);
    setSearchQuery('');

    // Pre-fill variable defaults
    setTemplateVariables((prev) => ({
      ...prev,
      customer_name: rec.name,
      application_id: rec.app_number || rec.id || 'N/A',
      status: rec.status || 'KYC Pending',
    }));
  };

  // Select Template
  const handleSelectTemplate = (tpl: WhatsAppTemplate) => {
    setSelectedTemplate(tpl);
  };

  // Send WhatsApp Message
  const handleSendMessage = async () => {
    if (!selectedRecipient || !selectedTemplate || sending) return;

    if (!selectedRecipient.mobile) {
      Alert.alert('Error', 'Selected recipient does not have a valid mobile number.');
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      if (includeDocument && documentUrl.trim() && documentName.trim()) {
        await whatsappService.sendDocumentMessage({
          recipient_mobile: selectedRecipient.mobile,
          recipient_name: selectedRecipient.name,
          recipient_type: recipientType,
          document_url: documentUrl.trim(),
          document_name: documentName.trim(),
          application_id: selectedRecipient.id,
        });
      } else {
        await whatsappService.sendTemplateMessage({
          template_name: selectedTemplate.template_name,
          recipient_mobile: selectedRecipient.mobile,
          recipient_name: selectedRecipient.name,
          recipient_type: recipientType,
          variables: {
            ...templateVariables,
            customer_name: selectedRecipient.name,
          },
          application_id: selectedRecipient.id,
        });
      }

      Alert.alert('Success', `WhatsApp message dispatched successfully to ${selectedRecipient.name}.`);
      setSelectedRecipient(null);
      setDocumentName('');
      setDocumentUrl('');
      setIncludeDocument(false);
    } catch (err: any) {
      let msg = 'Failed to send WhatsApp message. Please try again.';
      if (err.response?.status === 429) {
        msg = 'Too many requests. Please wait a moment and try again.';
      } else if (err.response?.status === 403) {
        msg = err.response?.data?.message || 'Access denied: You do not have permission to send this message.';
      } else if (err.message) {
        msg = err.message;
      }
      setSendError(msg);
    } finally {
      setSending(false);
    }
  };

  // Fetch History Messages
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await whatsappService.fetchMessageHistory({ page: 1, limit: 30 });
      setHistoryMessages(res.messages);
    } catch (err) {
      console.error('Failed to load WhatsApp message history:', err);
    } finally {
      setLoadingHistory(false);
      setRefreshingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const handleRefreshHistory = () => {
    setRefreshingHistory(true);
    loadHistory();
  };

  const getStatusBadgeProps = (status: WhatsAppDeliveryStatus) => {
    switch (status) {
      case 'READ':
        return { label: 'READ', color: '#10B981' };
      case 'DELIVERED':
        return { label: 'DELIVERED', color: '#14B8A6' };
      case 'SENT':
        return { label: 'SENT', color: '#3B82F6' };
      case 'FAILED':
        return { label: 'FAILED', color: '#EF4444' };
      default:
        return { label: status, color: '#64748B' };
    }
  };

  const renderHistoryItem = ({ item }: { item: WhatsAppMessage }) => {
    const badge = getStatusBadgeProps(item.status);
    return (
      <Card style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.historyRecipientName}>{item.recipient_name}</Text>
            <Text style={styles.historyMobile}>{item.recipient_mobile}</Text>
          </View>

          <View style={[styles.statusTag, { backgroundColor: `${badge.color}20` }]}>
            <Text style={[styles.statusTagText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <Text style={styles.historyBody} numberOfLines={3}>
          {item.message_body}
        </Text>

        {item.document_name && (
          <View style={styles.docRow}>
            <Icon name="file-text" size={12} color={colors.primary} />
            <Text style={styles.docName} numberOfLines={1}>
              {item.document_name}
            </Text>
          </View>
        )}

        <View style={styles.historyFooter}>
          <Text style={styles.historyTime}>
            {item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : ''}
          </Text>

          {item.failure_reason && (
            <Text style={styles.failureReason} numberOfLines={1}>
              ⚠️ {item.failure_reason}
            </Text>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WhatsApp Workspace</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'compose' && styles.activeTabBtn]}
            onPress={() => setActiveTab('compose')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'compose' && styles.activeTabBtnText]}>
              Compose & Send
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'history' && styles.activeTabBtn]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'history' && styles.activeTabBtnText]}>
              Audit History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Compose Tab */}
      {activeTab === 'compose' ? (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Recipient Type Pills */}
          <Text style={styles.sectionTitle}>1. Select Recipient Type</Text>
          <View style={styles.pillRow}>
            <TouchableOpacity
              style={[styles.typePill, recipientType === 'CUSTOMER' && styles.activeTypePill]}
              onPress={() => handleRecipientTypeChange('CUSTOMER')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typePillText, recipientType === 'CUSTOMER' && styles.activeTypePillText]}>
                👤 Customer / Applicant
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typePill, recipientType === 'EMPLOYEE' && styles.activeTypePill]}
              onPress={() => handleRecipientTypeChange('EMPLOYEE')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typePillText, recipientType === 'EMPLOYEE' && styles.activeTypePillText]}>
                👔 Staff / Employee
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recipient Search & Selection */}
          <Text style={styles.sectionTitle}>2. Search Recipient</Text>
          {!selectedRecipient ? (
            <View>
              <View style={styles.searchBox}>
                <TextInput
                  style={styles.searchInput}
                  placeholder={
                    recipientType === 'CUSTOMER'
                      ? 'Search customer by name, mobile, or App ID...'
                      : 'Search staff by name, code, or designation...'
                  }
                  placeholderTextColor={colors.textLight}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                />
                {searching && <ActivityIndicator size="small" color={colors.primary} />}
              </View>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <View style={styles.resultsContainer}>
                  {searchResults.map((rec) => (
                    <TouchableOpacity
                      key={rec.id}
                      style={styles.resultRow}
                      onPress={() => handleSelectRecipient(rec)}
                    >
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{rec.name}</Text>
                        <Text style={styles.resultSub}>
                          {rec.type === 'CUSTOMER'
                            ? `App: ${rec.app_number} | Mobile: ${rec.mobile_masked} | PAN: ${rec.pan_masked}`
                            : `${rec.designation} | Mobile: ${rec.mobile_masked}`}
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={14} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            /* Selected Recipient Card Context */
            <Card style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <View style={styles.selectedTitleGroup}>
                  <Text style={styles.selectedName}>{selectedRecipient.name}</Text>
                  <Text style={styles.selectedSub}>
                    {selectedRecipient.type === 'CUSTOMER'
                      ? `App: ${selectedRecipient.app_number} • Mobile: ${selectedRecipient.mobile_masked}`
                      : `${selectedRecipient.designation} • Mobile: ${selectedRecipient.mobile_masked}`}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setSelectedRecipient(null)} style={styles.changeBtn}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>

              {/* Target Navigation Action */}
              {selectedRecipient.type === 'CUSTOMER' && selectedRecipient.id && (
                <TouchableOpacity
                  style={styles.navActionRow}
                  onPress={() =>
                    router.push({ pathname: '/application-details', params: { id: selectedRecipient.id } })
                  }
                >
                  <Text style={styles.navActionText}>View Full Application Details</Text>
                  <Icon name="arrow-up-right" size={12} color={colors.primary} />
                </TouchableOpacity>
              )}
            </Card>
          )}

          {/* Template Selection */}
          <Text style={styles.sectionTitle}>3. Select Approved Template</Text>
          {loadingTemplates ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
              {templates.map((tpl) => (
                <TouchableOpacity
                  key={tpl.id || tpl.template_name}
                  style={[
                    styles.templateChip,
                    selectedTemplate?.template_name === tpl.template_name && styles.activeTemplateChip,
                  ]}
                  onPress={() => handleSelectTemplate(tpl)}
                >
                  <Text
                    style={[
                      styles.templateChipText,
                      selectedTemplate?.template_name === tpl.template_name && styles.activeTemplateChipText,
                    ]}
                  >
                    {tpl.template_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Selected Template Preview */}
          {selectedTemplate && (
            <Card style={styles.previewCard}>
              <Text style={styles.previewHeader}>Template Body Preview:</Text>
              <Text style={styles.previewBody}>{selectedTemplate.body}</Text>
            </Card>
          )}

          {/* Document Attachment Toggle */}
          <View style={styles.docToggleRow}>
            <Text style={styles.sectionTitle}>4. Attach Document (Optional)</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, includeDocument && styles.activeToggleBtn]}
              onPress={() => setIncludeDocument(!includeDocument)}
            >
              <Text style={[styles.toggleBtnText, includeDocument && styles.activeToggleBtnText]}>
                {includeDocument ? 'Attached' : 'Add Attachment'}
              </Text>
            </TouchableOpacity>
          </View>

          {includeDocument && (
            <Card style={styles.docInputCard}>
              <TextInput
                style={styles.docInput}
                placeholder="Document Title (e.g. Approved_Card_Report.pdf)"
                placeholderTextColor={colors.textLight}
                value={documentName}
                onChangeText={setDocumentName}
              />
              <TextInput
                style={styles.docInput}
                placeholder="Document URL (https://...)"
                placeholderTextColor={colors.textLight}
                value={documentUrl}
                onChangeText={setDocumentUrl}
              />
            </Card>
          )}

          {/* Send Error Banner */}
          {sendError && <ErrorState message={sendError} onRetry={handleSendMessage} />}

          {/* Submit Action Button */}
          <View style={styles.sendButtonContainer}>
            <Button
              title={sending ? 'Sending WhatsApp...' : 'Send WhatsApp Message'}
              onPress={handleSendMessage}
              loading={sending}
              disabled={sending || !selectedRecipient || !selectedTemplate}
            />
          </View>
        </ScrollView>
      ) : (
        /* History Tab */
        <View style={styles.content}>
          {loadingHistory ? (
            <LoadingState message="Loading WhatsApp audit history..." />
          ) : (
            <FlatList
              data={historyMessages}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id || item.message_uuid}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshingHistory}
                  onRefresh={handleRefreshHistory}
                  tintColor={colors.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="inbox" size={48} color={colors.border} />
                  <Text style={styles.emptyTitle}>No WhatsApp Messages Sent Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    All dispatched template and document messages will appear in this audit log.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textMid,
  },
  activeTabBtnText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typePill: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  activeTypePill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typePillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMid,
  },
  activeTypePillText: {
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
  resultsContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  resultInfo: {
    flex: 1,
    marginRight: spacing.xs,
  },
  resultName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  resultSub: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  selectedCard: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  selectedTitleGroup: {
    flex: 1,
  },
  selectedName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  selectedSub: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  changeText: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
    textDecorationLine: 'underline',
  },
  navActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  navActionText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  templateScroll: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  templateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  activeTemplateChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  templateChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMid,
  },
  activeTemplateChipText: {
    color: '#FFFFFF',
  },
  previewCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMid,
    marginBottom: 4,
  },
  previewBody: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    lineHeight: 18,
  },
  docToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  activeToggleBtn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
  },
  activeToggleBtnText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  docInputCard: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  docInput: {
    height: 40,
    backgroundColor: colors.inputBg,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    color: colors.text,
    fontSize: typography.sizes.xs,
  },
  sendButtonContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },

  // History List Styles
  list: {
    paddingBottom: spacing.xl,
  },
  historyCard: {
    marginBottom: spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  historyRecipientName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  historyMobile: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  historyBody: {
    fontSize: typography.sizes.xs,
    color: colors.textMid,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
    padding: 6,
    backgroundColor: colors.bgSecondary,
    borderRadius: 4,
  },
  docName: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  historyTime: {
    fontSize: 10,
    color: colors.textLight,
  },
  failureReason: {
    fontSize: 10,
    color: colors.error,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
