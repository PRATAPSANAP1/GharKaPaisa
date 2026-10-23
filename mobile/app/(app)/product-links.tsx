import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface ProductLink {
  id: string;
  product_id: string;
  product_name: string;
  partner_id: string;
  link_code: string;
  full_url: string;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  created_at: string;
  is_active: boolean;
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
      const response = await apiClient.get('/products/links');
      setLinks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch product links:', error);
      Alert.alert('Error', 'Failed to load product links');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert('Success', 'Link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleToggleActive = async (linkId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/products/links/${linkId}`, { is_active: !currentStatus });
      fetchProductLinks();
    } catch (error) {
      console.error('Failed to update link:', error);
      Alert.alert('Error', 'Failed to update link status');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this link?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/products/links/${linkId}`);
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
    l.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
    l.link_code.toLowerCase().includes(searchText.toLowerCase())
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
          filteredLinks.map((link) => (
            <View key={link.id} style={styles.linkCard}>
              <View style={styles.linkHeader}>
                <View style={styles.linkInfo}>
                  <Text style={styles.productName}>{link.product_name}</Text>
                  <Text style={styles.linkCode}>Code: {link.link_code}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.statusBadge,
                    { backgroundColor: link.is_active ? '#10B981' : '#EF4444' }
                  ]}
                  onPress={() => handleToggleActive(link.id, link.is_active)}
                >
                  <Text style={styles.statusText}>
                    {link.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.urlContainer}>
                <Text style={styles.urlLabel}>Tracking URL:</Text>
                <Text style={styles.urlText} numberOfLines={2}>
                  {link.full_url}
                </Text>
              </View>

              <View style={styles.linkStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{link.total_clicks}</Text>
                  <Text style={styles.statLabel}>Clicks</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{link.total_conversions}</Text>
                  <Text style={styles.statLabel}>Conversions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {link.conversion_rate ? `${link.conversion_rate.toFixed(1)}%` : '0%'}
                  </Text>
                  <Text style={styles.statLabel}>Rate</Text>
                </View>
              </View>

              <View style={styles.linkActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCopyLink(link.full_url)}
                >
                  <Text style={styles.actionButtonText}>Copy Link</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteLink(link.id)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
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
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
});
