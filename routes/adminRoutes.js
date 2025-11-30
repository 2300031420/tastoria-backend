  import express from 'express';
  import { getModelsFromRequest } from '../utils/getModels.js';
  import { send } from '../utils/send.js';
  import { verifyAdmin } from '../middleware/adminMiddle.js';
  const router = express.Router();

router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    // Use tenantId from admin's cafeName or from request
    const tenantId = req.admin?.cafeName || req.tenantId || 'tastoria';
    const { Order, User, Visitor } = getModelsFromRequest({ tenantId });

    const orders = await Order.find({});
    const users = await User.find({});
    const visitorData = await Visitor.findOne({});

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const revenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const activeUsers = users.length;
    const visitorCount = visitorData?.count || 0;

    res.json({
      cafeName: tenantId,
      totalOrders,
      pendingOrders,
      revenue,
      activeUsers,
      visitorCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch stats", error: error.message });
  }
});

router.patch("/orders/:id/confirm", verifyAdmin, async (req, res) => {
  try {
    const tenantId = req.admin?.cafeName || req.tenantId || 'tastoria';
    const { Order } = getModelsFromRequest({ tenantId });

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id },
      { status: "confirmed" },
      { new: true }
    );

    if (!order)
      return res
        .status(404)
        .json({ message: "Order not found or not in your cafe" });

    await send(
      order.phoneNumber,
      `✅ *Your order from ${tenantId} has been confirmed!* 🍽️`
    );

    res.json({ message: "Order confirmed", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to confirm order", error: error.message });
  }
});

  export default router;
