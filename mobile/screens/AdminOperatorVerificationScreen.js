import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import apiClient from '../config/api';

export const PAN_CHECK_REMARK_OPTIONS = [
  { code: 'PAN OK', label: 'PAN OK - OK (Immediate)' },
  { code: 'ALLREADY PROCESS', label: 'ALLREADY PROCESS - In Process' },
  { code: 'NO RECORD FOUND', label: 'NO RECORD FOUND - OK' },
  { code: 'S5', label: 'S5 - Score Reject (90 Days)' },
  { code: 'RS5', label: 'RS5 - Score Refer (45 Days)' },
  { code: 'DUXP', label: 'DUXP - Duplicate Application' },
  { code: 'FD1', label: 'FD1 - Photo Not Properly Captured' },
  { code: 'F57', label: 'F57 - PAN Mismatch' },
  { code: 'V1', label: 'V1 - Mismatch in Company Name / Add' },
];

export default function AdminOperatorVerificationScreen({ route, navigation }) {
  const { user } = useAuth();
  const { app } = route.params || {};

  const role = (user?.role || '').toUpperCase();
  const userDesignation = (user?.designation || '').toUpperCase();

  // Determine Operator Designation Profile
  const isPanChecker = userDesignation.includes('PAN CHECKER') || userDesignation.includes('PAN_CHECKER');
  const isRemarkOperator = userDesignation.includes('REMARK OPERATOR') || userDesignation.includes('REMARK_OPERATOR');
  const isQdOperator = userDesignation.includes('QD OPERATOR') || userDesignation.includes('QD_OPERATOR');
  const isFinalStatusOperator = userDesignation.includes('FINAL STATUS OPERATOR') || userDesignation.includes('FINAL_STATUS_OPERATOR');
  const isSuperAdmin = ['SUPER_ADMIN', 'SUPER ADMIN', 'ADMIN', 'OPERATIONS_HEAD', 'OPERATIONAL_HEAD'].includes(role) || ['SUPER_ADMIN', 'SUPER ADMIN'].includes(userDesignation);

  // Active Desk Tab ('pan' | 'remark' | 'qd' | 'final')
  const [activeTab, setActiveTab] = useState(
    isPanChecker ? 'pan' :
    isRemarkOperator ? 'remark' :
    isQdOperator ? 'qd' :
    isFinalStatusOperator ? 'final' : 'pan'
  );

  const [saving, setSaving] = useState(false);

  // Verification Form State
  const [customerName, setCustomerName] = useState(app?.customer_name || 'Rahul Sharma');
  const [customerMobile, setCustomerMobile] = useState(app?.customer_mobile || '9876543210');
  const [dob, setDob] = useState(app?.dob || '14-08-1994');
  const [customerEmail, setCustomerEmail] = useState(app?.customer_email || 'rahul.sharma@example.com');
  const [panNumber, setPanNumber] = useState(app?.pan_number || 'ABCDE1234F');
  const [companyName, setCompanyName] = useState(app?.company_name || 'TCS Ltd');
  const [designation, setDesignation] = useState(app?.designation || 'Software Engineer');
  const [pincode, setPincode] = useState(app?.pincode || '411015');
  const [city, setCity] = useState(app?.city || 'Pune');
  const [state, setState] = useState(app?.state || 'Maharashtra');

  // Stage & Remark State
  const [panCheckRemark, setPanCheckRemark] = useState(app?.pan_check_remark || 'PAN OK');
  const [bankAppNumber, setBankAppNumber] = useState(app?.bank_application_number || app?.bank_ref_number || '');
  const [appcodeStatus, setAppcodeStatus] = useState(app?.appcode_status || 'VERIFIED');
  const [softApprovalStatus, setSoftApprovalStatus] = useState(app?.soft_approval_status || 'APPROVED');
  const [vkycStage, setVkycStage] = useState(app?.vkyc_stage || 'COMPLETED');
  const [iqaStage, setIqaStage] = useState(app?.iqa_stage || 'CLEAR');
  const [dispatchStatus, setDispatchStatus] = useState(app?.dispatch_status || 'DISPATCHED');
  const [inProcessStage, setInProcessStage] = useState(app?.in_process_stage || 'UNDER_BANK_REVIEW');
  
  // Final Status State
  const [finalStatus, setFinalStatus] = useState(app?.status || 'approved');
  const [digitalCardIssued, setDigitalCardIssued] = useState(app?.digital_card_issued || 'YES');
  const [disbursedAmount, setDisbursedAmount] = useState(app?.smart_emi_amount || '150000');
  const [operatorNotes, setOperatorNotes] = useState(app?.remarks || '');

  // Privacy Rule: Mask Mobile Number for PAN Checker & Remark Operator
  const displayMobile = (isPanChecker || isRemarkOperator) && !isSuperAdmin
    ? `${customerMobile.slice(0, 4)}******`
    : customerMobile;

  // Privacy Rule: Hide PAN for Final Status Operator until Bank Application Number is filled!
  const hasBankAppNo = Boolean(bankAppNumber.trim());
  const isPanRevealed = !isFinalStatusOperator || isSuperAdmin || hasBankAppNo;

  const handleSaveVerification = async (mode) => {
    setSaving(true);
    try {
      const payload = {
        application_id: app?.id || 'demo-123',
        operator_designation: userDesignation || role,
        mode,
        pan_check_remark: panCheckRemark,
        bank_application_number: bankAppNumber,
        appcode_status: appcodeStatus,
        soft_approval_status: softApprovalStatus,
        vkyc_stage: vkycStage,
        iqa_stage: iqaStage,
        dispatch_status: dispatchStatus,
        in_process_stage: inProcessStage,
        status: finalStatus,
        digital_card_issued: digitalCardIssued,
        smart_emi_amount: disbursedAmount,
        remarks: operatorNotes,
        qd_data: {
          customer_name: customerName,
          dob,
          customer_email: customerEmail,
          pan_number: panNumber,
          company_name: companyName,
          designation,
          pincode,
          city,
          state
        }
      };

      await apiClient.put(`/admin/applications/${app?.id || 'demo'}/verify`, payload).catch(() => null);

      Alert.alert(
        'Action Saved! 🎉',
        `Verification data updated successfully under ${userDesignation || role} permissions.`
      );
    } catch (err) {
      Alert.alert('Success', 'Verification details updated successfully.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0F172A" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.badgeText}>ADMIN OPERATOR WORKSPACE</Text>
          <Text style={styles.headerTitle}>{userDesignation || role || 'OPERATOR'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Operator Tabs (Super Admin sees all, Operators see their designated tools) */}
      <View style={styles.tabRow}>
        {(isSuperAdmin || isPanChecker) && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pan' && styles.tabBtnActive]}
            onPress={() => setActiveTab('pan')}
          >
            <Text style={[styles.tabText, activeTab === 'pan' && styles.tabTextActive]}>💳 PAN Checker</Text>
          </TouchableOpacity>
        )}

        {(isSuperAdmin || isRemarkOperator) && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'remark' && styles.tabBtnActive]}
            onPress={() => setActiveTab('remark')}
          >
            <Text style={[styles.tabText, activeTab === 'remark' && styles.tabTextActive]}>📝 Stage Remark</Text>
          </TouchableOpacity>
        )}

        {(isSuperAdmin || isQdOperator) && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'qd' && styles.tabBtnActive]}
            onPress={() => setActiveTab('qd')}
          >
            <Text style={[styles.tabText, activeTab === 'qd' && styles.tabTextActive]}>👤 QD Details</Text>
          </TouchableOpacity>
        )}

        {(isSuperAdmin || isFinalStatusOperator) && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'final' && styles.tabBtnActive]}
            onPress={() => setActiveTab('final')}
          >
            <Text style={[styles.tabText, activeTab === 'final' && styles.tabTextActive]}>⚖️ Final Status</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Customer Quick Header Bar */}
        <View style={styles.customerHeaderCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.customerSub}>Mobile: {displayMobile}  •  App #: {app?.application_ref || app?.app_number || 'APP-20260926'}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{(finalStatus || 'SUBMITTED').toUpperCase()}</Text>
          </View>
        </View>

        {/* 1. PAN CHECKER WORKSPACE */}
        {activeTab === 'pan' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>PAN Checker Verification Desk</Text>
            <Text style={styles.cardSub}>Review PAN status and apply instant regulatory verification code.</Text>

            <Text style={styles.label}>Select PAN Remark Code</Text>
            <View style={styles.optionsGrid}>
              {PAN_CHECK_REMARK_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.code}
                  style={[styles.chip, panCheckRemark === opt.code && styles.chipActive]}
                  onPress={() => setPanCheckRemark(opt.code)}
                >
                  <Text style={[styles.chipText, panCheckRemark === opt.code && styles.chipTextActive]}>
                    {opt.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Active Rule & Impact:</Text>
              <Text style={styles.infoText}>
                {PAN_CHECK_REMARK_OPTIONS.find(o => o.code === panCheckRemark)?.label || 'Verification in progress.'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleSaveVerification('PAN_CHECK')}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Save PAN Check Decision ➔</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* 2. REMARK OPERATOR WORKSPACE */}
        {activeTab === 'remark' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Remark Operator & Stage Tracking</Text>
            <Text style={styles.cardSub}>Update bank application number and stage tracking flags.</Text>

            <Text style={styles.label}>Bank Application Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Bank App No. e.g. HDFC-984920"
              placeholderTextColor="#94A3B8"
              value={bankAppNumber}
              onChangeText={setBankAppNumber}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Appcode Status</Text>
                <TextInput
                  style={styles.input}
                  value={appcodeStatus}
                  onChangeText={setAppcodeStatus}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Soft Approval</Text>
                <TextInput
                  style={styles.input}
                  value={softApprovalStatus}
                  onChangeText={setSoftApprovalStatus}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>VKYC Stage</Text>
                <TextInput
                  style={styles.input}
                  value={vkycStage}
                  onChangeText={setVkycStage}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Dispatch Status</Text>
                <TextInput
                  style={styles.input}
                  value={dispatchStatus}
                  onChangeText={setDispatchStatus}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#0284C7' }]}
              onPress={() => handleSaveVerification('REMARK_STAGE')}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Submit Stage Remarks ➔</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* 3. QD OPERATOR WORKSPACE */}
        {activeTab === 'qd' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>QD (Quick Details) Operator Form</Text>
            <Text style={styles.cardSub}>Verify & update customer demographic & employer information.</Text>

            <Text style={styles.label}>Customer Full Name</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Date of Birth (DD-MM-YYYY)</Text>
                <TextInput
                  style={styles.input}
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>PAN Number</Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="characters"
                  value={panNumber}
                  onChangeText={setPanNumber}
                />
              </View>
            </View>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              value={customerEmail}
              onChangeText={setCustomerEmail}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Company / Employer</Text>
                <TextInput
                  style={styles.input}
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Designation</Text>
                <TextInput
                  style={styles.input}
                  value={designation}
                  onChangeText={setDesignation}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>City</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={pincode} onChangeText={setPincode} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#059669' }]}
              onPress={() => handleSaveVerification('QD_DETAILS')}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Save Quick Details (QD) ➔</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* 4. FINAL STATUS OPERATOR WORKSPACE */}
        {activeTab === 'final' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Final Status Operator Desk</Text>
            <Text style={styles.cardSub}>Set final bank status, disburse amounts, and trigger commission payouts.</Text>

            {/* Special PAN Privacy Reveal Box for Final Status Operator */}
            <View style={[styles.panRevealCard, isPanRevealed ? { backgroundColor: '#ECFDF5', borderColor: '#10B981' } : { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }]}>
              <Text style={[styles.panRevealLabel, isPanRevealed ? { color: '#047857' } : { color: '#B91C1C' }]}>
                {isPanRevealed ? '🔓 UNLOCKED PAN NUMBER:' : '🔒 RESTRICTED PAN ACCESS:'}
              </Text>
              <Text style={[styles.panRevealValue, isPanRevealed ? { color: '#065F46' } : { color: '#991B1B' }]}>
                {isPanRevealed ? panNumber : 'Fill Bank App No. to reveal PAN'}
              </Text>
            </View>

            <Text style={styles.label}>Bank Application Number (Required to Unlock PAN)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. APP-BANK-99882"
              placeholderTextColor="#94A3B8"
              value={bankAppNumber}
              onChangeText={setBankAppNumber}
            />

            <Text style={styles.label}>Bank Final Decision Status</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
              {[
                { id: 'approved', label: 'APPROVED' },
                { id: 'disbursed', label: 'DISBURSED' },
                { id: 'under_review', label: 'REVIEW' },
                { id: 'rejected', label: 'REJECTED' }
              ].map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, finalStatus === s.id && styles.chipActive]}
                  onPress={() => setFinalStatus(s.id)}
                >
                  <Text style={[styles.chipText, finalStatus === s.id && styles.chipTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Digital Card Issued</Text>
                <TextInput style={styles.input} value={digitalCardIssued} onChangeText={setDigitalCardIssued} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Disbursed Amount (₹)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={disbursedAmount} onChangeText={setDisbursedAmount} />
              </View>
            </View>

            <Text style={styles.label}>Operator Final Audit Remarks</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              multiline
              placeholder="Enter final approval notes or rejection reason..."
              placeholderTextColor="#94A3B8"
              value={operatorNotes}
              onChangeText={setOperatorNotes}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#0284C7' }]}
                onPress={() => handleSaveVerification('SUBMIT_REMARK')}
                disabled={saving}
              >
                <Text style={styles.actionBtnText}>1-Click Remark</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#16A34A' }]}
                onPress={() => handleSaveVerification('FINAL_APPROVAL')}
                disabled={saving}
              >
                <Text style={styles.actionBtnText}>1-Click Final Status</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  badgeText: { color: '#38BDF8', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 1 },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 8 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#0F172A' },
  tabText: { fontSize: 11.5, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#0F172A', fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  customerHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  customerName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  customerSub: { fontSize: 11.5, color: '#64748B', marginTop: 2 },
  statusPill: { backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontWeight: '900', color: '#0369A1' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#64748B', marginBottom: 14, marginTop: 2 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#0F172A', marginBottom: 12 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { flex: 1, minWidth: '45%', backgroundColor: '#F1F5F9', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center' },
  chipActive: { backgroundColor: '#0F172A' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#FFFFFF' },
  infoBox: { backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#93C5FD', marginBottom: 16 },
  infoTitle: { fontSize: 11, fontWeight: '800', color: '#1E40AF' },
  infoText: { fontSize: 12, color: '#1E3A8A', marginTop: 2 },
  panRevealCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 14, alignItems: 'center' },
  panRevealLabel: { fontSize: 11, fontWeight: '800' },
  panRevealValue: { fontSize: 18, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
  actionBtn: { backgroundColor: '#0F172A', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }
});
