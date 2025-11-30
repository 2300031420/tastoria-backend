import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number, // Store as a number, not string like '₹50'
    required: true,
  },
  category: {
    type: String, // e.g., "Drinks", "Main Course"
  },
  imageUrl: {
   type :String,
  },
  paused: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

/**
 * Get Menu model for a specific tenant
 * @param {mongoose.Connection} connection - The tenant-specific connection
 * @returns {mongoose.Model} - The Menu model for the tenant
 */
export const getMenuModel = (connection) => {
  if (!connection) {
    throw new Error('Connection is required for Menu model');
  }
  
  // Avoid model overwrite error in development
  if (connection.models.Menu) {
    return connection.models.Menu;
  }
  
  return connection.model('Menu', menuItemSchema);
};

// Default export for backward compatibility (uses default mongoose connection)
const Menu = mongoose.models.Menu || mongoose.model('Menu', menuItemSchema);
export default Menu;
