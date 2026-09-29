import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/Icon';
import { createLead, CreateLeadPayload } from '../../services/lead.service';
import { fetchProductsList } from '../../services/partner.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function AddLeadScreen() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [monthlySalary, setMonthlySalary] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetchProductsList();
        if (isMounted) {
          const list = Array.isArray(res) ? res : res.data || res.products || [];
          setProducts(list);
          if (list.length > 0) {
            setProductId(list[0].id || list[0].product_id);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Failed to load products for lead creation:', err.message);
        }
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmitLead = async () => {
    if (submitting) return;

    // Client-side UX Validation
    if (!customerName.trim()) {
      setErrorMessage('Please enter the customer name');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!productId) {
      setErrorMessage('Please select a product');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload: CreateLeadPayload = {
        product_id: productId,
        customer_name: customerName.trim(),
        mobile: cleanMobile,
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        monthly_salary: monthlySalary ? Number(monthlySalary) : undefined,
        company_name: companyName.trim() || undefined,
      };

      const res = await createLead(payload);
      if (res.success || res.id || res.lead_id) {
        Alert.alert('Success', 'Lead punched successfully!', [
          { text: 'View Leads', onPress: () => router.replace('/leads') },
        ]);
      } else {
        setErrorMessage(res.message || 'Failed to create lead');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create lead. Please check network/inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-left" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Punch a Lead</Text>
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Icon name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Section 1: Product Selection */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>1. Select Product *</Text>
        {loadingProducts ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
        ) : products.length === 0 ? (
          <Text style={styles.helperText}>No active products found.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productPickerRow}>
            {products.map((item: any) => {
              const pId = item.id || item.product_id;
              const isSelected = productId === pId;
              return (
                <TouchableOpacity
                  key={pId}
                  style={[styles.productChip, isSelected && styles.productChipSelected]}
                  onPress={() => setProductId(pId)}
                >
                  <Text style={[styles.productChipText, isSelected && styles.productChipTextSelected]}>
                    {item.name || item.product_name || 'Credit Card'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Section 2: Customer Contact Info */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>2. Customer Information</Text>

        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Rahul Sharma"
          value={customerName}
          onChangeText={setCustomerName}
        />

        <Text style={styles.inputLabel}>Mobile Number *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          maxLength={10}
          value={mobile}
          onChangeText={setMobile}
        />

        <Text style={styles.inputLabel}>Email Address (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. rahul@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Section 3: Professional / Location Details */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>3. Additional Details (Optional)</Text>

        <Text style={styles.inputLabel}>City</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Mumbai, Delhi, Jaipur"
          value={city}
          onChangeText={setCity}
        />

        <Text style={styles.inputLabel}>Monthly Salary (₹)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. 45000"
          keyboardType="numeric"
          value={monthlySalary}
          onChangeText={setMonthlySalary}
        />

        <Text style={styles.inputLabel}>Company Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. TCS, Infosys, Self-Employed"
          value={companyName}
          onChangeText={setCompanyName}
        />
      </View>

      {/* Submit Action */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmitLead}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.submitBtnContent}>
            <Icon name="check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>Submit Lead</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: '#1E293B',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginLeft: 6,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeading: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: spacing.sm,
  },
  productPickerRow: {
    flexDirection: 'row',
  },
  productChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  productChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  productChipTextSelected: {
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.sizes.sm,
    color: '#0F172A',
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
});
