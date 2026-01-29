/**
 * User Model Mapper
 * Maps user roles to their respective models
 */

const SuperAdmin = require('../models/superAdmin.model');
const Admin = require('../models/admin.model');
const DistrictCoordinator = require('../models/districtCoordinator.model');
const Coordinator = require('../models/coordinator.model');
const FieldManager = require('../models/fieldManager.model');
const TeamLeader = require('../models/teamLeader.model');
const FieldEmployee = require('../models/fieldEmployee.model');
const { USER_ROLES } = require('./constants');

const USER_MODEL_MAP = {
  [USER_ROLES.SUPER_ADMIN]: SuperAdmin,
  [USER_ROLES.ADMIN]: Admin,
  [USER_ROLES.DISTRICT_COORDINATOR]: DistrictCoordinator,
  [USER_ROLES.COORDINATOR]: Coordinator,
  [USER_ROLES.FIELD_MANAGER]: FieldManager,
  [USER_ROLES.TEAM_LEADER]: TeamLeader,
  [USER_ROLES.FIELD_EMPLOYEE]: FieldEmployee
};

/**
 * Get model by user role
 */
const getModelByRole = (role) => {
  return USER_MODEL_MAP[role] || null;
};

/**
 * Get all models
 */
const getAllModels = () => {
  return Object.values(USER_MODEL_MAP);
};

module.exports = {
  getModelByRole,
  getAllModels,
  USER_MODEL_MAP
};

