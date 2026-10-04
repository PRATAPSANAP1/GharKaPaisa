import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Card } from '../../../components/Card';
import { Icon } from '../../../components/Icon';
import {
  fetchSupportTicketsList,
  updateTicketStatus,
} from '../../../services/super-admin.service';

export default function SuperAdminSupportScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Response Modal
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState('RESOLVED');
  const [responseNotes, setResponseNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const statuses = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  const loadTickets = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter.toLowerCase();

      const res = await fetchSupportTicketsList(params);
      const list = Array.isArray(res) ? res : res.data || res.tickets || [];
      setTickets(list);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      await updateTicketStatus(selectedTicket.id || selectedTicket._id, newStatus.toLowerCase(), responseNotes);
      Alert.alert('Success', 'Ticket updated successfully.');
      setTicketModalVisible(false);
      setSelectedTicket(null);
      loadTickets();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || 'OPEN';
    switch (s) {
      case 'RESOLVED':
      case 'CLOSED':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'IN_PROGRESS':
        return { bg: '#FEF3C7', text: '#92400E' };
      default:
        return { bg: '#FEE2E2', text: '#991B1B' };
    }
  };

  const renderTicketCard = ({ item }: { item: any }) => {
    const badge = getStatusBadge(item.status);
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.ticketId}>#{String(item.id || item._id).slice(-6).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusText, { color: badge.text }]}>{item.status?.toUpperCase() || 'OPEN'}</Text>
          </View>
        </View>

        <Text style={styles.ticketSubject}>{item.subject || item.title || 'Support Query'}</Text>
        <Text style={styles.ticketMessage} numberOfLines={2}>{item.message || item.description}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            <Icon name="user" size={12} color="#64748B" /> {item.user_name || item.customer_name || 'User'}
          </Text>
          <Text style={styles.metaText}>
            <Icon name="clock" size={12} color="#64748B" /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.replyBtn}
            onPress={() => {
              setSelectedTicket(item);
              setNewStatus(item.status === 'OPEN' ? 'RESOLVED' : item.status?.toUpperCase());
              setResponseNotes('');
              setTicketModalVisible(true);
            }}
          >
            <Icon name="message-square" size={14} color="#2563EB" />
            <Text style={styles.replyBtnText}>Reply / Resolve</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Support Desk</Text>
          <Text style={styles.headerSubtitle}>Resolve member & applicant inquiries</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statuses}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === item && styles.activeFilterChip]}
              onPress={() => setStatusFilter(item)}
            >
              <Text style={[styles.filterChipText, statusFilter === item && styles.activeFilterChipText]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching support tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item, index) => item.id || item._id || String(index)}
          renderItem={renderTicketCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadTickets(true)} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Icon name="check-circle" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No support tickets</Text>
              <Text style={styles.emptySub}>All inquiries are up to date.</Text>
            </View>
          }
        />
      )}

      {/* Resolve / Reply Modal */}
      <Modal visible={ticketModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resolve Ticket</Text>
              <TouchableOpacity onPress={() => setTicketModalVisible(false)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.queryPreview}>
              <Text style={styles.bold}>Subject: </Text>
              {selectedTicket?.subject || selectedTicket?.title}
            </Text>

            <Text style={styles.label}>Set Status:</Text>
            <View style={styles.chipRow}>
              {['IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.chip, newStatus === st && styles.activeChip]}
                  onPress={() => setNewStatus(st)}
                >
                  <Text style={[styles.chipText, newStatus === st && styles.activeChipText]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Resolution Remarks / Response Note:</Text>
            <TextInput
              style={styles.input}
              placeholder="Explain actions taken to resolve user request..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={responseNotes}
              onChangeText={setResponseNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setTicketModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateTicket} disabled={updating}>
                {updating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  filterWrap: {
    backgroundColor: '#fff',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterList: {
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  activeFilterChip: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  listContent: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  ticketMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    gap: 4,
  },
  replyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  queryPreview: {
    fontSize: 13,
    color: '#334155',
    marginBottom: spacing.md,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  activeChip: {
    backgroundColor: '#2563EB',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  activeChipText: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 14,
    color: '#1E293B',
    height: 70,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    minWidth: 80,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
