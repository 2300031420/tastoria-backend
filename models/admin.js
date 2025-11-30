import mongoose from "mongoose"

const AdminSchema = new mongoose.Schema({
        userEmail:{
            type:String,
            required:true,
            unique:true,
        },
        password:{
            type:String,
            required:true,
        },
        cafeName: { 
            type: String, 
            required: true 
        },
});

/**
 * Get Admin model for a specific tenant
 * @param {mongoose.Connection} connection - The tenant-specific connection
 * @returns {mongoose.Model} - The Admin model for the tenant
 */
export const getAdminModel = (connection) => {
  if (!connection) {
    throw new Error('Connection is required for Admin model');
  }
  
  // Avoid model overwrite error in development
  if (connection.models.Admin) {
    return connection.models.Admin;
  }
  
  return connection.model("Admin", AdminSchema);
};

// Default export for backward compatibility (uses default mongoose connection)
const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
export default Admin;