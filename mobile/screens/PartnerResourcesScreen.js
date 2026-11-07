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
  Platform,
  Linking
} from 'react-native';

const MARKETING_ASSETS = [
  {
    id: '1',
    title: 'HDFC Pixel Credit Card Banner',
    format: 'Square Post (1080x1080)',
    type: 'Social Media Creative',
    tag: 'HIGH CONVERTING',
    copy: 'Get instant approval on HDFC Pixel Go Card! Lifetime Free with 5% cashback on dining & top apps. Zero paperwork.',
    color: '#1E3A8A'
  },
  {
    id: '2',
    title: 'SBI SimplyCLICK Card Poster',
    format: 'WhatsApp Story (1080x1920)',
    type: 'Status & Story Creative',
    tag: 'REWARDS FAVORITE',
    copy: '10X Reward Points on Amazon, Cleartrip & BookMyShow! ₹500 Amazon Gift Card on joining. Apply now.',
    color: '#064E3B'
  },
  {
    id: '3',
    title: 'Instant Personal Loan Low ROI Poster',
    format: 'WhatsApp / Flyer',
    type: 'Urgent Disbursal',
    tag: 'QUICK DISBURSAL',
    copy: 'Need funds fast? Instant Personal Loans up to ₹25 Lakhs disbursed within 24 hours. Minimal documents required.',
    color: '#581C87'
  },
  {
    id: '4',
    title: 'Zero Fee Health Insurance 1 Crore',
    format: 'Pamphlet / Poster',
    type: 'Life & Health Cover',
    tag: 'TAX SAVING',
    copy: 'Protect your family with ₹1 Crore term insurance starting at only ₹490/month. 99.3% claim settlement ratio.',
    color: '#831843'
  }
];

const TRAINING_VIDEOS = [
  {
    id: 't1',
    title: 'Module 1: How to Pitch HDFC Pixel Card',
    duration: '8 mins',
    level: 'Beginner',
    desc: 'Learn key selling points, target customer income requirements, and instant link sharing on WhatsApp.'
  },
  {
    id: 't2',
    title: 'Module 2: Complete KYC & Bank Verification Guide',
    duration: '12 mins',
    level: 'Intermediate',
    desc: 'Step-by-step walkthrough to ensure 100% document approval rate and avoid bank rejections.'
  },
  {
    id: 't3',
    title: 'Module 3: Zero-Rejection Personal Loan Punching',
    duration: '10 mins',
    level: 'Intermediate',
    desc: 'Pre-check CIBIL criteria and income rules before punching high-ticket personal loan applications.'
  },
  {
    id: 't4',
    title: 'Module 4: Managing Downline Team & Earning Overrides',
    duration: '15 mins',
    level: 'Advanced',
    desc: 'Maximize your passive monthly commissions through sub-agent recruitment and performance incentives.'
  }
];

