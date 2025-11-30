import express from 'express';
import { getModelsFromRequest } from '../utils/getModels.js';
import { updateOrderStatus, getOrderById, getOrderByTableId ,getRecentOrders,getAllOrders,getPopularItems } from '../controller/orderController.js';
import { sendOrderConfirmation, sendOrderCancellation } from '../utils/mailer.js';
import { send } from '../utils/send.js'; // ✅ Import WhatsApp utility


const router = express.Router();

// ✅ Place an Order
router.post('/place', async (req, res) => {
  try {
    const {
      tableId,
      customerName,
      phoneNumber,
      userEmail,
      items,
      total,
      orderTime,
      source = 'website', // Default to 'website' if not provided
    } = req.body;

    const { Order } = getModelsFromRequest(req);

    const order = new Order({
      tableId,
      customerName,
      phoneNumber,
      userEmail,
      items,
      total,
      orderTime,
      source,
    });

    await order.save();

    const io = req.app.get('io');
    io.emit('new-order', order); // Notify frontend via socket

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("Order placement failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Get all orders (admin) - automatically filtered by tenant DB
router.get('/all', async (req, res) => {
  try {
    const { Order } = getModelsFromRequest(req);
    const orders = await Order.find({}).sort({ orderTime: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Get orders by user email (automatically filtered by tenant DB)
router.get('/user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const { Order } = getModelsFromRequest(req);
    const orders = await Order.find({ userEmail: email }).sort({ orderTime: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Get order by ID or table

router.get('/table/:tableId', getOrderByTableId);
router.get('/recent', getRecentOrders); 
router.get('/all', getAllOrders);
router.get("/most-sold",getPopularItems);
router.get('/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);
// ✅ Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const io = req.app.get('io');
    const { Order } = getModelsFromRequest(req);
    const tenantId = req.tenantId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    io.emit('order-updated', updatedOrder); // Notify frontend

    // 📧 Email Flow (for website orders)
    if (updatedOrder.source === 'website' && updatedOrder.userEmail) {
      try {
        if (status === 'confirmed') {
          await sendOrderConfirmation(updatedOrder);
        } else if (status === 'cancelled') {
          await sendOrderCancellation(updatedOrder);
        }
      } catch (emailErr) {
        console.error("Email error:", emailErr.message);
      }
    }

    // 📲 WhatsApp Flow (for WhatsApp orders)
    if (updatedOrder.source === 'whatsapp' && updatedOrder.phoneNumber) {
      let message = '';
      const cafeDisplayName = tenantId === 'tastoria' ? 'Tastoria' : tenantId.charAt(0).toUpperCase() + tenantId.slice(1);
      if (status === 'confirmed') {
        message = `✅ *Your order has been confirmed!* 🍽️\nThank you for ordering from ${cafeDisplayName}. After payment order will be completed.`;
      } else if (status === 'cancelled') {
        message = `❌ *Your order was cancelled.*\nIf this was a mistake or item is unavailable, please contact the staff.`;
      } else if (status === 'completed') {
        message = `🎉 *Your order is completed!* Thank you for dining with ${cafeDisplayName}.`;
      }

      if (message) {
        try {
          await send(updatedOrder.phoneNumber, message);
          console.log(`WhatsApp message sent to ${updatedOrder.phoneNumber}`);
        } catch (waErr) {
          console.error("WhatsApp message error:", waErr.message);
        }
      }
    }

    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Failed to update order:", error.message);
    res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
});

// ✅ Update order fields
router.put('/update/:id', async (req, res) => {
  try {
    const { Order } = getModelsFromRequest(req);
    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, order: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ✅ Get all orders (duplicate fallback route) - automatically filtered by tenant DB
router.get('/', async (req, res) => {
  try {
    const { Order } = getModelsFromRequest(req);
    const orders = await Order.find({}).sort({ orderTime: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Delete order
router.delete('/delete/:id', async (req, res) => {
  try {
    const { Order } = getModelsFromRequest(req);
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
