const mongoose = require('mongoose');

/**
 * Hub Middleware - Handles hub-based access control and data isolation
 */

const HUB_ADMIN_ROLES = ['super_admin', 'hub_manager'];
const HUB_OPS_ROLES = ['super_admin', 'hub_manager', 'ops_coordinator'];
const ALL_MANAGEMENT_ROLES = ['super_admin', 'hub_manager', 'ops_coordinator', 'merchant'];

/**
 * Check if user can access all hubs (super_admin only)
 */
const canAccessAllHubs = (user) => {
  return user?.role === 'super_admin';
};

/**
 * Check if user has hub management role
 */
const hasHubManagementRole = (user) => {
  return HUB_ADMIN_ROLES.includes(user?.role);
};

/**
 * Check if user has hub operations role
 */
const hasHubOpsRole = (user) => {
  return HUB_OPS_ROLES.includes(user?.role);
};

/**
 * Get user's hub ID from context
 */
const getUserHubId = (user) => {
  if (!user) return null;
  
  // Super admin can see all, check if they have a specific hub filter
  if (user.role === 'super_admin') {
    return user.hub_id || null;
  }
  
  // Hub users must have hub_id
  if (user.hub_id) {
    return new mongoose.Types.ObjectId(user.hub_id);
  }
  
  return null;
};

/**
 * Build hub filter for queries based on user role
 */
const buildHubFilter = (user, additionalHubId = null) => {
  const filter = {};
  
  // If user has no hub context, deny access
  if (!user) {
    return { _id: null }; // Match nothing
  }
  
  // Super admin without specific hub can see all
  if (user.role === 'super_admin' && !user.hub_id && !additionalHubId) {
    return {}; // No filter
  }
  
  // Get hub ID to filter by
  let hubId = additionalHubId;
  
  if (!hubId) {
    if (user.role === 'super_admin' && user.hub_id) {
      hubId = new mongoose.Types.ObjectId(user.hub_id);
    } else if (user.hub_id) {
      hubId = new mongoose.Types.ObjectId(user.hub_id);
    }
  }
  
  if (hubId) {
    filter.hub_id = hubId;
  } else if (!canAccessAllHubs(user)) {
    // Non-super admins must have hub_id
    return { _id: null };
  }
  
  return filter;
};

/**
 * Assert user has hub access
 */
const assertHubAccess = (user, targetHubId) => {
  // Super admin can access any hub
  if (user.role === 'super_admin') {
    return true;
  }
  
  // Others can only access their assigned hub
  const userHubId = user.hub_id ? String(user.hub_id) : null;
  const targetHub = targetHubId ? String(targetHubId) : null;
  
  if (userHubId !== targetHub && user.role !== 'super_admin') {
    const error = new Error('Access denied to this hub');
    error.statusCode = 403;
    throw error;
  }
  
  return true;
};

/**
 * Filter hub ID from request query/body
 */
const filterHubIdFromRequest = (req, fieldName = 'hub_id') => {
  // For super admin, allow passing hub_id in request to filter
  if (req.user?.role === 'super_admin' && req.body?.[fieldName]) {
    return req.body[fieldName];
  }
  
  // Other users can only use their assigned hub
  return req.user?.hub_id || null;
};

/**
 * Middleware to enforce hub isolation on requests
 */
const enforceHubIsolation = (req, res, next) => {
  try {
    // If no user, deny
    if (!req.user) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }
    
    // Super admin can access all
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Hub users must have hub_id assigned
    if (!req.user.hub_id) {
      const error = new Error('Hub not assigned. Please contact administrator.');
      error.statusCode = 403;
      return next(error);
    }
    
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Middleware to allow only hub managers
 */
const requireHubManager = (req, res, next) => {
  if (!req.user || !HUB_ADMIN_ROLES.includes(req.user.role)) {
    const error = new Error('Hub manager access required');
    error.statusCode = 403;
    return next(error);
  }
  return next();
};

/**
 * Middleware to allow hub operations roles
 */
const requireHubOps = (req, res, next) => {
  if (!req.user || !HUB_OPS_ROLES.includes(req.user.role)) {
    const error = new Error('Hub operations access required');
    error.statusCode = 403;
    return next(error);
  }
  return next();
};

/**
 * Middleware to allow any management role
 */
const requireManagementRole = (req, res, next) => {
  if (!req.user || !ALL_MANAGEMENT_ROLES.includes(req.user.role)) {
    const error = new Error('Management access required');
    error.statusCode = 403;
    return next(error);
  }
  return next();
};

/**
 * Get hub context for aggregation pipelines
 */
const getHubAggregationContext = (user, hubIdFromQuery = null) => {
  const context = {
    userId: user?.id,
    userRole: user?.role,
    hubId: null,
    canAccessAll: canAccessAllHubs(user),
  };
  
  // Determine which hub to use
  if (hubIdFromQuery && user?.role === 'super_admin') {
    // Super admin can filter by any hub
    context.hubId = hubIdFromQuery;
  } else if (user?.hub_id) {
    // Use assigned hub
    context.hubId = user.hub_id;
  }
  
  return context;
};

/**
 * Add hub filter to common query options
 */
const addHubFilterToQuery = (query, user, additionalHubId = null) => {
  const hubFilter = buildHubFilter(user, additionalHubId);
  return { ...query, ...hubFilter };
};

module.exports = {
  HUB_ADMIN_ROLES,
  HUB_OPS_ROLES,
  ALL_MANAGEMENT_ROLES,
  canAccessAllHubs,
  hasHubManagementRole,
  hasHubOpsRole,
  getUserHubId,
  buildHubFilter,
  assertHubAccess,
  filterHubIdFromRequest,
  enforceHubIsolation,
  requireHubManager,
  requireHubOps,
  requireManagementRole,
  getHubAggregationContext,
  addHubFilterToQuery,
};
