/**
 * Commission Distribution Service
 * Handles commission calculation and distribution to the referral hierarchy
 */

const CommissionSettings = require('../models/commissionSettings.model');
const WalletTransaction = require('../models/walletTransaction.model');
const Coordinator = require('../models/coordinator.model');
const DistrictCoordinator = require('../models/districtCoordinator.model');
const TeamLeader = require('../models/teamLeader.model');
const FieldEmployee = require('../models/fieldEmployee.model');
const Student = require('../models/student.model');

/**
 * Get active commission settings
 * @returns {Promise<Object>} Commission settings
 */
const getCommissionSettings = async () => {
  const settings = await CommissionSettings.findOne({ isActive: true });
  
  if (!settings) {
    // Return default settings if none exist
    return {
      coordinatorPercentage: 40,
      districtCoordinatorPercentage: 10,
      teamLeaderPercentage: 10,
      fieldEmployeePercentage: 10
    };
  }
  
  return {
    coordinatorPercentage: settings.coordinatorPercentage,
    districtCoordinatorPercentage: settings.districtCoordinatorPercentage,
    teamLeaderPercentage: settings.teamLeaderPercentage,
    fieldEmployeePercentage: settings.fieldEmployeePercentage
  };
};

/**
 * Calculate commission amount based on percentage
 * @param {number} baseAmount - Base amount (subscription/course price)
 * @param {number} percentage - Commission percentage (0-100)
 * @returns {number} Commission amount
 */
const calculateCommission = (baseAmount, percentage) => {
  return Math.round((baseAmount * percentage) / 100 * 100) / 100; // Round to 2 decimal places
};

/**
 * Update wallet balance
 * @param {Object} userModel - Mongoose model instance
 * @param {number} amount - Amount to add (positive for credit)
 * @returns {Promise<Object>} Updated user with wallet
 */
const updateWallet = async (userModel, amount) => {
  if (!userModel.wallet) {
    userModel.wallet = {
      balance: 0,
      totalEarned: 0,
      totalWithdrawn: 0
    };
  }
  
  userModel.wallet.balance = (userModel.wallet.balance || 0) + amount;
  userModel.wallet.totalEarned = (userModel.wallet.totalEarned || 0) + amount;
  
  await userModel.save();
  return userModel;
};

/**
 * Create wallet transaction record
 * @param {Object} params - Transaction parameters
 * @returns {Promise<Object>} Created transaction
 */
const createWalletTransaction = async (params) => {
  const {
    user,
    userModel,
    type,
    amount,
    balanceAfter,
    relatedTransaction,
    commissionDetails,
    description,
    status = 'COMPLETED'
  } = params;
  
  const transaction = new WalletTransaction({
    user: user._id || user,
    userModel,
    type,
    amount,
    balanceAfter,
    relatedTransaction,
    commissionDetails,
    description,
    status
  });
  
  await transaction.save();
  return transaction;
};

/**
 * Distribute commissions for a subscription or course purchase
 * @param {Object} student - Student who made the purchase
 * @param {number} amount - Purchase amount
 * @param {string} transactionType - 'SUBSCRIPTION' or 'COURSE_PURCHASE'
 * @param {ObjectId} transactionId - ID of the subscription or course purchase
 * @returns {Promise<Object>} Distribution results
 */
