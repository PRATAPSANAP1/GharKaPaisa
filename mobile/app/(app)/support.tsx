import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { getTickets, createTicket, SupportTicket } from '../../services/support.service';

export default function SupportScreen() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Ticket Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [creating, setCreating] = useState(false);

  const fetchSupportTickets = async () => {
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSupportTickets();
  }, []);

  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim() || creating) return;
    setCreating(true);
    try {
      const newTicket = await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority
      });
      if (newTicket) {
        setTickets(prev => [newTicket, ...prev]);
      }
      setSubject('');
      setDescription('');
      setModalVisible(false);
      fetchSupportTickets();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSupportTickets();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Support Desk</Text>
            <Text style={styles.subtitle}>Connect & resolve operational issues</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.createBtnText}>+ New Ticket</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Support Tickets</Text>
                <Text style={styles.emptyText}>Create a ticket if you experience any issue.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketSubject}>{item.subject}</Text>
                  <View style={[
                    styles.statusPill,
                    item.status === 'RESOLVED' ? styles.statusResolved : styles.statusOpen
                  ]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.ticketDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.ticketFooter}>
                  <Text style={styles.ticketMeta}>
                    Priority: <Text style={{ fontWeight: 'bold' }}>{item.priority}</Text>
                  </Text>
                  <Text style={styles.ticketMeta}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        {/* Create Ticket Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Support Ticket</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Brief summary of your issue..."
                value={subject}
                onChangeText={setSubject}
              />

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityGroup}>
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityChip, priority === p && styles.priorityActive]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.priorityChipText, priority === p && styles.priorityActiveText]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Detailed Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your issue or request..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[styles.submitBtn, (!subject.trim() || !description.trim() || creating) && styles.submitDisabled]}
                onPress={handleCreateTicket}
                disabled={!subject.trim() || !description.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Support Ticket</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 2
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20
  },
  createBtnText: {
    color: '#fff',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  list: {
    padding: spacing.md
  },
  ticketCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  ticketSubject: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    flex: 1,
    marginRight: 8
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  statusOpen: {
    backgroundColor: 'rgba(59,130,246,0.15)'
  },
  statusResolved: {
    backgroundColor: 'rgba(16,185,129,0.15)'
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary
  },
  ticketDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: spacing.sm
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6
  },
  ticketMeta: {
    fontSize: 11,
    color: colors.textLight
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  emptyText: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginTop: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  modalClose: {
    fontSize: 18,
    color: colors.textLight,
    fontWeight: typography.weights.bold
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
    marginTop: 8
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.text
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top'
  },
  priorityGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: colors.background
  },
  priorityActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  priorityChipText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.text
  },
  priorityActiveText: {
    color: '#fff'
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg
  },
  submitDisabled: {
    opacity: 0.5
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm
  }
});
