import * as LocalAuthentication from 'expo-local-authentication';
import { getSecureItem, setSecureItem, removeSecureItem } from './storage.service';

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';
const BIOMETRIC_SAVED_TOKEN_KEY = 'biometric_saved_token';
const BIOMETRIC_USER_DATA_KEY = 'biometric_saved_user';

export interface BiometricCapability {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
  biometricName: string;
}

/**
 * Check if the device has biometric hardware and enrolled fingerprints/face
 */
export const checkBiometricCapability = async (): Promise<BiometricCapability> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    const supportedTypes: string[] = [];
    let biometricName = 'Biometrics';

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      supportedTypes.push('FACIAL_RECOGNITION');
      biometricName = 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      supportedTypes.push('FINGERPRINT');
      biometricName = supportedTypes.length > 1 ? 'Face / Fingerprint' : 'Fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      supportedTypes.push('IRIS');
    }

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
      biometricName,
    };
  } catch (error) {
    console.warn('[BiometricService] Capability check failed:', error);
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
      biometricName: 'Biometrics',
    };
  }
};

/**
 * Check if the user has enabled biometric authentication in settings
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const val = await getSecureItem<string>(BIOMETRIC_ENABLED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
};

/**
 * Toggle biometric login on/off
 */
export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  if (enabled) {
    await setSecureItem(BIOMETRIC_ENABLED_KEY, 'true');
  } else {
    await removeSecureItem(BIOMETRIC_ENABLED_KEY);
    await removeSecureItem(BIOMETRIC_SAVED_TOKEN_KEY);
    await removeSecureItem(BIOMETRIC_USER_DATA_KEY);
  }
};

/**
 * Save user session credentials for quick biometric re-login
 */
export const saveBiometricSession = async (token: string, userData: any): Promise<void> => {
  try {
    await setSecureItem(BIOMETRIC_SAVED_TOKEN_KEY, token);
    await setSecureItem(BIOMETRIC_USER_DATA_KEY, userData);
  } catch (err) {
    console.warn('[BiometricService] Failed to save biometric session:', err);
  }
};

/**
 * Retrieve saved session for biometric login
 */
export const getBiometricSession = async (): Promise<{ token: string; user: any } | null> => {
  try {
    const token = await getSecureItem<string>(BIOMETRIC_SAVED_TOKEN_KEY);
    const user = await getSecureItem<any>(BIOMETRIC_USER_DATA_KEY);
    if (token && user) {
      return { token, user };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Trigger biometric prompt (Fingerprint / FaceID)
 */
export const authenticateWithBiometrics = async (
  promptMessage: string = 'Scan your fingerprint or face to verify identity'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { hasHardware, isEnrolled } = await checkBiometricCapability();
    if (!hasHardware || !isEnrolled) {
      return { success: false, error: 'Biometric hardware is not available or not enrolled.' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Password',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    }

    return { success: false, error: result.error || 'Biometric authentication was cancelled or failed.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Authentication error.' };
  }
};
