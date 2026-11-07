import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface CommissionRule {
  id: string;
  product_id: string;
  partner_id?: string | null;
  commission_type: string;
  commission_value: number;
  effective_from?: string;
  effective_to?: string | null;
  created_at: string;
  product_name?: string;
  product_category?: string;
  first_name?: string;
  last_name?: string;
  partner_code?: string;
}

interface ProductOption {
  id: string;
  name: string;
}

export default function CommissionRulesScreen() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);

  // Form state
  const [productId, setProductId] = useState('');
  const [commissionType, setCommissionType] = useState('fixed');
  const [commissionValue, setCommissionValue] = useState('');

  useEffect(() => {
    fetchCommissionRules();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products', { params: { limit: 200 } });
      setProducts(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchCommissionRules = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/commission-rules');
      setRules(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch commission rules:', error);
      Alert.alert('Error', 'Failed to load commission rules');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingRule(null);
    setProductId('');
    setCommissionType('fixed');
    setCommissionValue('');
  };

  const handleDeleteRule = async (ruleId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this commission rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/admin/commission-rules/${ruleId}`);
              fetchCommissionRules();
            } catch (error) {
              console.error('Failed to delete rule:', error);
              Alert.alert('Error', 'Failed to delete rule');
            }
          },
        },
      ]
    );
  };

  const handleSaveRule = async () => {
    if (!productId || !commissionValue) {
      Alert.alert('Required', 'Please select a product and enter a commission value');
      return;
    }

    try {
      const payload: Record<string, any> = {
        product_id: productId,
        commission_type: commissionType,
        commission_value: Number(commissionValue),
        effective_from: new Date().toISOString().slice(0, 10),
      };
      if (editingRule?.partner_id) payload.partner_id = editingRule.partner_id;

      await apiClient.post('/admin/commission-rule', payload);

      setShowAddModal(false);
      resetForm();
      fetchCommissionRules();
      Alert.alert('Success', 'Commission rule saved successfully');
    } catch (error) {
      console.error('Failed to save rule:', error);
      Alert.alert('Error', 'Failed to save commission rule');
    }
  };

  const formatValue = (rule: CommissionRule) =>
    rule.commission_type === 'percentage'
      ? `${Number(rule.commission_value || 0)}%`
      : `₹${Number(rule.commission_value || 0).toLocaleString('en-IN')}`;

  const formatScope = (rule: CommissionRule) => {
    const name = `${rule.first_name || ''} ${rule.last_name || ''}`.trim();
    if (name) return name;
    if (rule.partner_code) return rule.partner_code;
    return 'Global (All Partners)';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading commission rules...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Commission Rules</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add Rule</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rulesContainer}>
        {rules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No commission rules found</Text>
          </View>
        ) : (
          rules.map((rule) => (
            <View key={rule.id} style={styles.ruleCard}>
              <View style={styles.ruleHeader}>
                <View style={styles.ruleInfo}>
                  <Text style={styles.ruleName}>{rule.product_name || 'Unknown Product'}</Text>
                  <Text style={styles.productName}>{formatScope(rule)}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{rule.commission_type}</Text>
                </View>
              </View>

              <View style={styles.ruleDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Value</Text>
                  <Text style={styles.detailValue}>{formatValue(rule)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Effective From</Text>
                  <Text style={styles.detailValue}>
                    {rule.effective_from
                      ? new Date(rule.effective_from).toLocaleDateString()
                      : '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.ruleActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setEditingRule(rule);
                    setProductId(rule.product_id);
                    setCommissionType(rule.commission_type);
                    setCommissionValue(String(rule.commission_value));
                    setShowAddModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteRule(rule.id)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingRule ? 'Update Commission Rule' : 'Add Commission Rule'}
            </Text>

            <Text style={styles.inputLabel}>Product *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productPicker}>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.productChip,
                    productId === product.id && styles.productChipSelected,
                  ]}
                  onPress={() => setProductId(product.id)}
                  disabled={!!editingRule}
                >
                  <Text
                    style={[
                      styles.productChipText,
                      productId === product.id && styles.productChipTextSelected,
                    ]}
                  >
                    {product.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Commission Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeChip, commissionType === 'percentage' && styles.typeChipSelected]}
                onPress={() => setCommissionType('percentage')}
              >
                <Text style={[styles.typeText, commissionType === 'percentage' && styles.typeTextSelected]}>
                  Percentage
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeChip, commissionType === 'fixed' && styles.typeChipSelected]}
                onPress={() => setCommissionType('fixed')}
              >
                <Text style={[styles.typeText, commissionType === 'fixed' && styles.typeTextSelected]}>
                  Fixed
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              {commissionType === 'percentage' ? 'Commission Rate (%) *' : 'Commission Amount (₹) *'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={commissionType === 'percentage' ? 'e.g. 2.5' : 'e.g. 1500'}
              keyboardType="numeric"
              value={commissionValue}
              onChangeText={setCommissionValue}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveRule}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  rulesContainer: {
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
  ruleCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  productName: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  ruleDetails: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  ruleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: 6,
    marginTop: 12,
    fontWeight: typography.weights.semibold,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 12,
    fontSize: typography.sizes.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productPicker: {
    flexGrow: 0,
  },
  productChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  productChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  productChipText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  productChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  typeTextSelected: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