const distributeCommissions = async (student, amount, transactionType, transactionId) => {
  try {
    // Get commission settings
    const settings = await getCommissionSettings();
    
    // Get student with referral hierarchy populated
    const studentWithHierarchy = await Student.findById(student._id || student)
      .populate('referralHierarchy.referringFieldEmployee')
      .populate('referralHierarchy.teamLeader')
      .populate('referralHierarchy.districtCoordinator')
      .populate('referralHierarchy.coordinator')
      .populate('referralHierarchy.admin');
    
    if (!studentWithHierarchy || !studentWithHierarchy.referralHierarchy) {
      return {
        success: false,
        message: 'Student referral hierarchy not found',
        distributions: []
      };
    }
    
    const hierarchy = studentWithHierarchy.referralHierarchy;
    const distributions = [];
    
    // Only distribute if there's a referring Field Employee
    if (!hierarchy.referringFieldEmployee) {
      return {
        success: true,
        message: 'No referral hierarchy found, no commissions to distribute',
        distributions: []
      };
    }
    
    // Get the Field Employee
    const fieldEmployee = await FieldEmployee.findById(hierarchy.referringFieldEmployee);
    if (!fieldEmployee || !fieldEmployee.isActive) {
      return {
        success: false,
        message: 'Referring Field Employee not found or inactive',
        distributions: []
      };
    }
    
    // Calculate and distribute Field Employee commission
    const feCommission = calculateCommission(amount, settings.fieldEmployeePercentage);
    if (feCommission > 0) {
      await updateWallet(fieldEmployee, feCommission);
      const feBalance = fieldEmployee.wallet.balance;
      
      await createWalletTransaction({
        user: fieldEmployee._id,
        userModel: 'FieldEmployee',
        type: 'COMMISSION',
        amount: feCommission,
        balanceAfter: feBalance,
        relatedTransaction: {
          type: transactionType,
          transactionId,
          student: studentWithHierarchy._id,
          amount
        },
        commissionDetails: {
          percentage: settings.fieldEmployeePercentage,
          baseAmount: amount
        },
        description: `Commission from ${transactionType.toLowerCase()} - ${feCommission} (${settings.fieldEmployeePercentage}%)`
      });
      
      distributions.push({
        user: fieldEmployee.userId,
        role: 'FieldEmployee',
        amount: feCommission,
        percentage: settings.fieldEmployeePercentage
      });
    }
    
    // Get Team Leader if exists
    if (hierarchy.teamLeader) {
      const teamLeader = await TeamLeader.findById(hierarchy.teamLeader);
      if (teamLeader && teamLeader.isActive) {
        const tlCommission = calculateCommission(amount, settings.teamLeaderPercentage);
        if (tlCommission > 0) {
          await updateWallet(teamLeader, tlCommission);
          const tlBalance = teamLeader.wallet.balance;
          
          await createWalletTransaction({
            user: teamLeader._id,
            userModel: 'TeamLeader',
            type: 'COMMISSION',
            amount: tlCommission,
            balanceAfter: tlBalance,
            relatedTransaction: {
              type: transactionType,
              transactionId,
              student: studentWithHierarchy._id,
              amount
            },
            commissionDetails: {
              percentage: settings.teamLeaderPercentage,
              baseAmount: amount
            },
            description: `Commission from ${transactionType.toLowerCase()} - ${tlCommission} (${settings.teamLeaderPercentage}%)`
          });
          
          distributions.push({
            user: teamLeader.userId,
            role: 'TeamLeader',
            amount: tlCommission,
            percentage: settings.teamLeaderPercentage
          });
        }
      }
    }
    
    // Get District Coordinator if exists
    if (hierarchy.districtCoordinator) {
      const districtCoordinator = await DistrictCoordinator.findById(hierarchy.districtCoordinator);
      if (districtCoordinator && districtCoordinator.isActive) {
        const dcCommission = calculateCommission(amount, settings.districtCoordinatorPercentage);
        if (dcCommission > 0) {
          await updateWallet(districtCoordinator, dcCommission);
          const dcBalance = districtCoordinator.wallet.balance;
          
          await createWalletTransaction({
            user: districtCoordinator._id,
            userModel: 'DistrictCoordinator',
            type: 'COMMISSION',
            amount: dcCommission,
            balanceAfter: dcBalance,
            relatedTransaction: {
              type: transactionType,
              transactionId,
              student: studentWithHierarchy._id,
              amount
            },
            commissionDetails: {
              percentage: settings.districtCoordinatorPercentage,
              baseAmount: amount
            },
            description: `Commission from ${transactionType.toLowerCase()} - ${dcCommission} (${settings.districtCoordinatorPercentage}%)`
          });
          
          distributions.push({
            user: districtCoordinator.userId,
            role: 'DistrictCoordinator',
            amount: dcCommission,
            percentage: settings.districtCoordinatorPercentage
          });
        }
      }
    }
    
    // Get Coordinator if exists
    if (hierarchy.coordinator) {
      const coordinator = await Coordinator.findById(hierarchy.coordinator);
      if (coordinator && coordinator.isActive) {
        const coordCommission = calculateCommission(amount, settings.coordinatorPercentage);
        if (coordCommission > 0) {
          await updateWallet(coordinator, coordCommission);
          const coordBalance = coordinator.wallet.balance;
          
          await createWalletTransaction({
            user: coordinator._id,
            userModel: 'Coordinator',
            type: 'COMMISSION',
            amount: coordCommission,
            balanceAfter: coordBalance,
            relatedTransaction: {
              type: transactionType,
              transactionId,
              student: studentWithHierarchy._id,
              amount
            },
            commissionDetails: {
              percentage: settings.coordinatorPercentage,
              baseAmount: amount
            },
            description: `Commission from ${transactionType.toLowerCase()} - ${coordCommission} (${settings.coordinatorPercentage}%)`
          });
          
          distributions.push({
            user: coordinator.userId,
            role: 'Coordinator',
            amount: coordCommission,
            percentage: settings.coordinatorPercentage
          });
        }
      }
    }
    
    return {
      success: true,
      message: 'Commissions distributed successfully',
      distributions,
      totalDistributed: distributions.reduce((sum, d) => sum + d.amount, 0)
    };
  } catch (error) {
    console.error('Error distributing commissions:', error);
    return {
      success: false,
      message: `Error distributing commissions: ${error.message}`,
      distributions: []
    };
  }
};

module.exports = {
  getCommissionSettings,
  calculateCommission,
  updateWallet,
  createWalletTransaction,
  distributeCommissions
};
