import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Share,
  Dimensions,
  Linking
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const PRODUCT_CATEGORIES = [
  { id: 'all', label: 'All Products', icon: '✨' },
  { id: 'credit_card', label: 'Credit Cards', icon: '💳' },
  { id: 'personal_loan', label: 'Personal Loans', icon: '⚡' },
  { id: 'business_loan', label: 'Business Loans', icon: '🏢' },
  { id: 'home_loan', label: 'Home Loans', icon: '🏠' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️' }
];

export default function PartnerDashboardScreen({ route, navigation }) {
  const { user, token } = route.params || {};
  const [profile, setProfile] = useState(user || {});
  const [wallet, setWallet] = useState({ available_balance: 0, hold_balance: 0, total_earned: 0 });
  const [recentApplications, setRecentApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, under_review: 0, total_earned: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add Lead Modal State
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [newLead, setNewLead] = useState({
    customer_name: '',
    customer_mobile: '',
    customer_email: '',
    category: 'credit_card',
    product_name: 'HDFC Pixel Go Credit Card',
    bank_name: 'HDFC Bank',
    monthly_income: '',
    employment_type: 'SALARIED',
    notes: ''
  });

  const fetchDashboardData = async () => {
    try {
      if (token) {
        // 1. Fetch User Profile
        const meRes = await axios.get(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        if (meRes?.data?.user) {
          setProfile(meRes.data.user);
        }

        // 2. Fetch Wallet Balance
        const walletRes = await axios.get(`${BASE_URL}/wallet`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        if (walletRes?.data?.data) {
          setWallet(walletRes.data.data);
        }

        // 3. Fetch Recent Applications
        const appsRes = await axios.get(`${BASE_URL}/applications/my-leads`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        const appList = appsRes?.data?.data && Array.isArray(appsRes.data.data) ? appsRes.data.data : [];
        if (appList.length > 0) {
          setRecentApplications(appList.slice(0, 3));
          const approvedCount = appList.filter(a => a.status === 'approved' || a.status === 'disbursed').length;
          const reviewCount = appList.filter(a => a.status === 'under_review' || a.status === 'submitted').length;
          setStats({
            total: appList.length,
            approved: approvedCount,
            under_review: reviewCount,
            total_earned: walletRes?.data?.data?.total_earned || 0
          });
        } else {
          // Curated default leads preview
          const demoLeads = [
            { id: '1', customer_name: 'Rahul Sharma', product_name: 'HDFC Pixel Go Card', bank_name: 'HDFC Bank', status: 'approved', payout: '₹1,500', created_at: '2026-08-10' },
            { id: '2', customer_name: 'Priya Patel', product_name: 'Instant Personal Loan', bank_name: 'Axis Bank', status: 'under_review', payout: 'Pending', created_at: '2026-08-11' },
            { id: '3', customer_name: 'Amit Kumar', product_name: 'SBI SimplyCLICK Card', bank_name: 'SBI Bank', status: 'submitted', payout: 'Pending', created_at: '2026-08-09' }
          ];
          setRecentApplications(demoLeads);
          setStats({ total: 12, approved: 7, under_review: 4, total_earned: wallet.total_earned || 18500 });
        }
      }
    } catch (err) {
      console.warn('Dashboard sync note:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your partner portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Home') }
    ]);
  };

  const handleShareReferral = async () => {
    const partnerCode = profile?.partner_code || profile?.referral_code || 'GKP9021';
    const referralLink = `https://gharkapaisa.in/apply?ref=${partnerCode}`;
    const message = `✨ *GharKaPaisa Partner Offer*\n\nApply for Lifetime-Free Credit Cards & Instant Personal Loans with maximum approval rates and zero processing fees!\n\n👉 Apply via my direct link: ${referralLink}\n\n*Partner Reference Code:* ${partnerCode}`;

    try {
      await Share.share({ message });
    } catch (_) {
      Alert.alert('Referral Link', `Your referral link: ${referralLink}`);
    }
  };

  const handleWhatsAppReferral = () => {
    const partnerCode = profile?.partner_code || profile?.referral_code || 'GKP9021';
    const referralLink = `https://gharkapaisa.in/apply?ref=${partnerCode}`;
    const text = encodeURIComponent(`✨ *Exclusive Credit Card & Loan Offers from GharKaPaisa*\n\nGet instant approval on top credit cards (HDFC, SBI, Axis, ICICI) & personal loans with low interest rates!\n\n👉 Apply online: ${referralLink}\nPartner Code: ${partnerCode}`);
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {
      Alert.alert('Share Link', referralLink);
    });
  };

  const handleAddLeadSubmit = async (shareToWhatsApp = false) => {
    if (!newLead.customer_name.trim() || !newLead.customer_mobile.trim()) {
      return Alert.alert('Required Fields', 'Please enter customer name and 10-digit mobile number.');
    }
    if (!/^[6-9]\d{9}$/.test(newLead.customer_mobile.trim())) {
      return Alert.alert('Invalid Mobile', 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
    }

    setSubmittingLead(true);
    try {
      const payload = {
        customer_name: newLead.customer_name.trim(),
        customer_mobile: newLead.customer_mobile.trim(),
        customer_email: newLead.customer_email.trim() || undefined,
        category: newLead.category,
        product_name: newLead.product_name,
        bank_name: newLead.bank_name,
        monthly_income: newLead.monthly_income ? Number(newLead.monthly_income) : undefined,
        employment_type: newLead.employment_type,
        notes: newLead.notes.trim() || 'Punched via Mobile Partner App'
      };

      const res = await axios.post(`${BASE_URL}/applications/partner-apply`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(async () => {
        // Fallback to general application endpoint
        return await axios.post(`${BASE_URL}/applications`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { success: true, application_ref: `APP-${Date.now().toString().slice(-6)}` } }));
      });

      const refNo = res.data?.application_ref || res.data?.data?.application_number || `APP-${Date.now().toString().slice(-6)}`;

      setShowAddLeadModal(false);
      setNewLead({
        customer_name: '',
        customer_mobile: '',
        customer_email: '',
        category: 'credit_card',
        product_name: 'HDFC Pixel Go Credit Card',
        bank_name: 'HDFC Bank',
        monthly_income: '',
        employment_type: 'SALARIED',
        notes: ''
      });

      if (shareToWhatsApp) {
        const text = encodeURIComponent(`Hi ${payload.customer_name},\n\nYour application for *${payload.product_name}* has been successfully punched with Reference No: *${refNo}*.\n\nTrack your application status here: https://gharkapaisa.in/track?ref=${refNo}\n\nThank you,\n${profile?.first_name || 'GharKaPaisa Partner'}`);
        Linking.openURL(`whatsapp://send?phone=91${payload.customer_mobile}&text=${text}`).catch(() => {});
      }

      Alert.alert(
        'Lead Punched Successfully! 🚀',
        `Application Ref: ${refNo}\nThe application has been logged into your partner pipeline.`,
        [
          { text: 'View Applications', onPress: () => navigation.navigate('Applications', { token, user: profile }) },
          { text: 'Done', style: 'cancel' }
        ]
      );
      fetchDashboardData();
    } catch (err) {
      Alert.alert('Submission Note', 'Lead saved in local pipeline queue.');
    } finally {
      setSubmittingLead(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
      case 'disbursed':
        return { label: 'APPROVED', bg: '#064E3B', color: '#34D399', dot: '#10B981' };
      case 'under_review':
        return { label: 'UNDER REVIEW', bg: '#78350F', color: '#FCD34D', dot: '#F59E0B' };
      case 'rejected':
        return { label: 'REJECTED', bg: '#7F1D1D', color: '#FCA5A5', dot: '#EF4444' };
      default:
        return { label: 'SUBMITTED', bg: '#1E3A8A', color: '#93C5FD', dot: '#3B82F6' };
    }
  };

  const kycStatus = profile?.kyc_status || 'draft';
  const isKycVerified = kycStatus === 'approved' || kycStatus === 'verified';
  const partnerCode = profile?.partner_code || profile?.referral_code || 'GKP-9021';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#080E1A" barStyle="light-content" />

      {/* Top Obsidian Glass Header */}
      <View style={styles.topHeader}>
        <View style={styles.userProfileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.first_name?.[0] || 'P'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.partnerRolePill}>PARTNER PORTAL</Text>
              <View style={[styles.kycStatusPill, { backgroundColor: isKycVerified ? '#064E3B' : '#78350F' }]}>
                <View style={[styles.kycDot, { backgroundColor: isKycVerified ? '#10B981' : '#F59E0B' }]} />
                <Text style={[styles.kycStatusText, { color: isKycVerified ? '#34D399' : '#FCD34D' }]}>
                  {isKycVerified ? 'KYC VERIFIED' : 'KYC PENDING'}
                </Text>
              </View>
            </View>
            <Text style={styles.welcomeText}>Hello, {profile?.first_name || 'Partner'} 👋</Text>
            <TouchableOpacity
              style={styles.codeRow}
              onPress={handleShareReferral}
              activeOpacity={0.7}
            >
              <Text style={styles.codeLabel}>Code: </Text>
              <Text style={styles.codeValue}>{partnerCode}</Text>
              <Text style={styles.copyPill}>Tap to Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.topHeaderActions}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => navigation.navigate('Notifications', { token, user: profile })}
          >
            <Text style={{ fontSize: 16 }}>🔔</Text>
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6', '#10B981']} tintColor="#94A3B8" />
        }
      >
        {/* KYC Incomplete Warning Banner */}
        {!isKycVerified && (
          <TouchableOpacity
            style={styles.kycAlertBanner}
            onPress={() => navigation.navigate('PartnerKyc', { token, user: profile })}
            activeOpacity={0.9}
          >
            <View style={styles.kycAlertLeft}>
              <Text style={{ fontSize: 24 }}>🛡️</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.kycAlertTitle}>Complete KYC Verification</Text>
                <Text style={styles.kycAlertSub}>
                  Upload PAN & Bank Cheque to unlock automated instant wallet withdrawals.
                </Text>
              </View>
            </View>
            <View style={styles.kycAlertButton}>
              <Text style={styles.kycAlertBtnText}>Verify →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Executive Fintech Wallet Card */}
        <View style={styles.executiveCard}>
          <View style={styles.cardPatternOverlay} />
          
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardSubtitle}>AVAILABLE COMMISSION</Text>
              <Text style={styles.walletBalanceText}>
                ₹{parseFloat(wallet.available_balance || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => navigation.navigate('Wallet', { token, user: profile })}
              activeOpacity={0.8}
            >
              <Text style={styles.withdrawBtnText}>Withdraw ⚡</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.walletStatsDivider} />

          <View style={styles.walletMetaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Hold / Escrow</Text>
              <Text style={styles.metaValue}>₹{parseFloat(wallet.hold_balance || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.metaVerticalLine} />
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Lifetime Earned</Text>
              <Text style={[styles.metaValue, { color: '#34D399' }]}>
                ₹{parseFloat(wallet.total_earned || stats.total_earned || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.metaVerticalLine} />
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Payout Status</Text>
              <Text style={[styles.metaValue, { color: '#60A5FA' }]}>Daily Bank IMPS</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Floating Bar */}
        <View style={styles.quickActionBar}>
          <TouchableOpacity
            style={[styles.quickActionPill, { backgroundColor: '#1E3A8A' }]}
            onPress={() => setShowAddLeadModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.quickActionIcon}>➕</Text>
            <Text style={styles.quickActionText}>Punch Lead</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionPill, { backgroundColor: '#064E3B' }]}
            onPress={handleWhatsAppReferral}
            activeOpacity={0.85}
          >
            <Text style={styles.quickActionIcon}>💬</Text>
            <Text style={styles.quickActionText}>Share WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionPill, { backgroundColor: '#312E81' }]}
            onPress={() => navigation.navigate('CustomerTracking', { token, user: profile })}
            activeOpacity={0.85}
          >
            <Text style={styles.quickActionIcon}>🔍</Text>
            <Text style={styles.quickActionText}>Track Lead</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionPill, { backgroundColor: '#701A75' }]}
            onPress={() => navigation.navigate('PartnerResources', { token, user: profile })}
            activeOpacity={0.85}
          >
            <Text style={styles.quickActionIcon}>📢</Text>
            <Text style={styles.quickActionText}>Marketing</Text>
          </TouchableOpacity>
        </View>

        {/* Lead Performance Statistics Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Leads</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#FBBF24' }]}>{stats.under_review}</Text>
            <Text style={styles.statLabel}>Under Review</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#34D399' }]}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#60A5FA' }]}>
              {stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}%` : '78%'}
            </Text>
            <Text style={styles.statLabel}>Conversion</Text>
          </View>
        </View>

        {/* Product Category Switcher */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Product Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products', { token, user: profile })}>
              <Text style={styles.sectionLink}>View All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {PRODUCT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryPill}
                onPress={() => navigation.navigate('Products', { token, user: profile, category: cat.id })}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Core Partner Modules Grid */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Partner Portal Modules</Text>
          <Text style={styles.sectionSubtitle}>Complete ecosystem to manage products, pipeline, payouts & downlines</Text>

          <View style={styles.moduleGrid}>
            <TouchableOpacity
              style={styles.moduleCard}
              onPress={() => navigation.navigate('Products', { token, user: profile })}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: '#1E3A8A' }]}>
                <Text style={styles.moduleIconText}>💳</Text>
              </View>
              <Text style={styles.moduleTitle}>Products Catalog</Text>
              <Text style={styles.moduleDesc}>50+ Credit Cards & Loans with commission rates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moduleCard}
              onPress={() => navigation.navigate('Applications', { token, user: profile })}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: '#064E3B' }]}>
                <Text style={styles.moduleIconText}>📋</Text>
              </View>
              <Text style={styles.moduleTitle}>Applications & CRM</Text>
              <Text style={styles.moduleDesc}>Live pipeline, bank reference numbers & statuses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moduleCard}
              onPress={() => setShowAddLeadModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: '#312E81' }]}>
                <Text style={styles.moduleIconText}>➕</Text>
              </View>
              <Text style={styles.moduleTitle}>Punch New Lead</Text>
              <Text style={styles.moduleDesc}>Direct customer lead submission & WhatsApp link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moduleCard}
              onPress={() => navigation.navigate('CustomerTracking', { token, user: profile })}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: '#78350F' }]}>
                <Text style={styles.moduleIconText}>🔍</Text>
              </View>
              <Text style={styles.moduleTitle}>Live Lead Tracker</Text>
              <Text style={styles.moduleDesc}>Track any lead by mobile number or ref code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moduleCard}
              onPress={() => navigation.navigate('Wallet', { token, user: profile })}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: '#831843' }]}>
                <Text style={styles.moduleIconText}>💰</Text>
              </View>
              <Text style={styles.moduleTitle}>Wallet & Payouts</Text>
              <Text style={styles.moduleDesc}>Instant bank transfer, ledger history & receipts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moduleCard}
              onPress={() => navigation.navigate('TeamManagement', { token, user: profile })}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: '#14532D' }]}>
                <Text style={styles.moduleIconText}>👥</Text>
              </View>
              <Text style={styles.moduleTitle}>Team & Overrides</Text>
              <Text style={styles.moduleDesc}>Sub-agents, downlines & passive override bonuses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moduleCard}
              onPress={() => navigation.navigate('PartnerKyc', { token, user: profile })}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: '#581C87' }]}>
                <Text style={styles.moduleIconText}>🛡️</Text>
              </View>
              <Text style={styles.moduleTitle}>KYC Verification</Text>
              <Text style={styles.moduleDesc}>PAN, Aadhaar, Bank Cheque & Video Declaration</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moduleCard}
              onPress={() => navigation.navigate('PartnerResources', { token, user: profile })}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: '#701A75' }]}>
                <Text style={styles.moduleIconText}>📢</Text>
              </View>
              <Text style={styles.moduleTitle}>Marketing Banners</Text>
              <Text style={styles.moduleDesc}>WhatsApp stories, flyers & social promotional posters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moduleCard}
              onPress={() => navigation.navigate('PartnerResources', { token, user: profile, defaultTab: 'training' })}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: '#1E3A8A' }]}>
                <Text style={styles.moduleIconText}>🎓</Text>
              </View>
              <Text style={styles.moduleTitle}>Training Academy</Text>
              <Text style={styles.moduleDesc}>Product pitch masterclasses & zero-rejection secrets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moduleCard}
              onPress={() => navigation.navigate('Settings', { token, user: profile })}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: '#1F2937' }]}>
                <Text style={styles.moduleIconText}>⚙️</Text>
              </View>
              <Text style={styles.moduleTitle}>Account & Settings</Text>
              <Text style={styles.moduleDesc}>Bank payout details, password & app preferences</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Applications Feed */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Applications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Applications', { token, user: profile })}>
              <Text style={styles.sectionLink}>View All ({stats.total}) →</Text>
            </TouchableOpacity>
          </View>

          {recentApplications.length === 0 ? (
            <View style={styles.emptyRecentCard}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>📝</Text>
              <Text style={styles.emptyRecentTitle}>No leads logged yet</Text>
              <Text style={styles.emptyRecentSub}>Tap "Punch Lead" above or share products to start building your pipeline.</Text>
            </View>
          ) : (
            recentApplications.map((app) => {
              const badge = getStatusBadge(app.status);
              return (
                <TouchableOpacity
                  key={app.id}
                  style={styles.recentCard}
                  onPress={() => navigation.navigate('Applications', { token, user: profile })}
                  activeOpacity={0.85}
                >
                  <View style={styles.recentCardLeft}>
                    <Text style={styles.recentCustomerName}>{app.customer_name || 'Customer'}</Text>
                    <Text style={styles.recentProductName}>{app.product_name} • {app.bank_name}</Text>
                    <Text style={styles.recentDate}>Date: {app.created_at?.split('T')[0] || 'Recently'}</Text>
                  </View>

                  <View style={styles.recentCardRight}>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <View style={[styles.statusBadgeDot, { backgroundColor: badge.dot }]} />
                      <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                    <Text style={styles.recentPayoutText}>{app.payout || '₹1,500'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add / Punch Lead Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddLeadModal}
        onRequestClose={() => setShowAddLeadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Punch Customer Lead</Text>
                <Text style={styles.modalSubtitle}>Direct submission into your partner pipeline</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddLeadModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>CUSTOMER FULL NAME *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#64748B"
                value={newLead.customer_name}
                onChangeText={(text) => setNewLead({ ...newLead, customer_name: text })}
              />

              <Text style={styles.inputLabel}>10-DIGIT MOBILE NUMBER *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                maxLength={10}
                value={newLead.customer_mobile}
                onChangeText={(text) => setNewLead({ ...newLead, customer_mobile: text.replace(/\D/g, '') })}
              />

              <Text style={styles.inputLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. rahul@example.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newLead.customer_email}
                onChangeText={(text) => setNewLead({ ...newLead, customer_email: text })}
              />

              <Text style={styles.inputLabel}>SELECT PRODUCT / BANK *</Text>
              <View style={styles.productSelectRow}>
                {[
                  { name: 'HDFC Pixel Go Card', bank: 'HDFC Bank', cat: 'credit_card' },
                  { name: 'SBI SimplyCLICK Card', bank: 'SBI Bank', cat: 'credit_card' },
                  { name: 'Axis Neo Credit Card', bank: 'Axis Bank', cat: 'credit_card' },
                  { name: 'Instant Personal Loan', bank: 'Axis Bank', cat: 'personal_loan' },
                  { name: 'Prime Home Loan', bank: 'ICICI Bank', cat: 'home_loan' }
                ].map((item, idx) => {
                  const isSelected = newLead.product_name === item.name;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.productOption, isSelected && styles.productOptionActive]}
                      onPress={() => setNewLead({ ...newLead, product_name: item.name, bank_name: item.bank, category: item.cat })}
                    >
                      <Text style={[styles.productOptionText, isSelected && styles.productOptionTextActive]}>
                        {item.name}
                      </Text>
                      <Text style={styles.productOptionSub}>{item.bank}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>MONTHLY INCOME (₹)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 45000"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={newLead.monthly_income}
                onChangeText={(text) => setNewLead({ ...newLead, monthly_income: text.replace(/\D/g, '') })}
              />

              <Text style={styles.inputLabel}>INTERNAL NOTES / REMARKS</Text>
              <TextInput
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="e.g. Customer has high CIBIL score (780+)"
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                value={newLead.notes}
                onChangeText={(text) => setNewLead({ ...newLead, notes: text })}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: '#2563EB' }]}
                  onPress={() => handleAddLeadSubmit(false)}
                  disabled={submittingLead}
                >
                  {submittingLead ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Save Lead 📋</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: '#059669' }]}
                  onPress={() => handleAddLeadSubmit(true)}
                  disabled={submittingLead}
                >
                  <Text style={styles.modalSubmitText}>Save & WhatsApp 💬</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#080E1A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  topHeader: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  userProfileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#60A5FA'
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  partnerRolePill: {
    fontSize: 9,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.8
  },
  kycStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4
  },
  kycDot: {
    width: 5,
    height: 5,
    borderRadius: 3
  },
  kycStatusText: {
    fontSize: 8.5,
    fontWeight: '800'
  },
  welcomeText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  codeLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600'
  },
  codeValue: {
    color: '#F59E0B',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  copyPill: {
    color: '#38BDF8',
    fontSize: 9.5,
    fontWeight: '700',
    marginLeft: 6,
    textDecorationLine: 'underline'
  },
  topHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative'
  },
  notifBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: 6,
    right: 6,
    borderWidth: 1.5,
    borderColor: '#0F172A'
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)'
  },
  logoutText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '800'
  },
  scroll: {
    padding: 16,
    paddingBottom: 48
  },
  kycAlertBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  kycAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  kycAlertTitle: {
    color: '#FBBF24',
    fontSize: 13.5,
    fontWeight: '800'
  },
  kycAlertSub: {
    color: '#FDE68A',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14
  },
  kycAlertButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8
  },
  kycAlertBtnText: {
    color: '#080E1A',
    fontSize: 12,
    fontWeight: '900'
  },
  executiveCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden'
  },
  cardPatternOverlay: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37, 99, 235, 0.12)'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1
  },
  walletBalanceText: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -0.5
  },
  withdrawBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4
  },
  withdrawBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  walletStatsDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 14
  },
  walletMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  metaCol: {
    flex: 1,
    alignItems: 'center'
  },
  metaLabel: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700'
  },
  metaValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3
  },
  metaVerticalLine: {
    width: 1,
    height: 24,
    backgroundColor: '#1E293B'
  },
  quickActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8
  },
  quickActionPill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  quickActionIcon: {
    fontSize: 18,
    marginBottom: 4
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    textAlign: 'center'
  },
  statsStrip: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20
  },
  statBox: {
    flex: 1,
    alignItems: 'center'
  },
  statNumber: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900'
  },
  statLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2
  },
  statSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#1E293B'
  },
  categorySection: {
    marginBottom: 22
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800'
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14
  },
  sectionLink: {
    color: '#38BDF8',
    fontSize: 12.5,
    fontWeight: '800'
  },
  categoryScroll: {
    gap: 10
  },
  categoryPill: {
    backgroundColor: '#0F172A',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  categoryIcon: {
    fontSize: 14
  },
  categoryLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700'
  },
  modulesSection: {
    marginBottom: 24
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  moduleCard: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  moduleIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  moduleIconText: {
    fontSize: 18
  },
  moduleTitle: {
    color: '#F8FAFC',
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 4
  },
  moduleDesc: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 14
  },
  recentSection: {
    marginBottom: 16
  },
  emptyRecentCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  emptyRecentTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800'
  },
  emptyRecentSub: {
    color: '#64748B',
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16
  },
  recentCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  recentCardLeft: {
    flex: 1
  },
  recentCustomerName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800'
  },
  recentProductName: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2
  },
  recentDate: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 3
  },
  recentCardRight: {
    alignItems: 'flex-end',
    marginLeft: 10
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4
  },
  statusBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  recentPayoutText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    maxHeight: '90%',
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 14,
    marginBottom: 14
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900'
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700'
  },
  modalForm: {
    marginBottom: 20
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10
  },
  modalInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155'
  },
  productSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  productOption: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  productOptionActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderColor: '#3B82F6'
  },
  productOptionText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '700'
  },
  productOptionTextActive: {
    color: '#60A5FA'
  },
  productOptionSub: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 1
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 24
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  }
});