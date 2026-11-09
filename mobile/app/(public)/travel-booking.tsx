import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';

const travelTypes = [
  {
    id: 'flight',
    title: 'Flight Booking',
    description: 'Book domestic and international flights',
    icon: 'plane',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: 'train',
    title: 'Train Booking',
    description: 'Book train tickets across India',
    icon: 'activity',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    id: 'bus',
    title: 'Bus Booking',
    description: 'Book bus tickets for intercity travel',
    icon: 'bus',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    id: 'hotel',
    title: 'Hotel Booking',
    description: 'Find and book hotels worldwide',
    icon: 'home',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
];

export default function TravelBookingScreen() {
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Booking</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.hero}>
        <Icon name="map" size={48} color={colors.primary} />
        <Text style={styles.heroTitle}>Book Your Travel</Text>
        <Text style={styles.heroSubtitle}>
          Flights, trains, buses, and hotels at best prices
        </Text>
      </View>

      <View style={styles.travelList}>
        {travelTypes.map((travel) => (
          <TouchableOpacity
            key={travel.id}
            onPress={() => alert(`${travel.title} coming soon!`)}
            activeOpacity={0.7}
          >
            <Card style={styles.travelCard}>
              <View style={[styles.iconContainer, { backgroundColor: travel.bg }]}>
                <Icon name={travel.icon as any} size={32} color={travel.color} />
              </View>
              <Text style={styles.travelTitle}>{travel.title}</Text>
              <Text style={styles.travelDesc} numberOfLines={2}>
                {travel.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.exploreText}>Book Now</Text>
                <Icon name="chevron-right" size={16} color={colors.primary} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={styles.infoCard}>
        <Icon name="info-circle" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Travel booking services are provided by our partner platforms. Compare prices and book your travel hassle-free.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  hero: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  heroSubtitle: { fontSize: 14, color: colors.textMid, textAlign: 'center' },
  travelList: { padding: spacing.md, gap: spacing.md },
  travelCard: { padding: spacing.md },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  travelTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  travelDesc: { fontSize: 13, color: colors.textMid, lineHeight: 18, marginBottom: spacing.md },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exploreText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  infoCard: {
    margin: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoText: { flex: 1, fontSize: 12, color: colors.textMid, lineHeight: 16 },
});