export default function PartnerResourcesScreen({ route, navigation }) {
  const { user, token, defaultTab } = route?.params || {};
  const [activeTab, setActiveTab] = useState(defaultTab || 'marketing'); // 'marketing' | 'training'

  const handleShareAsset = async (asset) => {
    const partnerCode = user?.partner_code || 'GKP-9021';
    const applyLink = `https://gharkapaisa.in/apply?ref=${partnerCode}`;
    const text = `📢 *${asset.title}*\n\n${asset.copy}\n\n👉 Apply online instantly: ${applyLink}\n*Partner Code:* ${partnerCode}`;

    try {
      await Share.share({ message: text });
    } catch (_) {
      Alert.alert('Share Link', text);
    }
  };

  const handleWhatsAppAsset = (asset) => {
    const partnerCode = user?.partner_code || 'GKP-9021';
    const applyLink = `https://gharkapaisa.in/apply?ref=${partnerCode}`;
    const text = encodeURIComponent(`📢 *${asset.title}*\n\n${asset.copy}\n\n👉 Apply online: ${applyLink}\nPartner Code: ${partnerCode}`);
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {
      Alert.alert('Share Link', applyLink);
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#080E1A" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketing & Academy</Text>
        <View style={{ width: 45 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'marketing' && styles.tabBtnActive]}
          onPress={() => setActiveTab('marketing')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'marketing' && styles.tabBtnTextActive]}>
            📢 Banners & Creatives
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'training' && styles.tabBtnActive]}
          onPress={() => setActiveTab('training')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'training' && styles.tabBtnTextActive]}>
            🎓 Training Academy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'marketing' ? (
          <View>
            <View style={styles.heroBox}>
              <Text style={styles.heroTitle}>Promotional Assets & Stories</Text>
              <Text style={styles.heroSub}>
                Share branded creatives and sales copies with your network on WhatsApp Status, Instagram & Facebook to convert more customer leads.
              </Text>
            </View>

            {MARKETING_ASSETS.map((asset) => (
              <View key={asset.id} style={styles.assetCard}>
                <View style={[styles.assetHeader, { backgroundColor: asset.color }]}>
                  <View style={styles.assetHeaderTop}>
                    <Text style={styles.assetFormatText}>{asset.format}</Text>
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>{asset.tag}</Text>
                    </View>
                  </View>
                  <Text style={styles.assetTitleText}>{asset.title}</Text>
                </View>

                <View style={styles.assetBody}>
                  <Text style={styles.assetCopyText}>"{asset.copy}"</Text>

                  <View style={styles.assetActions}>
                    <TouchableOpacity
                      style={styles.whatsAppShareBtn}
                      onPress={() => handleWhatsAppAsset(asset)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.whatsAppShareBtnText}>💬 Share on WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.generalShareBtn}
                      onPress={() => handleShareAsset(asset)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.generalShareBtnText}>🔗 Share Link</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <View style={styles.heroBox}>
              <Text style={styles.heroTitle}>Partner Masterclasses</Text>
              <Text style={styles.heroSub}>
                Watch proven video tutorials from top financial advisors to increase your approval ratios and master product pitches.
              </Text>
            </View>

            {TRAINING_VIDEOS.map((video) => (
              <View key={video.id} style={styles.videoCard}>
                <View style={styles.videoHeader}>
                  <View style={styles.playIconCircle}>
                    <Text style={{ fontSize: 16 }}>▶</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.videoTitle}>{video.title}</Text>
                    <View style={styles.videoMetaRow}>
                      <Text style={styles.videoDuration}>⏱️ {video.duration}</Text>
                      <Text style={styles.videoLevelPill}>{video.level}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.videoDesc}>{video.desc}</Text>

                <TouchableOpacity
                  style={styles.watchBtn}
                  onPress={() => Alert.alert('Masterclass Video', `Playing "${video.title}"...\nDuration: ${video.duration}`)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.watchBtnText}>Watch Video Masterclass ▶</Text>
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
  safe: {
    flex: 1,
    backgroundColor: '#080E1A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800'
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '900'
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabBtnActive: {
    borderBottomColor: '#38BDF8'
  },
  tabBtnText: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '700'
  },
  tabBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '800'
  },
  scroll: {
    padding: 16,
    paddingBottom: 40
  },
  heroBox: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16
  },
  heroTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800'
  },
  heroSub: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4
  },
  assetCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden'
  },
  assetHeader: {
    padding: 16
  },
  assetHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  assetFormatText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10.5,
    fontWeight: '700'
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6
  },
  tagBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900'
  },
  assetTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900'
  },
  assetBody: {
    padding: 16
  },
  assetCopyText: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 14
  },
  assetActions: {
    flexDirection: 'row',
    gap: 8
  },
  whatsAppShareBtn: {
    flex: 1.2,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  whatsAppShareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  generalShareBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  generalShareBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800'
  },
  videoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  playIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6'
  },
  videoTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800'
  },
  videoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 3
  },
  videoDuration: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600'
  },
  videoLevelPill: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4
  },
  videoDesc: {
    color: '#94A3B8',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 12
  },
  watchBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  watchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  }
});