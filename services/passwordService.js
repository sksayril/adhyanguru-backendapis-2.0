const crypto = require('crypto-js');

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-change-this-in-production';

/**
 * Encrypt password using AES encryption
 * @param {string} password - Plain text password
 * @returns {string} Encrypted password
 */
const encryptPassword = (password) => {
  try {
    const encrypted = crypto.AES.encrypt(password, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    throw new Error('Password encryption failed');
  }
};

/**
 * Decrypt password using AES decryption
 * @param {string} encryptedPassword - Encrypted password
 * @returns {string} Decrypted password
 */
const decryptPassword = (encryptedPassword) => {
  try {
    const bytes = crypto.AES.decrypt(encryptedPassword, SECRET_KEY);
    const decrypted = bytes.toString(crypto.enc.Utf8);
    return decrypted;
  } catch (error) {
    throw new Error('Password decryption failed');
  }
};

/**
 * Compare plain password with encrypted password
 * @param {string} plainPassword - Plain text password
 * @param {string} encryptedPassword - Encrypted password
 * @returns {boolean} True if passwords match
 */
const comparePassword = (plainPassword, encryptedPassword) => {
  try {
    const decrypted = decryptPassword(encryptedPassword);
    return plainPassword === decrypted;
  } catch (error) {
    return false;
  }
};

module.exports = {
  encryptPassword,
  decryptPassword,
  comparePassword
};

