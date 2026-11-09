import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from './Icon';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import {
  getEmployeeBiometricStatus,
  getBiometricReminderHistory,
  sendBiometricReminder,
  getBiometricPreviewUrl,
  createBiometricReEnrollmentSession,
  commitBiometricReEnrollment,
  getMissingBiometricEnrollments,
  type BiometricStatus,
  type BiometricReminder,
  type MissingEnrollmentEmployee,
  type LocalImageFile,
} from '../services/attendance-enrollment.service';

interface BiometricManagementModalProps {
  visible: boolean;
  onClose: () => void;
  employee?: {
    id?: string;
    employee_id?: string;
    user_id?: string;
    full_name?: string;
    name?: string;
    employee_code?: string;
    department?: string;
    designation?: string;
    face_enrolled?: boolean;
    face_verification_status?: string;
  } | null;
  onUpdated?: () => void;
}

export function BiometricManagementModal({
  visible,
  onClose,
  employee,
  onUpdated,
}: BiometricManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'reenroll' | 'reminders' | 'missing'>('status');

  const empId = employee?.id || employee?.employee_id || employee?.user_id || '';
  const empName = employee?.full_name || employee?.name || 'Employee';
  const empCode = employee?.employee_code || 'EMP';

  // Status state
  const [statusData, setStatusData] = useState<BiometricStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Re-Enrollment state
  const [reason, setReason] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<LocalImageFile | null>(null);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [commitBusy, setCommitBusy] = useState(false);

  // Reminder state
  const [reminderMessage, setReminderMessage] = useState(
    'Please complete your Face Verification photograph in the GharKaPaisa KYC module to activate daily biometric attendance.'
  );
  const [reminderHistory, setReminderHistory] = useState<BiometricReminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  // Missing Queue state
  const [missingEmployees, setMissingEmployees] = useState<MissingEnrollmentEmployee[]>([]);
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchSending, setBatchSending] = useState(false);

  // Load Status & Reminders for selected employee
  const loadStatusAndHistory = useCallback(async () => {
    if (!empId) return;
    setLoadingStatus(true);
    setLoadingReminders(true);
    setPreviewUrl(null);
    try {
      const [statusRes, remindersRes] = await Promise.allSettled([
        getEmployeeBiometricStatus(empId),
        getBiometricReminderHistory(empId),
      ]);

      if (statusRes.status === 'fulfilled') {
        setStatusData(statusRes.value);
      }
      if (remindersRes.status === 'fulfilled') {
        setReminderHistory(remindersRes.value);
      }
    } catch (e) {
      console.warn('Failed to load biometric data:', e);
    } finally {
      setLoadingStatus(false);
      setLoadingReminders(false);
    }
  }, [empId]);

  // Load missing queue
  const loadMissingQueue = useCallback(async () => {
    setLoadingMissing(true);
    try {
      const res = await getMissingBiometricEnrollments({ search: searchQuery });
      setMissingEmployees(res.employees || []);
    } catch (err) {
      console.warn('Failed to load missing enrollments:', err);
    } finally {
      setLoadingMissing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (visible) {
      if (empId) {
        setActiveTab('status');
        loadStatusAndHistory();
      } else {
        setActiveTab('missing');
        loadMissingQueue();
      }
    } else {
      // Reset state on close
      setSessionToken(null);
      setSelectedImage(null);
      setReason('');
      setPreviewUrl(null);
    }
  }, [visible, empId, loadStatusAndHistory, loadMissingQueue]);

  // Preview Face Reference
  const handleFetchPreview = async () => {
    if (!empId) return;
    setLoadingPreview(true);
    try {
      const res = await getBiometricPreviewUrl(empId);
      if (res?.signedUrl) {
        setPreviewUrl(res.signedUrl);
      } else {
        Alert.alert('Preview Unavailable', 'No preview URL generated for this employee.');
      }
    } catch (err: any) {
      Alert.alert('Preview Error', err?.message || 'Could not load biometric preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Re-enrollment Step 1: Create Session
  const handleStartReEnrollment = async () => {
    if (!reason || reason.trim().length < 5) {
      Alert.alert('Validation Error', 'Please enter a valid justification (at least 5 characters).');
      return;
    }
    setSessionBusy(true);
    try {
      const res = await createBiometricReEnrollmentSession(empId, reason.trim());
      if (res.sessionToken) {
        setSessionToken(res.sessionToken);
        Alert.alert('Session Created', 'Re-enrollment session initialized. Please capture or upload a new face photograph.');
      }
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Failed to initialize re-enrollment session.');
    } finally {
      setSessionBusy(false);
    }
  };

  // Pick Image from Camera
  const handleCaptureCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Denied', 'Camera permission is required to capture face reference.');
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || `face_reference_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  // Pick Image from Library
  const handlePickLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Denied', 'Photo library permission is required to select an image.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || `face_reference_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  // Re-enrollment Step 2: Commit Face
  const handleCommitReEnrollment = async () => {
    if (!sessionToken) {
      Alert.alert('Missing Session', 'Please initiate a re-enrollment session first.');
      return;
    }
    if (!selectedImage) {
      Alert.alert('Missing Image', 'Please capture or select a face photograph.');
      return;
    }

    setCommitBusy(true);
    try {
      await commitBiometricReEnrollment(sessionToken, selectedImage);
      Alert.alert('Success 🎉', `Biometric reference updated successfully for ${empName}.`);
      setSessionToken(null);
      setSelectedImage(null);
      setReason('');
      loadStatusAndHistory();
      setActiveTab('status');
      if (onUpdated) onUpdated();
    } catch (err: any) {
      Alert.alert('Commit Failed', err?.message || 'Could not update biometric reference.');
    } finally {
      setCommitBusy(false);
    }
  };

  // Send Single Reminder
  const handleSendReminder = async (targetId?: string) => {
    const idToSend = targetId || empId;
    if (!idToSend) return;
    setSendingReminder(true);
    try {
      await sendBiometricReminder(idToSend, reminderMessage.trim());
      Alert.alert('Reminder Sent 🔔', 'Face verification reminder notification dispatched.');
      loadStatusAndHistory();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to dispatch verification reminder.');
    } finally {
      setSendingReminder(false);
    }
  };

  // Batch Remind All
  const handleBatchRemind = async () => {
    if (missingEmployees.length === 0) return;
    Alert.alert(
      'Batch Reminder',
      `Dispatch face verification reminder to all ${missingEmployees.length} pending employees?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send to All',
          onPress: async () => {
            setBatchSending(true);
            let sent = 0;
            let throttled = 0;
            for (const emp of missingEmployees) {
              const targetId = emp.id;
              try {
                await sendBiometricReminder(targetId, reminderMessage.trim());
                sent++;
              } catch (e: any) {
                if (e?.message?.includes('throttled') || e?.status === 429) {
                  throttled++;
                }
              }
            }
            setBatchSending(false);
            Alert.alert(
              'Batch Complete',
              `Dispatched ${sent} reminders.${throttled > 0 ? ` (${throttled} skipped due to 10-minute anti-spam cooldown).` : ''}`
            );
            loadMissingQueue();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="x" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Biometric Management</Text>
            <Text style={styles.headerSub}>
              {empName} • {empCode}
            </Text>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {empId ? (
            <>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'status' && styles.tabItemActive]}
                onPress={() => setActiveTab('status')}
              >
                <Icon name="shield" size={16} color={activeTab === 'status' ? colors.primary : '#94A3B8'} />
                <Text style={[styles.tabLabel, activeTab === 'status' && styles.tabLabelActive]}>Status</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'reenroll' && styles.tabItemActive]}
                onPress={() => setActiveTab('reenroll')}
              >
                <Icon name="camera" size={16} color={activeTab === 'reenroll' ? colors.primary : '#94A3B8'} />
                <Text style={[styles.tabLabel, activeTab === 'reenroll' && styles.tabLabelActive]}>Re-Enroll</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'reminders' && styles.tabItemActive]}
                onPress={() => setActiveTab('reminders')}
              >
                <Icon name="bell" size={16} color={activeTab === 'reminders' ? colors.primary : '#94A3B8'} />
                <Text style={[styles.tabLabel, activeTab === 'reminders' && styles.tabLabelActive]}>Reminders</Text>
              </TouchableOpacity>
            </>
          ) : null}

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'missing' && styles.tabItemActive]}
            onPress={() => {
              setActiveTab('missing');
              loadMissingQueue();
            }}
          >
            <Icon name="users" size={16} color={activeTab === 'missing' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'missing' && styles.tabLabelActive]}>Pending Queue</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* TAB 1: STATUS */}
          {activeTab === 'status' && (
            <View>
              {loadingStatus ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.subtleText}>Loading biometric verification status...</Text>
                </View>
              ) : (
                <>
                  {/* Status Banner */}
                  <View
                    style={[
                      styles.card,
                      statusData?.is_enrolled
                        ? { borderColor: '#10B981', backgroundColor: '#064E3B15' }
                        : { borderColor: '#F59E0B', backgroundColor: '#78350F15' },
                    ]}
                  >
                    <View style={styles.rowBetween}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={[
                            styles.iconBadge,
                            { backgroundColor: statusData?.is_enrolled ? '#10B981' : '#F59E0B' },
                          ]}
                        >
                          <Icon name={statusData?.is_enrolled ? 'check' : 'alert-triangle'} size={20} color="#fff" />
                        </View>
                        <View>
                          <Text style={styles.cardHeading}>
                            {statusData?.is_enrolled ? 'Face Biometric Enrolled' : 'Face Verification Pending'}
                          </Text>
                          <Text style={styles.cardSub}>
                            Status: <Text style={{ fontWeight: '700', color: '#fff' }}>{statusData?.status || 'PENDING'}</Text>
                          </Text>
                        </View>
                      </View>
                    </View>

                    {statusData?.active_template && (
                      <View style={styles.templateDetails}>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>Template Version:</Text>
                          <Text style={styles.metaVal}>V{statusData.active_template.version}</Text>
                        </View>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>Enrolled At:</Text>
                          <Text style={styles.metaVal}>
                            {new Date(statusData.active_template.enrolled_at).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>Source:</Text>
                          <Text style={styles.metaVal}>{statusData.active_template.enrollment_source || 'KYC Module'}</Text>
                        </View>
                        {statusData.active_template.enrolled_by_name && (
                          <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Enrolled By:</Text>
                            <Text style={styles.metaVal}>{statusData.active_template.enrolled_by_name}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Face Preview Card */}
                  <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Authoritative Face Reference</Text>
                    <Text style={styles.subtleText}>
                      Secure high-resolution biometric face template stored in encrypted private cloud storage.
                    </Text>

                    {previewUrl ? (
                      <View style={styles.previewContainer}>
                        <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="cover" />
                        <Text style={styles.previewNotice}>
                          🔒 Temporary Signed URL generated. Expires in 5 minutes.
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.actionOutlineBtn}
                        onPress={handleFetchPreview}
                        disabled={loadingPreview}
                      >
                        {loadingPreview ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <>
                            <Icon name="eye" size={16} color={colors.primary} />
                            <Text style={styles.actionOutlineBtnText}>Generate Secure Face Preview</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Quick Actions */}
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { flex: 1 }]}
                      onPress={() => setActiveTab('reenroll')}
                    >
                      <Icon name="refresh-cw" size={16} color="#fff" />
                      <Text style={styles.primaryBtnText}>Re-Enroll Reference</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.secondaryBtn, { flex: 1 }]}
                      onPress={() => setActiveTab('reminders')}
                    >
                      <Icon name="bell" size={16} color="#fff" />
                      <Text style={styles.secondaryBtnText}>Send Reminder</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Template History */}
                  {statusData?.history && statusData.history.length > 0 && (
                    <View style={[styles.card, { marginTop: spacing.md }]}>
                      <Text style={styles.sectionHeading}>Template Version History</Text>
                      {statusData.history.map((t, idx) => (
                        <View key={t.id || idx} style={styles.historyItem}>
                          <View style={styles.historyTop}>
                            <Text style={styles.historyVer}>Version {t.version}</Text>
                            <Text style={[styles.historyStatus, { color: t.status === 'ACTIVE' ? '#10B981' : '#94A3B8' }]}>
                              {t.status}
                            </Text>
                          </View>
                          <Text style={styles.historyDate}>
                            Enrolled: {new Date(t.enrolled_at).toLocaleDateString()}
                          </Text>
                          {t.revocation_reason && (
                            <Text style={styles.historyRevoked}>
                              Revoked: {t.revocation_reason} ({t.revoked_at ? new Date(t.revoked_at).toLocaleDateString() : ''})
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* TAB 2: RE-ENROLLMENT */}
          {activeTab === 'reenroll' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Biometric Re-Enrollment Protocol</Text>
                <Text style={styles.subtleText}>
                  Replacing an active facial template requires Super-Admin authorization and an audit-trail business
                  justification.
                </Text>

                {/* Step 1: Justification & Session */}
                {!sessionToken ? (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={styles.inputLabel}>Reason / Justification *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Employee changed appearance, facial surgery, or poor KYC quality"
                      placeholderTextColor="#64748B"
                      value={reason}
                      onChangeText={setReason}
                      multiline
                      numberOfLines={3}
                    />

                    <TouchableOpacity
                      style={[styles.primaryBtn, { marginTop: spacing.md }]}
                      onPress={handleStartReEnrollment}
                      disabled={sessionBusy}
                    >
                      {sessionBusy ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Icon name="key" size={16} color="#fff" />
                          <Text style={styles.primaryBtnText}>Initiate Authorized Session</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Step 2: Photo Capture & Commit */
                  <View style={{ marginTop: spacing.md }}>
                    <View style={styles.sessionBanner}>
                      <Icon name="check-circle" size={16} color="#10B981" />
                      <Text style={styles.sessionBannerText}>Authorized Session Active (Valid for 15 mins)</Text>
                    </View>

                    {selectedImage ? (
                      <View style={styles.previewContainer}>
                        <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="cover" />
                        <TouchableOpacity
                          style={styles.retakeBtn}
                          onPress={() => setSelectedImage(null)}
                        >
                          <Text style={styles.retakeBtnText}>Change Photo</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.captureOptions}>
                        <TouchableOpacity style={styles.captureBtn} onPress={handleCaptureCamera}>
                          <Icon name="camera" size={24} color={colors.primary} />
                          <Text style={styles.captureBtnTitle}>Take Front Photo</Text>
                          <Text style={styles.captureBtnSub}>Camera capture</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.captureBtn} onPress={handlePickLibrary}>
                          <Icon name="image" size={24} color="#0284C7" />
                          <Text style={styles.captureBtnTitle}>Upload Photo</Text>
                          <Text style={styles.captureBtnSub}>From photo gallery</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        { marginTop: spacing.lg, backgroundColor: selectedImage ? colors.primary : '#334155' },
                      ]}
                      onPress={handleCommitReEnrollment}
                      disabled={commitBusy || !selectedImage}
                    >
                      {commitBusy ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Icon name="upload-cloud" size={16} color="#fff" />
                          <Text style={styles.primaryBtnText}>Commit Replacement Template</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB 3: REMINDERS */}
          {activeTab === 'reminders' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Send Verification Reminder</Text>
                <Text style={styles.subtleText}>
                  Sends an in-app priority push notification and WhatsApp prompt to complete face capture.
                </Text>

                <View style={{ marginTop: spacing.md }}>
                  <Text style={styles.inputLabel}>Reminder Message</Text>
                  <TextInput
                    style={styles.textInput}
                    value={reminderMessage}
                    onChangeText={setReminderMessage}
                    multiline
                    numberOfLines={3}
                  />

                  <TouchableOpacity
                    style={[styles.primaryBtn, { marginTop: spacing.md }]}
                    onPress={() => handleSendReminder()}
                    disabled={sendingReminder}
                  >
                    {sendingReminder ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="send" size={16} color="#fff" />
                        <Text style={styles.primaryBtnText}>Dispatch Reminder Notification</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reminder Log */}
              <View style={[styles.card, { marginTop: spacing.md }]}>
                <Text style={styles.sectionHeading}>Reminder Dispatch Log</Text>
                {loadingReminders ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                ) : reminderHistory.length === 0 ? (
                  <Text style={styles.emptySubText}>No reminders sent yet to this employee.</Text>
                ) : (
                  reminderHistory.map((rem, idx) => (
                    <View key={rem.id || idx} style={styles.historyItem}>
                      <View style={styles.historyTop}>
                        <Text style={styles.historyVer}>{rem.sent_by_name || 'Administrator'}</Text>
                        <Text style={[styles.historyStatus, { color: rem.status === 'COMPLETED' ? '#10B981' : '#38BDF8' }]}>
                          {rem.status}
                        </Text>
                      </View>
                      <Text style={styles.historyDate}>{new Date(rem.sent_at).toLocaleString()}</Text>
                      <Text style={styles.reminderMsgText}>"{rem.message}"</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* TAB 4: PENDING QUEUE */}
          {activeTab === 'missing' && (
            <View>
              {/* Batch Action Bar */}
              <View style={styles.queueHeaderRow}>
                <View style={styles.searchBar}>
                  <Icon name="search" size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search missing employees..."
                    placeholderTextColor="#64748B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={loadMissingQueue}
                  />
                </View>
                <TouchableOpacity
                  style={styles.batchBtn}
                  onPress={handleBatchRemind}
                  disabled={batchSending || missingEmployees.length === 0}
                >
                  {batchSending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="bell" size={14} color="#fff" />
                      <Text style={styles.batchBtnText}>Remind All ({missingEmployees.length})</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {loadingMissing ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.subtleText}>Loading pending verification queue...</Text>
                </View>
              ) : missingEmployees.length === 0 ? (
                <View style={styles.centerContainer}>
                  <Icon name="check-circle" size={48} color="#10B981" />
                  <Text style={styles.emptyTitleText}>All Caught Up!</Text>
                  <Text style={styles.emptySubText}>
                    All registered employees have enrolled their facial biometric templates.
                  </Text>
                </View>
              ) : (
                missingEmployees.map((emp) => (
                  <View key={emp.id} style={styles.queueItem}>
                    <View style={styles.queueItemLeft}>
                      <View style={styles.queueAvatar}>
                        <Text style={styles.queueAvatarText}>
                          {(emp.full_name || 'E').substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.queueName}>{emp.full_name}</Text>
                        <Text style={styles.queueMeta}>
                          {emp.employee_code || 'EMP'} • {emp.department || 'Operations'}
                        </Text>
                        <Text style={styles.queueStatus}>
                          Face Status: <Text style={{ color: '#F59E0B' }}>{emp.face_verification_status}</Text>
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.queueRemindBtn}
                      onPress={() => handleSendReminder(emp.id)}
                    >
                      <Icon name="send" size={14} color="#fff" />
                      <Text style={styles.queueRemindBtnText}>Remind</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
    marginRight: spacing.sm,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingHorizontal: spacing.xs,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  subtleText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  templateDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  previewImage: {
    width: width - 64,
    height: width - 64,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
  },
  previewNotice: {
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 8,
    fontWeight: '600',
  },
  actionOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: spacing.md,
    backgroundColor: '#1E293B',
  },
  actionOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    color: '#FFFFFF',
    fontSize: 13,
    textAlignVertical: 'top',
  },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#064E3B30',
    borderColor: '#10B981',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  sessionBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  captureOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.sm,
  },
  captureBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
  },
  captureBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  captureBtnSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  retakeBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  retakeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyVer: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  historyRevoked: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 2,
  },
  reminderMsgText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
    fontStyle: 'italic',
  },
  queueHeaderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
    fontSize: 13,
  },
  batchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  batchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  queueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  queueItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  queueAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
  },
  queueName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  queueMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  queueStatus: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  queueRemindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  queueRemindBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
});
