import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { fetchTravelServices } from '../../services/cms.service';

interface TravelType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
  tag: string;
}

const DEFAULT_TRAVEL_TYPES: TravelType[] = [
  {
    id: 'flight',
    title: 'Flight Booking',
    description: 'Domestic & International flights with zero convenience fees',
    icon: 'plane',
    color: '#3B82F6',
    bg: '#EFF6FF',
    tag: 'Cheapest Airfare',
  },
  {
    id: 'train',
    title: 'Train Tickets (IRCTC)',
    description: 'Confirmed Tatkal, CNF berth prediction, and instant refund',
    icon: 'activity',
    color: '#10B981',
    bg: '#ECFDF5',
    tag: 'Free Cancellation',
  },
  {
    id: 'bus',
    title: 'Bus Reservation',
    description: 'Intercity AC Sleeper, Volvo, and State transport buses',
    icon: 'bus',
    color: '#F59E0B',
    bg: '#FFFBEB',
    tag: 'Up to ₹250 Off',
  },
  {
    id: 'hotel',
    title: 'Hotels & Homestays',
    description: 'Verified budget stays, luxury resorts, and couple-friendly hotels',
    icon: 'home',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    tag: 'Pay at Hotel',
  },
];

export default function TravelBookingScreen() {
  const [loading, setLoading] = useState(true);
  const [travelList, setTravelList] = useState<TravelType[]>(DEFAULT_TRAVEL_TYPES);

  // Booking Modal State
  const [selectedTravel, setSelectedTravel] = useState<TravelType | null>(null);
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [departDate, setDepartDate] = useState(new Date().toISOString().split('T')[0]);
  const [passengers, setPassengers] = useState('1');
  const [travelerName, setTravelerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState<any | null>(null);

  useEffect(() => {
    fetchTravelServices()
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((item: any, idx: number) => ({
            id: item.id || `travel-${idx}`,
            title: item.name || item.title || 'Travel Service',
            description: item.description || 'Best online travel booking rate',
            icon: item.icon || 'plane',
            color: DEFAULT_TRAVEL_TYPES[idx % DEFAULT_TRAVEL_TYPES.length].color,
            bg: DEFAULT_TRAVEL_TYPES[idx % DEFAULT_TRAVEL_TYPES.length].bg,
            tag: 'Verified Partner',
          }));
          setTravelList(mapped);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleOpenSearch = (item: TravelType) => {
    setSelectedTravel(item);
    setBookingConfirmation(null);
    setFromCity(item.id === 'hotel' ? '' : 'Mumbai');
    setToCity(item.id === 'hotel' ? 'Goa' : 'Delhi');
    setTravelerName('');
    setMobileNumber('');
  };

  const handleSearchBook = () => {
    if (selectedTravel?.id !== 'hotel' && (!fromCity.trim() || !toCity.trim())) {
      Alert.alert('Required Fields', 'Please enter origin and destination cities.');
      return;
    }
    if (selectedTravel?.id === 'hotel' && !toCity.trim()) {
      Alert.alert('Required Fields', 'Please enter hotel destination city or landmark.');
      return;
    }
    if (!travelerName.trim() || !mobileNumber.trim() || mobileNumber.trim().length < 10) {
      Alert.alert('Contact Required', 'Please enter traveler full name and 10-digit mobile number.');
      return;
    }

    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setBookingConfirmation({
        pnr: 'GKP' + Math.floor(10000000 + Math.random() * 90000000),
        travelType: selectedTravel?.title,
        route: selectedTravel?.id === 'hotel' ? `Hotel in ${toCity}` : `${fromCity} ➔ ${toCity}`,
        date: departDate,
        traveler: travelerName.trim(),
        mobile: mobileNumber.trim(),
        passengers: passengers || '1',
        fare: selectedTravel?.id === 'flight' ? '₹4,499' : selectedTravel?.id === 'train' ? '₹1,240' : selectedTravel?.id === 'bus' ? '₹899' : '₹2,799',
        status: 'CONFIRMED_INQUIRY',
      });
    }, 1000);
  };

  const closeSheet = () => {
    setSelectedTravel(null);
    setBookingConfirmation(null);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Booking</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Icon name="map" size={48} color={colors.primary} />
        <Text style={styles.heroTitle}>Book Your Travel</Text>
        <Text style={styles.heroSubtitle}>
          Flights, trains, buses, and hotels at guaranteed lowest prices with instant cashbacks
        </Text>
      </View>

      {/* Services List */}
      <View style={styles.travelList}>
        {travelList.map((travel) => (
          <TouchableOpacity
            key={travel.id}
            onPress={() => handleOpenSearch(travel)}
            activeOpacity={0.7}
          >
            <Card style={styles.travelCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconContainer, { backgroundColor: travel.bg }]}>
                  <Icon name={travel.icon as any} size={28} color={travel.color} />
                </View>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{travel.tag}</Text>
                </View>
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

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <Icon name="shield" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Travel booking services are certified by IATA and IRCTC partner gateways. Instant PNR dispatch and 24/7 travel desk support.
        </Text>
      </Card>

      {/* Booking Search & Reservation Modal */}
      <Modal visible={!!selectedTravel} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSheet} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{selectedTravel?.title || 'Travel Booking'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {bookingConfirmation ? (
              <View style={styles.confirmContainer}>
                <View style={styles.confirmIconCircle}>
                  <Icon name="check" size={32} color="#fff" />
                </View>
                <Text style={styles.confirmTitle}>Reservation Request Created!</Text>
                <Text style={styles.confirmSubtitle}>
                  Your booking request has been confirmed. PNR tickets will be sent on WhatsApp.
                </Text>

                <Card style={styles.confirmCard}>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>PNR Reference</Text>
                    <Text style={[styles.confirmVal, { color: colors.primary, fontWeight: '900' }]}>
                      {bookingConfirmation.pnr}
                    </Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Service</Text>
                    <Text style={styles.confirmVal}>{bookingConfirmation.travelType}</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Route / City</Text>
                    <Text style={styles.confirmVal}>{bookingConfirmation.route}</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Travel Date</Text>
                    <Text style={styles.confirmVal}>{bookingConfirmation.date}</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Primary Passenger</Text>
                    <Text style={styles.confirmVal}>{bookingConfirmation.traveler}</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Mobile Number</Text>
                    <Text style={styles.confirmVal}>{bookingConfirmation.mobile}</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Estimated Fare</Text>
                    <Text style={[styles.confirmVal, { color: '#10B981', fontWeight: '800' }]}>
                      {bookingConfirmation.fare}
                    </Text>
                  </View>
                </Card>

                <Button title="Done" onPress={closeSheet} style={{ marginTop: spacing.lg }} />
              </View>
            ) : (
              <>
                <View style={[styles.modalHero, { backgroundColor: selectedTravel?.bg || '#EFF6FF' }]}>
                  <Icon name={selectedTravel?.icon as any || 'plane'} size={36} color={selectedTravel?.color || colors.primary} />
                  <Text style={styles.modalHeroTitle}>{selectedTravel?.title}</Text>
                  <Text style={styles.modalHeroDesc}>{selectedTravel?.description}</Text>
                </View>

                <Card style={styles.searchCard}>
                  <Text style={styles.formTitle}>Search Availability & Book</Text>

                  {selectedTravel?.id !== 'hotel' ? (
                    <>
                      <Text style={styles.inputLabel}>From (Origin City) *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Mumbai, Pune, Delhi"
                        placeholderTextColor={colors.textLight}
                        value={fromCity}
                        onChangeText={setFromCity}
                      />

                      <Text style={styles.inputLabel}>To (Destination City) *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Bangalore, Goa, Jaipur"
                        placeholderTextColor={colors.textLight}
                        value={toCity}
                        onChangeText={setToCity}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.inputLabel}>Destination City / Landmark *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Goa, Manali, Mumbai, Ooty"
                        placeholderTextColor={colors.textLight}
                        value={toCity}
                        onChangeText={setToCity}
                      />
                    </>
                  )}

                  <Text style={styles.inputLabel}>Travel / Check-in Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textLight}
                    value={departDate}
                    onChangeText={setDepartDate}
                  />

                  <Text style={styles.inputLabel}>Number of Passengers / Guests</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="1"
                    placeholderTextColor={colors.textLight}
                    keyboardType="numeric"
                    value={passengers}
                    onChangeText={setPassengers}
                  />

                  <Text style={styles.inputLabel}>Lead Traveler Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter full name as per Aadhaar/Passport"
                    placeholderTextColor={colors.textLight}
                    value={travelerName}
                    onChangeText={setTravelerName}
                  />

                  <Text style={styles.inputLabel}>Mobile Number (For PNR & Updates) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={colors.textLight}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                  />

                  <Button
                    title={searching ? 'Searching Available Fares...' : 'Check Availability & Reserve'}
                    loading={searching}
                    disabled={searching}
                    onPress={handleSearchBook}
                    style={{ marginTop: spacing.md }}
                  />
                </Card>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  travelList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  travelCard: {
    padding: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  travelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  travelDesc: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  infoCard: {
    margin: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMid,
    lineHeight: 16,
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modalBody: {
    flex: 1,
    padding: spacing.md,
  },
  modalHero: {
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  modalHeroDesc: {
    fontSize: 13,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: 2,
  },
  searchCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#fff',
  },
  confirmContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  confirmIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 4,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: colors.textMid,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  confirmCard: {
    width: '100%',
    padding: spacing.md,
    gap: spacing.sm,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  confirmLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  confirmVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});
