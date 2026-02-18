import CryptoJS from 'crypto-js';

// ----------------------------------------------------------------------

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'wisling-default-encryption-key-2024';

// ----------------------------------------------------------------------

export const encryptId = (id: string): string => {
  try {
    return CryptoJS.AES.encrypt(id, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt ID');
  }
};

export const decryptId = (encryptedId: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedId, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error('Invalid encrypted data');
    }

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt ID');
  }
};

export const encodeForUrl = (encryptedId: string): string => {
  try {
    return encodeURIComponent(encryptedId);
  } catch (error) {
    console.error('URL encoding error:', error);
    throw new Error('Failed to encode for URL');
  }
};

export const decodeFromUrl = (encodedId: string): string => {
  try {
    return decodeURIComponent(encodedId);
  } catch (error) {
    console.error('URL decoding error:', error);
    throw new Error('Failed to decode from URL');
  }
};

// ----------------------------------------------------------------------

export const encryptAndEncodeId = (id: string): string => {
  const encrypted = encryptId(id);
  return encodeForUrl(encrypted);
};

export const decodeAndDecryptId = (encodedEncryptedId: string): string => {
  const decoded = decodeFromUrl(encodedEncryptedId);
  return decryptId(decoded);
};

// ----------------------------------------------------------------------

export const isValidEncryptedId = (encryptedId: string): boolean => {
  try {
    decryptId(encryptedId);
    return true;
  } catch {
    return false;
  }
};

export const isValidEncodedEncryptedId = (encodedEncryptedId: string): boolean => {
  try {
    const decoded = decodeFromUrl(encodedEncryptedId);
    return isValidEncryptedId(decoded);
  } catch {
    return false;
  }
};
