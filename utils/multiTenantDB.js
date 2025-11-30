import mongoose from "mongoose";

const connections = {};

/**
 * Get or create a Mongoose connection for a specific tenant (café)
 * @param {string} tenantId - The tenant ID (café name, e.g., 'tastoria', 'cafehangout')
 * @returns {mongoose.Connection} - The Mongoose connection for the tenant
 */
export const getTenantDB = (tenantId) => {
  if (!tenantId) {
    throw new Error("Missing tenant ID (café name)");
  }

  // Normalize tenant ID (lowercase, remove special chars)
  const normalizedTenantId = tenantId.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Return existing connection if available
  if (connections[normalizedTenantId]) {
    return connections[normalizedTenantId];
  }

  // Create new connection
  const dbName = `${normalizedTenantId}_db`;
  const baseUri = process.env.MONGODB_URI || process.env.MONGO_URL;
  
  if (!baseUri) {
    throw new Error("MONGODB_URI or MONGO_URL environment variable is required");
  }

  // Extract base URI without database name
  const uriWithoutDb = baseUri.split('/').slice(0, -1).join('/');
  const fullUri = `${uriWithoutDb}/${dbName}`;

  console.log(`🔌 Creating new connection for tenant: ${normalizedTenantId} -> ${dbName}`);

  const conn = mongoose.createConnection(fullUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Handle connection events
  conn.on('connected', () => {
    console.log(`✅ Connected to database: ${dbName}`);
  });

  conn.on('error', (err) => {
    console.error(`❌ Database connection error for ${dbName}:`, err);
  });

  conn.on('disconnected', () => {
    console.log(`⚠️ Disconnected from database: ${dbName}`);
  });

  // Cache the connection
  connections[normalizedTenantId] = conn;
  return conn;
};

/**
 * Get all active tenant connections
 * @returns {Object} - Object mapping tenant IDs to connections
 */
export const getAllTenantConnections = () => {
  return connections;
};

/**
 * Close a specific tenant connection
 * @param {string} tenantId - The tenant ID to close
 */
export const closeTenantConnection = async (tenantId) => {
  const normalizedTenantId = tenantId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (connections[normalizedTenantId]) {
    await connections[normalizedTenantId].close();
    delete connections[normalizedTenantId];
    console.log(`🔌 Closed connection for tenant: ${normalizedTenantId}`);
  }
};

/**
 * Close all tenant connections
 */
export const closeAllTenantConnections = async () => {
  const promises = Object.keys(connections).map(async (tenantId) => {
    await connections[tenantId].close();
    delete connections[tenantId];
  });
  await Promise.all(promises);
  console.log('🔌 Closed all tenant connections');
};



