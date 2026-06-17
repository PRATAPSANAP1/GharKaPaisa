import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, SafeAreaView, StatusBar, ScrollView,
  Dimensions, Modal, FlatList
} from 'react-native';

const { width } = Dimensions.get('window');

// Data Lists matching Web App
const banners = [
  { title: "Lifetime Free Credit Cards", desc: "No joining fee. No annual charges.", color: "#1a237e" },
  { title: "Personal & Business Loans", desc: "Low interest rates from 10.5%.", color: "#004d40" },
  { title: "Comprehensive Insurance", desc: "Protect your health, life, and motor.", color: "#3e2723" },
  { title: "Smart EMI Offers", desc: "Convert big purchases to low-cost EMIs.", color: "#4a148c" }
];

const moneyTransferData = [
  { label: "To Mobile", icon: "📱", desc: "Send money instantly", color: "#27ae60" },
  { label: "Recharge", icon: "💸", desc: "Mobile, DTH, FASTag", color: "#2980b9" },
  { label: "Electricity", icon: "⚡", desc: "Pay electricity bills", color: "#f39c12" },
  { label: "Loan Repay", icon: "💰", desc: "EMI & Loan Payments", color: "#8e44ad" },
  { label: "FASTag", icon: "🏷️", desc: "Recharge FASTag tag", color: "#3498db" }
];

const travelTransitData = [
  { label: "Flight", icon: "✈️" },
  { label: "Train", icon: "🚊" },
  { label: "Bus", icon: "🚌" },
  { label: "Hotels", icon: "🏨" }
];

const allLoansData = [
  { label: "Personal Loan", icon: "🪙" },
  { label: "Home Loan", icon: "🏠" },
  { label: "Business Loan", icon: "🏢" },
  { label: "Education Loan", icon: "🎓" },
  { label: "Car Loan", icon: "🚗" },
  { label: "Used Car Loan", icon: "🏎️" },
  { label: "Instant Loan", icon: "📲" },
  { label: "Loan Against Property (LAP)", icon: "🏢" },
  { label: "Gold Loan", icon: "🪙" },
  { label: "Loan Against Car", icon: "🚗" },
  { label: "2 Wheeler Loan", icon: "🏍️" },
  { label: "Loan Against Mutual Funds", icon: "📈" }
];

const partnerBanks = [
  { name: "HDFC Bank", rating: "★★★★★" },
  { name: "SBI Bank", rating: "★★★★★" },
  { name: "Axis Bank", rating: "★★★★☆" },
  { name: "Bank of Baroda", rating: "★★★★☆" }
];

const ltfCards = [
  { name: "HDFC Pixel Go Credit Card", desc: "Digital-first customizable credit card" },
  { name: "HDFC Pixel Play Credit Card", desc: "Custom rewards on shopping and dining apps" },
  { name: "Axis Bank Neo Credit Card", desc: "Zomato, BookMyShow and utility discounts" },
  { name: "Axis Bank MY Zone Credit Card", desc: "Buy 1 Get 1 Free on movie tickets" }
];

export default function HomeScreen({ navigation }) {
  const [loansModalVisible, setLoansModalVisible] = useState(false);

  // Split loans for 8-button layout: 7 loans + "See More" button
  const visibleLoans = allLoansData.slice(0, 7);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <Image source={require('../assets/icon.png')} style={styles.logo} />
          <Text style={styles.navTitle}>GharKaPaisa</Text>
        </View>
        <TouchableOpacity 
          style={styles.loginBtn} 
          onPress={() => navigation.navigate('Login', { role: 'Partner' })}
        >
          <Text style={styles.loginBtnText}>Log In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Banner Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.bannerScroll}
        >
          {banners.map((b, idx) => (
            <View key={idx} style={[styles.bannerCard, { backgroundColor: b.color }]}>
              <Text style={styles.bannerTitle}>{b.title}</Text>
              <Text style={styles.bannerDesc}>{b.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Money Transfer & Payments - Horizontal Scroll (Single Line) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Money Transfer & Payments</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {moneyTransferData.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.circleCard}>
                <Text style={styles.circleIcon}>{item.icon}</Text>
                <Text style={styles.circleLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Travel & Transit - Horizontal Scroll (Single Line) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel & Transit</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {travelTransitData.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.circleCard}>
                <Text style={styles.circleIcon}>{item.icon}</Text>
                <Text style={styles.circleLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Loans - Grid Layout (Max 8 buttons) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loans</Text>
          <View style={styles.grid}>
            {visibleLoans.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.gridCard}>
                <Text style={styles.gridIcon}>{item.icon}</Text>
                <Text style={styles.gridLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            
            {/* 8th Button: See More */}
            <TouchableOpacity 
              style={[styles.gridCard, styles.seeMoreCard]}
              onPress={() => setLoansModalVisible(true)}
            >
              <Text style={[styles.gridIcon, { color: '#0d47a1' }]}>➔</Text>
              <Text style={[styles.gridLabel, { color: '#0d47a1', fontWeight: 'bold' }]}>See More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Partner Banks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Partner Bank</Text>
          <View style={styles.bankGrid}>
            {partnerBanks.map((bank, idx) => (
              <TouchableOpacity key={idx} style={styles.bankCard}>
                <Text style={styles.bankName}>{bank.name}</Text>
                <Text style={styles.bankRating}>{bank.rating}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lifetime Free Credit Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifetime Free Credit Cards</Text>
          {ltfCards.map((card, idx) => (
            <View key={idx} style={styles.cardItem}>
              <View style={styles.cardMarker} />
              <View>
                <Text style={styles.cardItemTitle}>{card.name}</Text>
                <Text style={styles.cardItemDesc}>{card.desc}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Loans Expansion Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={loansModalVisible}
        onRequestClose={() => setLoansModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Loans Options</Text>
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setLoansModalVisible(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={allLoansData}
              numColumns={3}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalGridCard}>
                  <Text style={styles.modalGridIcon}>{item.icon}</Text>
                  <Text style={styles.modalGridLabel} numberOfLines={2}>{item.label}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0d47a1',
    marginLeft: 8,
  },
  loginBtn: {
    backgroundColor: '#0d47a1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    paddingBottom: 40,
  },
  bannerScroll: {
    marginVertical: 16,
  },
  bannerCard: {
    width: width - 32,
    height: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    marginLeft: 16,
    marginRight: 16,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  bannerDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
  },
  horizontalScroll: {
    paddingRight: 16,
  },
  circleCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    marginRight: 16,
  },
  circleIcon: {
    fontSize: 26,
    backgroundColor: '#e3f2fd',
    width: 54,
    height: 54,
    borderRadius: 27,
    textAlign: 'center',
    lineHeight: 54,
    marginBottom: 6,
  },
  circleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 48) / 4,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#eef1f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  seeMoreCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0d47a1',
    borderStyle: 'dashed',
  },
  gridIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bankCard: {
    width: (width - 40) / 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  bankRating: {
    color: '#f57c00',
    fontSize: 12,
    marginTop: 4,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardMarker: {
    width: 6,
    height: 32,
    borderRadius: 3,
    backgroundColor: '#009688',
    marginRight: 12,
  },
  cardItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  cardItemDesc: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: '#0d47a1',
    fontWeight: '700',
    fontSize: 15,
  },
  modalList: {
    padding: 16,
  },
  modalGridCard: {
    width: (width - 56) / 3,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    margin: 4,
    height: 90,
    justifyContent: 'center',
  },
  modalGridIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  modalGridLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
