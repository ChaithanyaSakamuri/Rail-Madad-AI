import express from 'express';
import Sales from '../models/Sales.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';

const router = express.Router();

// ─── Get Customer's Own Orders ─────────────────────────────────────────────────
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Sales.find({ customerEmail: req.user.email })
      .populate('product', 'name image category')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Get All Orders (Admin) ────────────────────────────────────────────────────
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { orderId: { $regex: req.query.search, $options: 'i' } },
        { customerEmail: { $regex: req.query.search, $options: 'i' } },
        { productName: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const orders = await Sales.find(filter)
      .populate('product', 'name image category')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Sales.countDocuments(filter);
    res.json({ orders, pagination: { total, pages: Math.ceil(total / limit), currentPage: page } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper to get base order ID for multi-item checkouts
const getBaseOrderId = (orderId) => {
  if (!orderId) return '';
  const parts = orderId.split('-');
  if (parts.length === 4) {
    return parts.slice(0, 3).join('-');
  }
  return orderId;
};

// ─── Update Order Status (Admin) ──────────────────────────────────────────────
router.put('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status, trackingId, courierPartner, dispatchDate, estimatedDeliveryDate, paymentStatus, adminNotes } = req.body;
    const targetSale = await Sales.findById(req.params.id);
    if (!targetSale) return res.status(404).json({ message: 'Order not found' });

    const baseId = getBaseOrderId(targetSale.orderId);
    
    const updateObj = { updatedAt: new Date() };
    if (status !== undefined) updateObj.status = status;
    if (trackingId !== undefined) updateObj.trackingId = trackingId;
    if (courierPartner !== undefined) updateObj.courierPartner = courierPartner;
    if (dispatchDate !== undefined) updateObj.dispatchDate = dispatchDate;
    if (estimatedDeliveryDate !== undefined) updateObj.estimatedDeliveryDate = estimatedDeliveryDate;
    if (paymentStatus !== undefined) updateObj.paymentStatus = paymentStatus;
    if (adminNotes !== undefined) updateObj.adminNotes = adminNotes;

    // Update all matching sales in the order group
    await Sales.updateMany(
      {
        $or: [
          { orderId: baseId },
          { orderId: { $regex: `^${baseId}-` } }
        ]
      },
      { $set: updateObj }
    );

    // Return the updated target sale record
    const updatedOrder = await Sales.findById(req.params.id).populate('product', 'name image');
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
