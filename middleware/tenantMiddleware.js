/**
 * Middleware to extract tenant ID from request
 * Supports multiple methods:
 * 1. Subdomain (e.g., tastoria.tastoria.in)
 * 2. X-Tenant-ID header
 * 3. Query parameter (cafe)
 * 4. Admin's cafeName from JWT (if authenticated)
 */

export const extractTenantId = (req, res, next) => {
  let tenantId = null;

  // Method 1: Check X-Tenant-ID header (highest priority)
  if (req.headers['x-tenant-id']) {
    tenantId = req.headers['x-tenant-id'];
  }
  // Method 2: Extract from subdomain
  else if (req.headers.host) {
    const host = req.headers.host;
    const subdomain = host.split('.')[0];
    
    // Only use subdomain if it's a valid tenant name (not 'www', 'api', etc.)
    const excludedSubdomains = ['www', 'api', 'admin', 'app', 'localhost'];
    if (!excludedSubdomains.includes(subdomain.toLowerCase()) && subdomain !== '127.0.0.1') {
      tenantId = subdomain;
    }
  }
  
  // Method 3: Check query parameter
  if (!tenantId && req.query.cafe) {
    tenantId = req.query.cafe;
  }
  
  // Method 4: Use admin's cafeName if authenticated (for admin routes)
  if (!tenantId && req.admin?.cafeName) {
    tenantId = req.admin.cafeName;
  }

  // Normalize tenant ID
  if (tenantId) {
    tenantId = tenantId.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Validate tenant ID (only allow alphanumeric, min 2 chars)
    if (tenantId.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid tenant ID' 
      });
    }
  } else {
    // Default to 'tastoria' if no tenant ID found (for backward compatibility)
    tenantId = 'tastoria';
  }

  // Attach tenant ID to request
  req.tenantId = tenantId;
  next();
};

/**
 * Middleware that requires tenant ID (returns 400 if missing)
 */
export const requireTenantId = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Tenant ID is required. Provide via subdomain, X-Tenant-ID header, or cafe query parameter.' 
    });
  }
  next();
};



