/**
 * Platform-independent Secure Storage Wrapper.
 * Uses SecureStore when available, falling back to AsyncStorage or MemoryStorage.
 */
let SecureStore = null;
let AsyncStorage = null;

try {
  SecureStore = require('expo-secure-store');
} catch (_) {}

try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default || require('@react-native-async-storage/async-storage');
} catch (_) {}

const memoryStorage = new Map();

export const setSecureItem = async (key, value) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(key, stringValue);
    } else if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(key, stringValue);
    } else {
      memoryStorage.set(key, stringValue);
    }
    return true;
  } catch (error) {
    console.warn(`[StorageService] Failed to set secure item '${key}':`, error);
    return false;
  }
};

export const getSecureItem = async (key) => {
  try {
    let result = null;
    if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
      result = await SecureStore.getItemAsync(key);
    } else if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      result = await AsyncStorage.getItem(key);
    } else {
      result = memoryStorage.get(key);
    }
    
    if (!result) return null;
    try {
      return JSON.parse(result);
    } catch (_) {
      return result;
    }
  } catch (error) {
    console.warn(`[StorageService] Failed to get secure item '${key}':`, error);
    return null;
  }
};

export const removeSecureItem = async (key) => {
  try {
    if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
      await SecureStore.deleteItemAsync(key);
    } else if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
      await AsyncStorage.removeItem(key);
    } else {
      memoryStorage.delete(key);
    }
    return true;
  } catch (error) {
    console.warn(`[StorageService] Failed to remove secure item '${key}':`, error);
    return false;
  }
};

export const clearAllAuthData = async () => {
  await removeSecureItem('auth_token');
  await removeSecureItem('refresh_token');
  await removeSecureItem('auth_user');
  await removeSecureItem('working_hours_notice');
};
