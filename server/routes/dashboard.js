import express from 'express';
import Product from '../models/Product.js';
import Sales from '../models/Sales.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Helper to get base order ID for multi-item checkouts
const getBaseOrderId = (orderId) => {
  if (!orderId) return '';
  const parts = orderId.split('-');
  // If it has 4 parts (e.g. ORD-timestamp-random-index), it is a multi-item order, strip the index
  if (parts.length === 4) {
    return parts.slice(0, 3).join('-');
  }
  return orderId;
};

const FALLBACK_IMAGES = {
  'laptop pro': 'https://images.unsplash.com/photo-1496181130204-755241544e35?w=600&q=80',
  'wireless headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  'usb-c cable': 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80',
  'mechanical keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
  'external ssd': 'https://images.unsplash.com/photo-1597872200370-c53ece27e26c?w=600&q=80',
  'monitor 4k': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
  'mouse pad': 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&q=80',
  'webcam hd': 'https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=600&q=80',
  'elegant floral cotton kurti': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
  'premium silk cord-set': 'https://images.unsplash.com/photo-1608748010899-18f300247112?w=600&q=80',
  'embroidered three-piece partywear set': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
  'classic cotton straight pants': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
  'super soft cotton leggings': 'https://images.unsplash.com/photo-1548624149-f7b31668831a?w=600&q=80',
  'oxidized silver jhumka earrings': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80'
};

// Helper to group Sales documents by their base order ID
const groupSales = (sales) => {
  const groupedMap = new Map();

  for (const sale of sales) {
    const orderId = sale.orderId;
    const baseId = getBaseOrderId(orderId);

    if (!groupedMap.has(baseId)) {
      groupedMap.set(baseId, {
        orderId: baseId,
        customerName: sale.customerName || '',
        customerEmail: sale.customerEmail || '',
        customerPhone: sale.customerPhone || '',
        shippingAddress: sale.shippingAddress || '',
        pincode: sale.pincode || '',
        city: sale.city || '',
        state: sale.state || '',
        notes: sale.notes || '',
        paymentMethod: sale.paymentMethod || 'Credit Card',
        paymentStatus: sale.paymentStatus || 'unpaid',
        transactionId: sale.transactionId || '',
        trackingId: sale.trackingId || '',
        courierPartner: sale.courierPartner || 'None',
        dispatchDate: sale.dispatchDate || null,
        estimatedDeliveryDate: sale.estimatedDeliveryDate || null,
        adminNotes: sale.adminNotes || '',
        deliveryCharge: 0,
        status: sale.status || 'pending',
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
        items: [],
        totalAmount: 0,
        quantity: 0
      });
    }

    const group = groupedMap.get(baseId);
    
    const getProductImage = (s) => {
      if (s.product && s.product.image) return s.product.image;
      const key = (s.productName || '').trim().toLowerCase();
      return FALLBACK_IMAGES[key] || '';
    };

    group.items.push({
      _id: sale._id,
      originalOrderId: sale.orderId,
      product: sale.product,
      productName: sale.productName,
      image: getProductImage(sale),
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      discount: sale.discount || 0,
      finalAmount: sale.finalAmount
    });

    group.deliveryCharge += sale.deliveryCharge || 0;
    group.totalAmount += sale.finalAmount || 0;
    group.quantity += sale.quantity || 0;
    group.status = sale.status || group.status;
    group.transactionId = sale.transactionId || group.transactionId || '';
    group.trackingId = sale.trackingId || group.trackingId || '';
    group.courierPartner = sale.courierPartner || group.courierPartner || 'None';
    group.dispatchDate = sale.dispatchDate || group.dispatchDate || null;
    group.estimatedDeliveryDate = sale.estimatedDeliveryDate || group.estimatedDeliveryDate || null;
    group.paymentStatus = sale.paymentStatus || group.paymentStatus || 'unpaid';
    group.adminNotes = sale.adminNotes || group.adminNotes || '';
  }

  for (const group of groupedMap.values()) {
    group.totalAmount += group.deliveryCharge;
  }

  return Array.from(groupedMap.values());
};


