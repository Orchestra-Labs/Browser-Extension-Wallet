import { lib, SHA512 } from 'crypto-js';
import { getLocalStorageItem, setLocalStorageItem } from './localStorage';
import { PasswordRecord } from '@/types';

const PASSWORD_KEY = 'passwordHash';

// Utility function to check localStorage availability
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

export const getPasswordRecords = (): PasswordRecord[] => {
  if (!isLocalStorageAvailable()) {
    console.error('localStorage is not available in this environment');
    return [];
  }

  try {
    const storedData = getLocalStorageItem(PASSWORD_KEY);
    console.log('Raw stored data:', storedData);

    if (!storedData) {
      console.log('No password records found, initializing empty array');
      savePasswordRecords([]);
      return [];
    }

    try {
      const parsedData = JSON.parse(storedData);
      if (!Array.isArray(parsedData)) {
        console.error('Stored data is not an array, resetting');
        savePasswordRecords([]);
        return [];
      }
      return parsedData;
    } catch (parseError) {
      console.error('Error parsing stored password data:', parseError);
      savePasswordRecords([]);
      return [];
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return [];
  }
};

const savePasswordRecords = (passwordRecords: PasswordRecord[]): void => {
  if (!isLocalStorageAvailable()) {
    console.error('localStorage is not available in this environment');
    return;
  }

  try {
    const stringifiedData = JSON.stringify(passwordRecords);
    setLocalStorageItem(PASSWORD_KEY, stringifiedData);
  } catch (error) {
    console.error('Error saving password records:', error);
    throw error;
  }
};

export const hashPassword = (password: string, salt: string): string => {
  if (!password || !salt) {
    throw new Error('Password and salt are required for hashing');
  }

  console.log(`Hashing password with salt: ${salt}`);
  try {
    const hashed = SHA512(password + salt).toString();
    console.log('Generated hash:', hashed);
    return hashed;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
};

export const getPasswordIndexByID = (passwordID: string): number => {
  if (!passwordID) {
    console.warn('Invalid password ID provided');
    return -1;
  }

  console.log('Searching for password hash in records');
  const passwords = getPasswordRecords();
  const index = passwords.findIndex(record => record.id === passwordID);

  return index;
};

export const savePasswordHash = (id: string, password: string): string => {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ID provided');
  }
  if (!password || typeof password !== 'string') {
    throw new Error('Invalid password provided');
  }

  console.log('Storing password hash');
  
  let passwords = getPasswordRecords();
  if (!Array.isArray(passwords)) {
    console.log('Initializing empty password records');
    passwords = [];
  }
  // If password hash already exists, return it
  try {
    const existingIndex = passwords.findIndex(record => {
      try {
        return hashPassword(password, record.salt) === record.hash;
      } catch (error) {
        console.error('Error comparing password hash:', error);
        return false;
      }
    });

    if (existingIndex !== -1) {
      console.log('Password hash already exists in records:', passwords[existingIndex].hash);
      return passwords[existingIndex].hash;
    }

// If no existing hash, create a new password record
    const salt = lib.WordArray.random(16).toString();
    const passwordHash = hashPassword(password, salt);
    passwords.push({ id: id, hash: passwordHash, salt });

    savePasswordRecords(passwords);
    console.log('New password hash stored:', passwordHash);
    return passwordHash;
  } catch (error) {
    console.error('Error in savePasswordHash:', error);
    throw error;
  }
};

export const updatePassword = (
  passwordID: string,
  oldPassword: string,
  newPassword: string,
): string | null => {
  if (!passwordID || !oldPassword || !newPassword) {
    console.warn('Invalid parameters provided for password update');
    return null;
  }

  console.log('Updating password hash');
  const passwords = getPasswordRecords();
  const index = passwords.findIndex(record => record.id === passwordID);

  if (index === -1) {
    console.warn(`Password record with ID ${passwordID} not found.`);
    return null;
  }

  try {
    const storedPasswordRecord = passwords[index];
    const oldPasswordHash = hashPassword(oldPassword, storedPasswordRecord.salt);

    if (oldPasswordHash !== storedPasswordRecord.hash) {
      console.warn(
        'Old password does not match the current stored password hash. Operation aborted.',
      );
      return null;
    }

    const newSalt = lib.WordArray.random(16).toString();
    const newHash = hashPassword(newPassword, newSalt);
    passwords[index] = { id: passwordID, hash: newHash, salt: newSalt };

    savePasswordRecords(passwords);
    console.log('Password hash updated successfully:', newHash);

    return newHash;
  } catch (error) {
    console.error('Error updating password:', error);
    return null;
  }
};

export const removePassword = (id: string): boolean => {
  if (!id) {
    console.warn('Invalid ID provided for password removal');
    return false;
  }

  console.log(`Attempting to remove password hash: ${id}`);
  try {
    const passwords = getPasswordRecords();

    const index = passwords.findIndex(record => record.id === id);

    if (index !== -1) {
      passwords.splice(index, 1);
      savePasswordRecords(passwords);
      console.log('Password hash removed successfully.');
      return true;
    }

    console.warn('Password hash not found, removal unsuccessful');
    return false;
  } catch (error) {
    console.error('Error removing password:', error);
    return false;
  }
};
