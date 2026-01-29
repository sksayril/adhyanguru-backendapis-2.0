/**
 * User ID Generation Service
 * Generates unique user IDs based on user type
 */

const { USER_ROLES } = require('../utils/constants');

const USER_TYPE_PREFIXES = {
  [USER_ROLES.SUPER_ADMIN]: 'ADGUSUP',
  [USER_ROLES.ADMIN]: 'ADGUADM',
  [USER_ROLES.DISTRICT_COORDINATOR]: 'ADGUDC',
  [USER_ROLES.COORDINATOR]: 'ADGUCO',
  [USER_ROLES.FIELD_MANAGER]: 'ADGUFM',
  [USER_ROLES.TEAM_LEADER]: 'ADGUTL',
  [USER_ROLES.FIELD_EMPLOYEE]: 'ADGUF',
  [USER_ROLES.STUDENT]: 'ADGUSTU'
};

/**
 * Generate user ID based on user type
 * @param {string} userType - Type of user
 * @param {number} sequenceNumber - Sequence number for the user
 * @returns {string} Generated user ID
 */
const generateUserId = (userType, sequenceNumber) => {
  const prefix = USER_TYPE_PREFIXES[userType];
  if (!prefix) {
    throw new Error(`Invalid user type: ${userType}`);
  }
  
  // Format: PREFIX + 2-digit sequence number (e.g., ADGUSUP01, ADGUSTU01)
  const sequence = String(sequenceNumber).padStart(2, '0');
  return `${prefix}${sequence}`;
};

/**
 * Get next sequence number for a user type
 * This should be called after counting existing users of that type
 * @param {number} currentCount - Current count of users of this type
 * @returns {number} Next sequence number
 */
const getNextSequenceNumber = (currentCount) => {
  return currentCount + 1;
};

module.exports = {
  generateUserId,
  getNextSequenceNumber,
  USER_TYPE_PREFIXES
};