// Get analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Fetch all sales populated with products (so we can do grouped analysis)
    const sales = await Sales.find()
      .populate('product', 'name image stock price category')
      .sort({ createdAt: -1 });

    const grouped = groupSales(sales);

    // Calculate revenue stats
    let totalRevenue = 0;
    let todayRevenue = 0;
    let weeklyRevenue = 0; // last 7 days
    let monthlyRevenueTotal = 0; // last 30 days
    let todaySales = 0;

    const now = new Date();
    const todayStr = now.toDateString();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    for (const order of grouped) {
      totalRevenue += order.totalAmount;
      const orderDate = new Date(order.createdAt);
      
      if (orderDate.toDateString() === todayStr) {
        todaySales++;
        todayRevenue += order.totalAmount;
      }
      if (orderDate >= sevenDaysAgo) {
        weeklyRevenue += order.totalAmount;
      }
      if (orderDate >= thirtyDaysAgo) {
        monthlyRevenueTotal += order.totalAmount;
      }
    }

    // Weekly Orders Graph (counts per day over last 7 days)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({ label, orders: 0, dateString: d.toDateString() });
    }
    for (const order of grouped) {
      const orderDateStr = new Date(order.createdAt).toDateString();
      const match = days.find(day => day.dateString === orderDateStr);
      if (match) match.orders++;
    }

    // Monthly Revenue Graph (revenue per month in current year)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRev = months.map(m => ({ label: m, revenue: 0 }));
    for (const order of grouped) {
      const d = new Date(order.createdAt);
      if (d.getFullYear() === now.getFullYear()) {
        const mIdx = d.getMonth();
        monthlyRev[mIdx].revenue += order.totalAmount;
      }
    }

    // Low stock products alert
    const lowStockProducts = await Product.find({ isActive: true, stock: { $lt: 10 } })
      .select('name stock price category image')
      .limit(10);

    res.json({
      totalProducts,
      totalSales: grouped.length,
      totalRevenue,
      totalCustomers,
      todaySales,
      todayRevenue,
      weeklyRevenue,
      monthlyRevenueTotal,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      recentOrders: grouped.slice(0, 10),
      countsByStatus: {
        pending: grouped.filter(o => o.status === 'pending').length,
        confirmed: grouped.filter(o => o.status === 'confirmed').length,
        packing: grouped.filter(o => o.status === 'packing').length,
        packed: grouped.filter(o => o.status === 'packed').length,
        ready_to_ship: grouped.filter(o => o.status === 'ready_to_ship').length,
        shipped: grouped.filter(o => o.status === 'shipped').length,
        out_for_delivery: grouped.filter(o => o.status === 'out_for_delivery').length,
        delivered: grouped.filter(o => o.status === 'delivered').length,
        cancelled: grouped.filter(o => o.status === 'cancelled').length,
        returned: grouped.filter(o => o.status === 'returned').length,
      },
      weeklyOrders: days.map(d => ({ label: d.label, orders: d.orders })),
      monthlyRevenue: monthlyRev,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get top products
router.get('/top-products', auth, async (req, res) => {
  try {
    const topProducts = await Product.find()
      .sort({ salesCount: -1 })
      .limit(5);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get revenue data
router.get('/revenue', auth, async (req, res) => {
  try {
    const revenueData = await Sales.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$finalAmount' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    res.json(revenueData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get logged-in user's orders (Grouped by master transaction ID)
router.get('/my-orders', auth, async (req, res) => {
  try {
    const sales = await Sales.find({ customerEmail: req.user.email })
      .populate('product', 'name image')
      .sort({ createdAt: -1 });
    res.json(groupSales(sales));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get logged-in user's stats (Using grouped orders count)
router.get('/my-stats', auth, async (req, res) => {
  try {
    const email = req.user.email;
    const sales = await Sales.find({ customerEmail: email });

    const totalSpent = sales.reduce((sum, sale) => sum + (sale.finalAmount || 0), 0);
    const groupedOrders = groupSales(sales);
    const ordersCount = groupedOrders.length;

    // Unique products bought
    const uniqueProductIds = new Set(sales.map(s => s.product?.toString()).filter(Boolean));
    const itemsBought = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);

    res.json({
      totalSpent,
      ordersCount,
      uniqueProductsBought: uniqueProductIds.size,
      itemsBought,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all orders grouped by master transaction ID
router.get('/admin/orders', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const sales = await Sales.find()
      .populate('product', 'name image')
      .sort({ createdAt: -1 });
    res.json(groupSales(sales));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update order status for a grouped order
// Admin: Update status of all items in an order
router.put('/admin/orders/:orderId/status', auth, async (req, res) => {
  try {
    const { status, trackingId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const orderId = req.params.orderId;
    const updateObj = { status, updatedAt: new Date() };
    if (trackingId !== undefined) {
      updateObj.trackingId = trackingId;
    }

    // Update all sales that match orderId exactly or share the same baseOrderId (starts with baseOrderId-)
    const result = await Sales.updateMany(
      {
        $or: [
          { orderId: orderId },
          { orderId: { $regex: `^${orderId}-` } }
        ]
      },
      {
        $set: updateObj
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'No orders found matching the provided reference' });
    }

    res.json({
      message: `Order status updated to ${status} successfully`,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
