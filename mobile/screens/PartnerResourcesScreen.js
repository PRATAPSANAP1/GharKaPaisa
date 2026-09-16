import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Share,
  Platform
} from 'react-native';

const MARKETING_ASSETS = [
  { id: '1', title: 'HDFC Pixel Credit Card Banner', format: 'PNG (1080x1080)', type: 'Social Media Banner', link: 'https://placehold.co/600x600/0d47a1/FFFFFF/png?text=HDFC+Pixel+Card' },
  { id: '2', title: 'SBI Cashback Card Promotion', format: 'JPG (1080x1920)', type: 'WhatsApp Story Banner', link: 'https://placehold.co/600x1000/059669/FFFFFF/png?text=SBI+Cashback+Card' },
  { id: '3', title: 'Personal Loan Low Interest Rate Poster', format: 'PDF Flyer', type: 'Print Poster', link: 'https://placehold.co/600x600/7c3aed/FFFFFF/png?text=Personal+Loan+Poster' },
  { id: '4', title: 'Zero Fee Health Insurance Pamphlet', format: 'PNG (1200x630)', type: 'Facebook Post', link: 'https://placehold.co/600x600/db2777/FFFFFF/png?text=Health+Insurance' },
];

const TRAINING_VIDEOS = [
  { id: 't1', title: 'Module 1: How to Pitch HDFC Pixel Card', duration: '8 mins', level: 'Beginner', desc: 'Learn key selling points, eligibility requirements, and instant link sharing.' },
  { id: 't2', title: 'Module 2: Complete KYC & Document Upload Guide', duration: '12 mins', level: 'Intermediate', desc: 'Step-by-step walkthrough to ensure 100% document approval rate.' },
  { id: 't3', title: 'Module 3: Managing Downline Team & Overrides', duration: '15 mins', level: 'Advanced', desc: 'Maximize your monthly commission through downline sub-agent management.' },
  { id: 't4', title: 'Module 4: Zero Rejection Personal Loan Punching', duration: '10 mins', level: 'Intermediate', desc: 'Pre-check CIBIL criteria before submitting high-value personal loan leads.' }
];

export default function PartnerResourcesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('marketing'); // 'marketing' | 'training'

  const handleShareAsset = async (asset) => {
    try {
      await Share.share({
        message: `📢 *${asset.title}*\n\nApply for top credit cards & loans with instant approval: https://gharkapaisa.in/apply/GKP_PARTNER\n\nDownload promotional banner: ${asset.link}`
      });
    } catch (err) {
      Alert.alert('Shared', 'Asset link ready for sharing.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Marketing & Training</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'marketing' && styles.tabBtnActive]}
          onPress={() => setActiveTab('marketing')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'marketing' && styles.tabBtnTextActive]}>📢 Banners & Marketing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'training' && styles.tabBtnActive]}
          onPress={() => setActiveTab('training')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'training' && styles.tabBtnTextActive]}>🎓 Training Modules</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Marketing Assets */}
        {activeTab === 'marketing' && (
          <View>
            <View style={styles.heroBox}>
              <Text style={styles.heroTitle}>Promotional Assets & Banners</Text>
              <Text style={styles.heroSub}>Share branded posters & story banners with your customer network on WhatsApp, Instagram & Facebook to drive higher conversions.</Text>
            </View>

            {MARKETING_ASSETS.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.assetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.assetType}>{item.type.toUpperCase()}</Text>
                    <Text style={styles.assetTitle}>{item.title}</Text>
                    <Text style={styles.assetFormat}>Format: {item.format}</Text>
                  </View>
                </View>

                <View style={styles.assetActions}>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={() => handleShareAsset(item)}
                  >
                    <Text style={styles.shareBtnText}>Share Asset 📲</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => Alert.alert('Asset Ready', 'High-resolution banner downloaded to your device gallery.')}
                  >
                    <Text style={styles.downloadBtnText}>Download ⬇</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Training Modules */}
        {activeTab === 'training' && (
          <View>
            <View style={[styles.heroBox, { backgroundColor: '#059669' }]}>
              <Text style={styles.heroTitle}>Partner Academy & Video Guides</Text>
              <Text style={styles.heroSub}>Master loan pitching, CIBIL checking, and downline team building to double your monthly earnings.</Text>
            </View>

            {TRAINING_VIDEOS.map((vid) => (
              <View key={vid.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.levelBadge}>{vid.level}</Text>
                  <Text style={styles.durationText}>⏱ {vid.duration}</Text>
                </View>

                <Text style={styles.vidTitle}>{vid.title}</Text>
                <Text style={styles.vidDesc}>{vid.desc}</Text>

                <TouchableOpacity
                  style={styles.watchBtn}
                  onPress={() => Alert.alert('Playing Module', `Starting HD training video: ${vid.title}`)}
                >
                  <Text style={styles.watchBtnText}>▶ Watch Training Video</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 12 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#0d47a1' },
  tabBtnText: { fontSize: 12.5, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#0d47a1', fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  heroBox: { backgroundColor: '#0d47a1', borderRadius: 16, padding: 18, marginBottom: 16 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  heroSub: { fontSize: 12.5, color: '#E0E7FF', lineHeight: 18 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  assetHeader: { flexDirection: 'row', marginBottom: 14 },
  assetType: { fontSize: 10, fontWeight: '900', color: '#0d47a1' },
  assetTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  assetFormat: { fontSize: 11.5, color: '#64748B', marginTop: 4 },
  assetActions: { flexDirection: 'row', gap: 10 },
  shareBtn: { flex: 1, backgroundColor: '#0d47a1', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  shareBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  downloadBtn: { flex: 1, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  downloadBtnText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  levelBadge: { fontSize: 10, fontWeight: '900', color: '#059669', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  durationText: { fontSize: 11.5, color: '#64748B', fontWeight: '600' },
  vidTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  vidDesc: { fontSize: 12, color: '#475569', marginTop: 4, marginBottom: 14, lineHeight: 18 },
  watchBtn: { backgroundColor: '#059669', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  watchBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
