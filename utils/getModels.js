/**
 * Get tenant-aware models based on request
 * This utility function helps routes get the correct model instance for the current tenant
 */

import { getTenantDB } from './multiTenantDB.js';
import { getMenuModel } from '../models/menu.js';
import { getOrderModel } from '../models/order.js';
import { getAdminModel } from '../models/admin.js';
import { getUserModel } from '../models/User.js';
import { getVisitorModel } from '../models/visitor.js';

/**
 * Get all models for a specific tenant
 * @param {string} tenantId - The tenant ID
 * @returns {Object} - Object containing all models for the tenant
 */
export const getTenantModels = (tenantId) => {
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const connection = getTenantDB(tenantId);
  
  return {
    Menu: getMenuModel(connection),
    Order: getOrderModel(connection),
    Admin: getAdminModel(connection),
    User: getUserModel(connection),
    Visitor: getVisitorModel(connection),
    connection, // Also expose the connection in case it's needed
  };
};

/**
 * Get tenant models from request object (which should have tenantId from middleware)
 * @param {Object} req - Express request object or object with tenantId
 * @returns {Object} - Object containing all models for the tenant
 */
export const getModelsFromRequest = (req) => {
  let tenantId;
  
  if (typeof req === 'string') {
    // If req is a string, treat it as tenantId directly
    tenantId = req;
  } else if (req && req.tenantId) {
    // If req is an object with tenantId
    tenantId = req.tenantId;
  } else if (req && typeof req === 'object') {
    // Check if it's a request-like object with tenantId property
    tenantId = req.tenantId;
  } else {
    tenantId = 'tastoria'; // Default
  }
  
  return getTenantModels(tenantId);
};

