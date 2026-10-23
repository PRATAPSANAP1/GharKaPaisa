import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface ProductLink {
  id: string;
  name: string;
  category?: string;
  bank_name?: string;
  is_active?: boolean;
  public_url?: string;
  partner_url?: string;
  tracking_enabled?: boolean;
  button_text?: string;
  redirect_type?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  priority?: number;
  last_updated_at?: string;
  updated_by?: string;
}

export default function ProductLinksScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<ProductLink[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchProductLinks();
  }, []);

  const fetchProductLinks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/products/links', { params: { limit: '200' } });
      setLinks(response.data?.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch product links:', error);
      Alert.alert('Error', 'Failed to load product links');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (url?: string) => {
    if (!url) {
      Alert.alert('Info', 'No tracking URL configured for this product');
      return;
    }
    try {
      Clipboard.setString(url);
      Alert.alert('Success', 'Link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleToggleTracking = async (link: ProductLink) => {
    try {
      await apiClient.put(`/products/link/${link.id}`, {
        product_id: link.id,
        public_url: link.public_url,
        partner_url: link.partner_url,
        tracking_enabled: !link.tracking_enabled,
        button_text: link.button_text,
        redirect_type: link.redirect_type,
        utm_source: link.utm_source,
        utm_medium: link.utm_medium,
        utm_campaign: link.utm_campaign,
        priority: link.priority,
        reason: 'Tracking toggled from mobile app',
      });
      fetchProductLinks();
    } catch (error) {
      console.error('Failed to update link:', error);
      Alert.alert('Error', 'Failed to update tracking status');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this link config?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/products/link/${linkId}`);
              fetchProductLinks();
            } catch (error) {
              console.error('Failed to delete link:', error);
              Alert.alert('Error', 'Failed to delete link');
            }
          },
        },
      ]
    );
  };

  const handleCreateLink = () => {
    router.push('/products');
  };

  const filteredLinks = links.filter(l =>
    (l.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (l.bank_name || '').toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading product links...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Product Links</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateLink}
        >
          <Text style={styles.addButtonText}>+ Create Link</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search links..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.linksContainer}>
        {filteredLinks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No product links found</Text>
          </View>
        ) : (
          filteredLinks.map((link) => {
            const trackingUrl = link.public_url || link.partner_url;
            return (
            <View key={link.id} style={styles.linkCard}>
              <View style={styles.linkHeader}>
                <View style={styles.linkInfo}>
                  <Text style={styles.productName}>{link.name}</Text>
                  <Text style={styles.linkCode}>{link.bank_name || '—'}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: link.is_active ? '#10B981' : '#EF4444' }
                  ]}
                >
                  <Text style={styles.statusText}>
                    {link.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.urlContainer}>
                <Text style={styles.urlLabel}>Tracking URL:</Text>
                <Text style={styles.urlText} numberOfLines={2}>
                  {trackingUrl || 'Not configured'}
                </Text>
              </View>

              <View style={styles.linkStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{link.priority ?? 0}</Text>
                  <Text style={styles.statLabel}>Priority</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{link.redirect_type || '—'}</Text>
                  <Text style={styles.statLabel}>Redirect</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {link.tracking_enabled ? 'On' : 'Off'}
                  </Text>
                  <Text style={styles.statLabel}>Tracking</Text>
                </View>
              </View>

              <View style={styles.linkActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCopyLink(trackingUrl)}
                >
                  <Text style={styles.actionButtonText}>Copy Link</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.toggleButton]}
                  onPress={() => handleToggleTracking(link)}
                >
                  <Text style={styles.actionButtonText}>
                    {link.tracking_enabled ? 'Track Off' : 'Track On'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteLink(link.id)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            );
          })
        )}
      </View>
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
  searchContainer: {
    padding: 16,
    backgroundColor: colors.card,
  },
  searchInput: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 12,
    fontSize: typography.sizes.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linksContainer: {
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
  linkCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  linkInfo: {
    flex: 1,
  },
  productName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  linkCode: {
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
  urlContainer: {
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  urlLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    marginBottom: 4,
  },
  urlText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontFamily: 'monospace',
  },
  linkStats: {
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
  linkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  toggleButton: {
    backgroundColor: '#F59E0B',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
});
