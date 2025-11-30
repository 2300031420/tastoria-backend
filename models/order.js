import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  tableId: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  userEmail: {
    type: String,
    required: false
  },
  items: [
    {
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: String,
        required: true,
      },
    },
  ],

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  source: {
    type: String,
    enum: ['website', 'whatsapp'],
    default: 'website'
  },
  total: {
    type: Number,
    required: true,
  },
  orderTime: {
    type: Date,
    default: Date.now,
  },
},{timestamps:true});

/**
 * Get Order model for a specific tenant
 * @param {mongoose.Connection} connection - The tenant-specific connection
 * @returns {mongoose.Model} - The Order model for the tenant
 */
export const getOrderModel = (connection) => {
  if (!connection) {
    throw new Error('Connection is required for Order model');
  }
  
  // Avoid model overwrite error in development
  if (connection.models.Order) {
    return connection.models.Order;
  }
  
  return connection.model('Order', orderSchema);
};

// Default export for backward compatibility (uses default mongoose connection)
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
