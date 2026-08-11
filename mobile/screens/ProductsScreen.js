import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  Linking,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'credit_card', label: 'Credit Cards' },
  { id: 'personal_loan', label: 'Personal Loans' },
  { id: 'home_loan', label: 'Home Loans' },
  { id: 'business_loan', label: 'Business Loans' },
  { id: 'insurance', label: 'Insurance' },
];

export default function ProductsScreen({ route, navigation }) {
  const { token, user } = route.params || {};
  const [selectedCat, setSelectedCat] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [selectedCat]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = selectedCat === 'all'
        ? `${BASE_URL}/products`
        : `${BASE_URL}/products?category=${selectedCat}`;

      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).catch(() => null);

      if (res?.data?.data) {
        setProducts(res.data.data);
      } else {
        // Fallback default list
        setProducts([
          { id: '1', name: 'HDFC Pixel Go Credit Card', bank_name: 'HDFC Bank', category: 'credit_card', commission_value: 1500, apply_url: 'https://applyonline.hdfc.bank.in' },
          { id: '2', name: 'SBI SimplyCLICK Credit Card', bank_name: 'SBI Bank', category: 'credit_card', commission_value: 1800, apply_url: 'https://sbicard.com' },
          { id: '3', name: 'Instant Personal Loan', bank_name: 'Axis Bank', category: 'personal_loan', commission_value: 2.5, commission_type: 'percentage', apply_url: 'https://axisbank.com' },
          { id: '4', name: 'Prime Home Loan', bank_name: 'ICICI Bank', category: 'home_loan', commission_value: 0.5, commission_type: 'percentage', apply_url: 'https://icicibank.com' },
        ]);
      }
    } catch (err) {
      console.warn('Product fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareLead = (prod) => {
    const partnerCode = user?.partner_code || 'GKP';
    const shareText = `Apply for ${prod.name} from ${prod.bank_name || 'GharKaPaisa'} using my partner link: ${prod.apply_url || 'https://gharkapaisa.in'}`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(shareText)}`)
      .catch(() => Linking.openURL(prod.apply_url || 'https://gharkapaisa.in'));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0d47a1" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products Catalog</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Pills */}
      <View style={styles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, selectedCat === cat.id && styles.catPillActive]}
              onPress={() => setSelectedCat(cat.id)}
            >
              <Text style={[styles.catText, selectedCat === cat.id && styles.catTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0d47a1" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {products.map((item) => (
            <View key={item.id} style={styles.productCard}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.bankName}>{item.bank_name || 'Partner Bank'}</Text>
                  <Text style={styles.prodName}>{item.name}</Text>
                </View>
                <View style={styles.payoutBadge}>
                  <Text style={styles.payoutLabel}>Earn Payout</Text>
                  <Text style={styles.payoutVal}>
                    {item.commission_type === 'percentage' ? `${item.commission_value}%` : `₹${item.commission_value || 1000}`}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.shareBtn} onPress={() => handleShareLead(item)}>
                  <Text style={styles.shareBtnText}>📲 Share Lead Link</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() => item.apply_url && Linking.openURL(item.apply_url)}
                >
                  <Text style={styles.applyBtnText}>Apply Now ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  catContainer: { backgroundColor: '#FFFFFF', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  catPill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#F1F5F9', marginRight: 8 },
  catPillActive: { backgroundColor: '#0d47a1' },
  catText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  catTextActive: { color: '#FFFFFF' },
  scroll: { padding: 16, paddingBottom: 40 },
  productCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14, elevation: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  bankName: { fontSize: 11, fontWeight: '800', color: '#0d47a1', textTransform: 'uppercase' },
  prodName: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  payoutBadge: { backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1, borderRadius: 8, padding: 6, alignItems: 'center' },
  payoutLabel: { fontSize: 9, fontWeight: '700', color: '#047857', textTransform: 'uppercase' },
  payoutVal: { fontSize: 14, fontWeight: '900', color: '#059669', marginTop: 1 },
  cardFooter: { flexDirection: 'row', gap: 10 },
  shareBtn: { flex: 1, backgroundColor: '#2563EB', padding: 10, borderRadius: 8, alignItems: 'center' },
  shareBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  applyBtn: { backgroundColor: '#F1F5F9', padding: 10, borderRadius: 8, alignItems: 'center', paddingHorizontal: 14 },
  applyBtnText: { color: '#0d47a1', fontSize: 12, fontWeight: '800' },
});
