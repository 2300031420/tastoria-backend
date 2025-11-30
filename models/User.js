import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  image: String,
  phone: String // Store before order
});

/**
 * Get User model for a specific tenant
 * @param {mongoose.Connection} connection - The tenant-specific connection
 * @returns {mongoose.Model} - The User model for the tenant
 */
export const getUserModel = (connection) => {
  if (!connection) {
    throw new Error('Connection is required for User model');
  }
  
  if (connection.models.User) {
    return connection.models.User;
  }
  
  return connection.model('User', userSchema);
};

// Default export for backward compatibility
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
