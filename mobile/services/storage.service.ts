import * as SecureStore from 'expo-secure-store';

export const setSecureItem = async (key: string, value: any): Promise<boolean> => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await SecureStore.setItemAsync(key, stringValue);
    return true;
  } catch (error) {
    console.warn(`[StorageService] SecureStore set error '${key}':`, error);
    return false;
  }
};

export const getSecureItem = async <T = any>(key: string): Promise<T | null> => {
  try {
    const result = await SecureStore.getItemAsync(key);
    if (!result) return null;
    try {
      return JSON.parse(result) as T;
    } catch (_) {
      return result as unknown as T;
    }
  } catch (error) {
    console.warn(`[StorageService] SecureStore get error '${key}':`, error);
    return null;
  }
};

export const removeSecureItem = async (key: string): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.warn(`[StorageService] SecureStore remove error '${key}':`, error);
    return false;
  }
};

export const clearAuthStorage = async (): Promise<void> => {
  await removeSecureItem('auth_token');
  await removeSecureItem('refresh_token');
  await removeSecureItem('auth_user');
};
