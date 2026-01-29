/**
 * Referral Code Generation Service
 * Generates unique referral codes for Field Employees
 */

const FieldEmployee = require('../models/fieldEmployee.model');

/**
 * Generate a unique referral code
 * Format: FE + 6 random alphanumeric characters (e.g., FE1A2B3C)
 * @returns {Promise<string>} Unique referral code
 */
const generateReferralCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referralCode;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 6 random characters
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    referralCode = `FE${randomPart}`;
    
    // Check if code already exists
    const existing = await FieldEmployee.findOne({ referralCode });
    if (!existing) {
      isUnique = true;
    }
    
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique referral code after multiple attempts');
  }

  return referralCode;
};

/**
 * Validate referral code format
 * @param {string} code - Referral code to validate
 * @returns {boolean} True if valid format
 */
const isValidReferralCodeFormat = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  // Format: FE followed by 6 alphanumeric characters
  const regex = /^FE[A-Z0-9]{6}$/;
  return regex.test(code.toUpperCase());
};

module.exports = {
  generateReferralCode,
  isValidReferralCodeFormat
};
