const Plan = require('../models/plan.model');
const SubCategory = require('../models/subCategory.model');
const SuperAdmin = require('../models/superAdmin.model');
const { PLAN_DURATIONS } = require('../models/plan.model');

/**
 * Create Plan (Super Admin only)
 */
const createPlan = async (req, res) => {
  try {
    const { subCategoryId, duration, amount, description } = req.body;
    const createdBy = req.user.userId;

    if (!subCategoryId || !duration || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Sub category ID, duration, and amount are required'
      });
    }

    // Validate duration
    if (!Object.values(PLAN_DURATIONS).includes(duration)) {
      return res.status(400).json({
        success: false,
        message: `Invalid duration. Allowed values: ${Object.values(PLAN_DURATIONS).join(', ')}`
      });
    }

    // Validate amount
    if (amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than or equal to 0'
      });
    }

    // Verify sub category exists
    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub category not found'
      });
    }

    // Check if plan with same duration already exists for this subcategory
    const existingPlan = await Plan.findOne({
      subCategory: subCategoryId,
      duration: duration
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: `Plan with duration ${duration} already exists for this sub category`
      });
    }

    // Get super admin who is creating
    const superAdmin = await SuperAdmin.findById(createdBy);
    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    // Create plan
    const plan = new Plan({
      subCategory: subCategoryId,
      duration: duration,
      amount: parseFloat(amount),
      description: description ? description.trim() : null,
      createdBy: superAdmin._id
    });

    await plan.save();
    await plan.populate('subCategory', 'name description image mainCategory');
    await plan.populate('createdBy', 'userId firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating plan',
      error: error.message
    });
  }
};

/**
 * Get All Plans (Super Admin - Protected)
 */
const getAllPlans = async (req, res) => {
  try {
    const { subCategoryId, duration, isActive } = req.query;
    const query = {};
    
    if (subCategoryId) {
      query.subCategory = subCategoryId;
    }
    
    if (duration) {
      query.duration = duration;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const plans = await Plan.find(query)
      .populate('subCategory', 'name description image mainCategory')
      .populate('createdBy', 'userId firstName lastName')
      .sort({ subCategory: 1, duration: 1 });

    res.json({
      success: true,
      message: 'Plans retrieved successfully',
      data: plans,
      count: plans.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving plans',
      error: error.message
    });
  }
};

/**
 * Get Plans by Sub Category (Super Admin - Protected)
 */
const getPlansBySubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const { isActive } = req.query;

    const query = { subCategory: subCategoryId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const plans = await Plan.find(query)
      .populate('subCategory', 'name description image mainCategory')
      .populate('createdBy', 'userId firstName lastName')
      .sort({ duration: 1 });

    res.json({
      success: true,
      message: 'Plans retrieved successfully',
      data: plans,
      count: plans.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving plans',
      error: error.message
    });
  }
};

/**
 * Get Plan by ID (Super Admin - Protected)
 */
const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id)
      .populate('subCategory', 'name description image mainCategory')
      .populate('createdBy', 'userId firstName lastName');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan retrieved successfully',
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving plan',
      error: error.message
    });
  }
};

/**
 * Update Plan (Super Admin only)
 */
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, amount, description, isActive } = req.body;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if duration is being changed and if new duration already exists for this subcategory
    if (duration && duration !== plan.duration) {
      if (!Object.values(PLAN_DURATIONS).includes(duration)) {
        return res.status(400).json({
          success: false,
          message: `Invalid duration. Allowed values: ${Object.values(PLAN_DURATIONS).join(', ')}`
        });
      }

      const existingPlan = await Plan.findOne({
        subCategory: plan.subCategory,
        duration: duration,
        _id: { $ne: id }
      });

      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: `Plan with duration ${duration} already exists for this sub category`
        });
      }

      plan.duration = duration;
    }

    if (amount !== undefined && amount !== null) {
      if (amount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than or equal to 0'
        });
      }
      plan.amount = parseFloat(amount);
    }

    if (description !== undefined) {
      plan.description = description ? description.trim() : null;
    }

    if (isActive !== undefined) {
      plan.isActive = isActive === 'true' || isActive === true;
    }

    await plan.save();
    await plan.populate('subCategory', 'name description image mainCategory');
    await plan.populate('createdBy', 'userId firstName lastName');

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating plan',
      error: error.message
    });
  }
};

/**
 * Delete Plan (Super Admin only)
 */
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    await Plan.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting plan',
      error: error.message
    });
  }
};

/**
 * Create Multiple Plans for a Sub Category (Super Admin only)
 * Creates all 4 plans (1 month, 3 months, 6 months, 1 year) at once
 */
const createMultiplePlans = async (req, res) => {
  try {
    const { subCategoryId, plans } = req.body;
    const createdBy = req.user.userId;

    if (!subCategoryId || !plans || !Array.isArray(plans)) {
      return res.status(400).json({
        success: false,
        message: 'Sub category ID and plans array are required'
      });
    }

    // Verify sub category exists
    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub category not found'
      });
    }

    // Get super admin who is creating
    const superAdmin = await SuperAdmin.findById(createdBy);
    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    const createdPlans = [];
    const errors = [];

    for (const planData of plans) {
      const { duration, amount, description } = planData;

      if (!duration || amount === undefined || amount === null) {
        errors.push(`Plan with duration ${duration || 'unknown'} is missing required fields`);
        continue;
      }

      if (!Object.values(PLAN_DURATIONS).includes(duration)) {
        errors.push(`Invalid duration: ${duration}`);
        continue;
      }

      if (amount < 0) {
        errors.push(`Amount for ${duration} must be greater than or equal to 0`);
        continue;
      }

      // Check if plan already exists
      const existingPlan = await Plan.findOne({
        subCategory: subCategoryId,
        duration: duration
      });

      if (existingPlan) {
        errors.push(`Plan with duration ${duration} already exists`);
        continue;
      }

      try {
        const plan = new Plan({
          subCategory: subCategoryId,
          duration: duration,
          amount: parseFloat(amount),
          description: description ? description.trim() : null,
          createdBy: superAdmin._id
        });

        await plan.save();
        await plan.populate('subCategory', 'name description image mainCategory');
        createdPlans.push(plan);
      } catch (error) {
        errors.push(`Error creating plan for ${duration}: ${error.message}`);
      }
    }

    if (createdPlans.length === 0 && errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create any plans',
        errors: errors
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdPlans.length} plan(s)`,
      data: createdPlans,
      errors: errors.length > 0 ? errors : undefined,
      count: createdPlans.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating plans',
      error: error.message
    });
  }
};

module.exports = {
  createPlan,
  getAllPlans,
  getPlansBySubCategory,
  getPlanById,
  updatePlan,
  deletePlan,
  createMultiplePlans
};

