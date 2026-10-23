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
  Modal,
  Linking,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/Icon';
import { createLead, CreateLeadPayload, sendLeadOtp, verifyLeadOtp } from '../../services/lead.service';
import {
  fetchProductsList,
  generatePartnerShareLink,
  fetchProductApplication,
  fetchPincodeInfo,
} from '../../services/partner.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const PROCESS_TYPES = [
  { id: 'lead_punching', title: 'Punching Only', description: 'Record lead directly into CRM', icon: 'user-plus' },
  { id: 'linked_share', title: 'Link Share', description: 'Generate tracked link for WhatsApp', icon: 'share-2' },
  { id: 'direct_bank', title: 'Direct Link', description: 'Open official bank portal', icon: 'external-link' },
  { id: 'co_browsing', title: 'Co-Browsing', description: 'Live customer guidance session', icon: 'monitor' },
  { id: 'physical_process', title: 'Physical Process', description: 'Generate offline detail sheet', icon: 'file-text' },
];

const BUSINESS_TYPES = ['Micro-Enterprise', 'Small-Enterprise', 'Medium-Enterprise', 'Large-Enterprise', 'Self-Employed', 'Salaried'];

export default function AddLeadScreen() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [pan, setPan] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [monthlySalary, setMonthlySalary] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('Micro-Enterprise');
  
  // Process & Terms
  const [processType, setProcessType] = useState<string>('lead_punching');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>('');
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [showShareResult, setShowShareResult] = useState<boolean>(false);
  const [shareResult, setShareResult] = useState<any>(null);
  const [loadingPincode, setLoadingPincode] = useState<boolean>(false);

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

  const handlePincodeBlur = async () => {
    if (pincode.length === 6) {
      try {
        setLoadingPincode(true);
        const res = await fetchPincodeInfo(pincode);
        const info = res?.data || res;
        if (info) {
          setCity(info.city || info.district || '');
          setState(info.state || '');
        }
      } catch (error) {
        console.warn('Failed to fetch pincode details:', error);
      } finally {
        setLoadingPincode(false);
      }
    }
  };

  const handleSubmitLead = async () => {
    if (submitting) return;

    // Validation
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
    if (!agreeTerms) {
      setErrorMessage('Please agree to the terms and conditions');
      return;
    }

    // HDFC Credit Card PAN validation
    const selectedProd = products.find((p: any) => (p.id || p.product_id) === productId);
    const bankName = String(selectedProd?.bank_name || selectedProd?.bank_code || '').toUpperCase();
    const prodName = String(selectedProd?.name || selectedProd?.product_name || '').toUpperCase();
    const prodCat = String(selectedProd?.category || '').toLowerCase();
    const isLocEoc = ['loc', 'eoc', 'loc_eoc', 'loan_on_credit_card', 'smart_emi', 'loan_on_card', 'card_on_loan'].includes(prodCat);
    const isOtherCat = prodCat.includes('loan') || prodCat.includes('insurance');
    const isHdfcCreditCard = (
      selectedProd?.bank_id === 'f0b5742d-f04d-4a91-b162-6009ddf6e345' ||
      bankName.includes('HDFC') ||
      prodName.includes('HDFC')
    ) && !isLocEoc && !isOtherCat;

    if (isHdfcCreditCard) {
      const cleanPan = pan.trim().toUpperCase();
      if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
        setErrorMessage('Please enter a valid 10-character PAN number (e.g. ABCDE1234F)');
        return;
      }
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload: CreateLeadPayload = {
        product_id: productId,
        customer_name: customerName.trim(),
        mobile: cleanMobile,
        pan: pan.trim().toUpperCase() || undefined,
        pan_number: pan.trim().toUpperCase() || undefined,
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        monthly_salary: monthlySalary ? Number(monthlySalary) : undefined,
        company_name: companyName.trim() || undefined,
        business_type: businessType,
        process_type: processType,
      };

      if (processType === 'lead_punching') {
        const res = await createLead(payload);
        if (res.success || res.id || res.lead_id) {
          setPendingLeadId(res.id || res.lead_id);
          setShowOtpModal(true);
        } else {
          setErrorMessage(res.message || 'Failed to create lead');
        }
      } else if (processType === 'linked_share') {
        const res = await generatePartnerShareLink(productId, {
          customer_name: customerName.trim(),
          customer_mobile: cleanMobile,
        });
        const link = res?.data?.share_link || res?.data?.share_url || res?.share_link;
        if (!link) {
          setErrorMessage(res?.message || 'Failed to generate share link');
          return;
        }
        setShareResult({ title: 'Share Link Ready', url: link, kind: 'link' });
        setShowShareResult(true);
        setAgreeTerms(false);
      } else if (processType === 'direct_bank') {
        // Persist the lead for tracking, then open the official bank portal.
        const created = await createLead(payload);
        const appRes = await fetchProductApplication(productId);
        const appData = appRes?.data || appRes || {};
        const targetUrl = appData.application_url;
        if (!targetUrl) {
          setErrorMessage('No application link is configured for this product yet.');
          return;
        }
        setShareResult({
          title: `${appData.provider_name || 'Bank'} Portal`,
          url: targetUrl,
          kind: 'bank',
          leadId: created?.id || created?.lead_id,
        });
        setShowShareResult(true);
        setAgreeTerms(false);
      } else if (processType === 'co_browsing') {
        // Create the lead, generate a tracked link and open a guided session.
        const created = await createLead(payload);
        const res = await generatePartnerShareLink(productId, {
          customer_name: customerName.trim(),
          customer_mobile: cleanMobile,
        });
        const link = res?.data?.share_link || res?.data?.share_url || res?.share_link || '';
        const selectedProd = products.find((p: any) => (p.id || p.product_id) === productId);
        const prodLabel = selectedProd?.name || selectedProd?.product_name || 'the product';
        const guideText = `Hi ${customerName.trim()}, I will guide you through the application for ${prodLabel}. Please open this link while we are connected:\n${link}`;
        try {
          await Share.share({ message: guideText });
        } catch (_) {}
        setShareResult({
          title: 'Co-Browsing Session Started',
          url: link,
          kind: 'link',
          leadId: created?.id || created?.lead_id,
        });
        setShowShareResult(true);
        setAgreeTerms(false);
      } else if (processType === 'physical_process') {
        // Create the lead and produce an offline detail sheet to share/print.
        const created = await createLead(payload);
        const leadNumber = created?.lead_number || created?.id || 'N/A';
        const sheet = [
          'GHARKAPAISA — OFFLINE APPLICATION SHEET',
          '--------------------------------------',
          `Lead No: ${leadNumber}`,
          `Customer: ${customerName.trim()}`,
          `Mobile: +91 ${cleanMobile}`,
          `Email: ${email.trim() || '-'}`,
          `PAN: ${pan.trim().toUpperCase() || '-'}`,
          `City / State: ${city.trim() || '-'} / ${state.trim() || '-'}`,
          `Pincode: ${pincode.trim() || '-'}`,
          `Business Type: ${businessType}`,
          `Monthly Salary: ₹${monthlySalary || '-'}`,
          `Company: ${companyName.trim() || '-'}`,
          `Process: Physical Process (Offline)`,
        ].join('\n');
        try {
          await Share.share({ title: 'Offline Application Detail Sheet', message: sheet });
        } catch (_) {}
        setShareResult({ title: 'Physical Process Sheet', url: '', kind: 'sheet', sheet, leadId: created?.id || created?.lead_id });
        setShowShareResult(true);
        setAgreeTerms(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create lead. Please check network/inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue.trim() || otpValue.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setSubmitting(true);
      await verifyLeadOtp(String(pendingLeadId), otpValue.trim());

      setShowOtpModal(false);
      setOtpValue('');
      setPendingLeadId(null);
      Alert.alert('Success', 'Lead verified successfully!', [
        { text: 'View Leads', onPress: () => router.replace('/leads') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Invalid OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingLeadId) return;
    try {
      await sendLeadOtp(String(pendingLeadId));
      Alert.alert('Success', 'OTP resent successfully');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to resend OTP');
    }
  };

  const handleShareAction = async () => {
    if (!shareResult) return;
    try {
      if (shareResult.kind === 'bank' && shareResult.url) {
        await Linking.openURL(shareResult.url);
      } else if (shareResult.kind === 'sheet') {
        await Share.share({ title: 'Offline Application Detail Sheet', message: shareResult.sheet });
      } else if (shareResult.url) {
        await Share.share({ message: shareResult.url });
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to open or share the link. Please try again.');
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

      {/* Section 2: Process Type */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>2. Select Process Type *</Text>
        <View style={styles.processGrid}>
          {PROCESS_TYPES.map((process, index) => (
            <TouchableOpacity
              key={process.id}
              style={[styles.processCard, processType === process.id && styles.processCardSelected]}
              onPress={() => setProcessType(process.id)}
            >
              <View style={styles.processNumber}>
                <Text style={styles.processNumberText}>{index + 1}</Text>
              </View>
              <Icon name={process.icon as any} size={24} color={processType === process.id ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.processTitle, processType === process.id && styles.processTitleSelected]}>
                {process.title}
              </Text>
              <Text style={[styles.processDesc, processType === process.id && styles.processDescSelected]}>
                {process.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Section 3: Customer Contact Info */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>3. Customer Information</Text>

        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Rahul Sharma"
          value={customerName}
          onChangeText={setCustomerName}
        />

        <Text style={styles.inputLabel}>Mobile Number *</Text>
        <View style={styles.mobileInputContainer}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={[styles.textInput, styles.mobileInput]}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobile}
            onChangeText={setMobile}
          />
        </View>

        {(() => {
          const selectedProd = products.find((p: any) => (p.id || p.product_id) === productId);
          const bankName = String(selectedProd?.bank_name || selectedProd?.bank_code || '').toUpperCase();
          const prodName = String(selectedProd?.name || selectedProd?.product_name || '').toUpperCase();
          const prodCat = String(selectedProd?.category || '').toLowerCase();
          const isLocEoc = ['loc', 'eoc', 'loc_eoc', 'loan_on_credit_card', 'smart_emi', 'loan_on_card', 'card_on_loan'].includes(prodCat);
          const isOtherCat = prodCat.includes('loan') || prodCat.includes('insurance');
          const isHdfcCreditCard = (
            selectedProd?.bank_id === 'f0b5742d-f04d-4a91-b162-6009ddf6e345' ||
            bankName.includes('HDFC') ||
            prodName.includes('HDFC')
          ) && !isLocEoc && !isOtherCat;

          if (!isHdfcCreditCard) return null;
          return (
            <>
              <Text style={styles.inputLabel}>PAN Number *</Text>
              <TextInput
                style={[styles.textInput, { fontFamily: 'monospace', fontWeight: 'bold' }]}
                placeholder="e.g. ABCDE1234F"
                autoCapitalize="characters"
                maxLength={10}
                value={pan}
                onChangeText={(text) => setPan(text.toUpperCase())}
              />
            </>
          );
        })()}

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

      {/* Section 4: Address Details */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>4. Address Details</Text>

        <Text style={styles.inputLabel}>Pincode</Text>
        <TextInput
          style={styles.textInput}
          placeholder="6-digit pincode"
          keyboardType="numeric"
          maxLength={6}
          value={pincode}
          onChangeText={setPincode}
          onBlur={handlePincodeBlur}
        />
        {loadingPincode && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />}

        <Text style={styles.inputLabel}>City</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Auto-filled from pincode"
          value={city}
          onChangeText={setCity}
        />

        <Text style={styles.inputLabel}>State</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Auto-filled from pincode"
          value={state}
          onChangeText={setState}
        />
      </View>

      {/* Section 5: Professional Details */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>5. Professional Details (Optional)</Text>

        <Text style={styles.inputLabel}>Business Type</Text>
        <View style={styles.businessTypeContainer}>
          {BUSINESS_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.businessTypeChip, businessType === type && styles.businessTypeChipSelected]}
              onPress={() => setBusinessType(type)}
            >
              <Text style={[styles.businessTypeText, businessType === type && styles.businessTypeTextSelected]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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

      {/* Section 6: Terms */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setAgreeTerms(!agreeTerms)}
        >
          <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
            {agreeTerms && <Icon name="check" size={12} color="#FFFFFF" />}
          </View>
          <Text style={styles.termsText}>
            I agree to the terms and conditions for lead submission
          </Text>
        </TouchableOpacity>
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
            <Text style={styles.submitBtnText}>
              {processType === 'lead_punching' ? 'Submit Lead' : 
               processType === 'linked_share' ? 'Generate Link' :
               processType === 'direct_bank' ? 'Open Bank Portal' :
               processType === 'co_browsing' ? 'Start Co-Browsing' : 'Generate Detail Sheet'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* OTP Modal */}
      <Modal visible={showOtpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify OTP</Text>
            <Text style={styles.modalSubtitle}>
              An OTP has been sent to +91 {mobile.replace(/\D/g, '').replace(/(\d{5})(\d{5})/, '$1-$2')}
            </Text>
            
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otpValue}
              onChangeText={setOtpValue}
            />
            
            <TouchableOpacity
              style={[styles.modalButton, styles.verifyButton]}
              onPress={handleVerifyOtp}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendOtp}
            >
              <Text style={styles.resendButtonText}>Resend OTP</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowOtpModal(false);
                setOtpValue('');
                setPendingLeadId(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share / Result Modal (link share, direct bank, co-browsing, physical sheet) */}
      <Modal visible={showShareResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{shareResult?.title || 'Ready'}</Text>

            {shareResult?.kind === 'sheet' ? (
              <ScrollView style={styles.sheetBox}>
                <Text style={styles.sheetText}>{shareResult?.sheet}</Text>
              </ScrollView>
            ) : (
              <Text style={styles.linkText} numberOfLines={3}>{shareResult?.url}</Text>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.verifyButton]}
              onPress={handleShareAction}
            >
              <Text style={styles.modalButtonText}>
                {shareResult?.kind === 'bank'
                  ? 'Open Portal'
                  : shareResult?.kind === 'sheet'
                    ? 'Share / Print Sheet'
                    : 'Share Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowShareResult(false);
                setShareResult(null);
                router.replace('/leads');
              }}
            >
              <Text style={styles.cancelButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  processGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  processCard: {
    width: '48%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  processCardSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  processNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  processNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  processTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  processTitleSelected: {
    color: '#FFFFFF',
  },
  processDesc: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  processDescSelected: {
    color: '#E0E7FF',
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
  mobileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: '#475569',
    marginRight: 8,
  },
  mobileInput: {
    flex: 1,
  },
  businessTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  businessTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  businessTypeChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  businessTypeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  businessTypeTextSelected: {
    color: '#FFFFFF',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  termsText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: typography.sizes.sm,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  otpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 16,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButton: {
    backgroundColor: '#2563EB',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  resendButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  resendButtonText: {
    color: '#2563EB',
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: '#2563EB',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  sheetBox: {
    maxHeight: 240,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  sheetText: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
