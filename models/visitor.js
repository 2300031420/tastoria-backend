import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  count: {
    type: Number,
    required:true,
    default: 0,
  },
});

/**
 * Get Visitor model for a specific tenant
 * @param {mongoose.Connection} connection - The tenant-specific connection
 * @returns {mongoose.Model} - The Visitor model for the tenant
 */
export const getVisitorModel = (connection) => {
  if (!connection) {
    throw new Error('Connection is required for Visitor model');
  }
  
  if (connection.models.Visitor) {
    return connection.models.Visitor;
  }
  
  return connection.model('Visitor', visitorSchema);
};

// Default export for backward compatibility
const Visitor = mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);
export default Visitor;
