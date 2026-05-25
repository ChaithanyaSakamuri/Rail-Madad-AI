import express from 'express';
import multer from 'multer';
import Product from '../models/Product.js';
import Sales from '../models/Sales.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';

const router = express.Router();

// Multer config — store in memory, convert to base64
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// ─── GET All Products (Public) ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.occasion) filter.occasion = { $in: [req.query.occasion] };
    if (req.query.size) filter.sizes = { $in: [req.query.size] };
    if (req.query.featured) filter.isFeatured = true;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } },
      ];
    }
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      popular: { salesCount: -1 },
      rating: { rating: -1 },
    };
    const sort = sortMap[req.query.sort] || { createdAt: -1 };

    // Don't return base64 in listing (too heavy), just first image
    const products = await Product.find(filter)
      .select('-images -aiGenerated')
      .limit(limit)
      .skip(skip)
      .sort(sort);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: { total, pages: Math.ceil(total / limit), currentPage: page },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET Featured Products ─────────────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .select('-images -aiGenerated')
      .limit(8)
      .sort({ salesCount: -1 });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET Low Stock Alert (Admin) ──────────────────────────────────────────────
router.get('/alerts/low-stock', auth, adminOnly, async (req, res) => {
  try {
    const products = await Product.find({ stock: { $lt: 10 } }).select('-images');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET All Products for Admin (includes inactive) ───────────────────────────
router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.category) filter.category = req.query.category;

    const products = await Product.find(filter)
      .select('-images -aiGenerated')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);
    res.json({ products, pagination: { total, pages: Math.ceil(total / limit), currentPage: page } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET Single Product ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── CREATE Product (Admin, with image upload) ────────────────────────────────
router.post('/', auth, adminOnly, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]), async (req, res) => {
  try {
    const data = { ...req.body };

    // Parse JSON fields
    if (data.sizes && typeof data.sizes === 'string') {
      try { data.sizes = JSON.parse(data.sizes); } catch { data.sizes = []; }
    }
    if (data.colors && typeof data.colors === 'string') {
      try { data.colors = JSON.parse(data.colors); } catch { data.colors = []; }
    }
    if (data.occasion && typeof data.occasion === 'string') {
      try { data.occasion = JSON.parse(data.occasion); } catch { data.occasion = []; }
    }
    if (data.tags && typeof data.tags === 'string') {
      try { data.tags = JSON.parse(data.tags); } catch { data.tags = []; }
    }

    // Handle uploaded images
    if (req.files?.image?.[0]) {
      const buf = req.files.image[0].buffer;
      const mime = req.files.image[0].mimetype;
      data.image = `data:${mime};base64,${buf.toString('base64')}`;
    }
    if (req.files?.images) {
      data.images = req.files.images.map(f => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`);
    }

    const product = new Product(data);
    await product.save();

    // Return without heavy base64 images in response
    const { images: _imgs, ...productObj } = product.toObject();
    res.status(201).json(productObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── UPDATE Product (Admin) ───────────────────────────────────────────────────
router.put('/:id', auth, adminOnly, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]), async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: new Date() };

    // Parse JSON fields
    ['sizes', 'colors', 'occasion', 'tags'].forEach(key => {
      if (data[key] && typeof data[key] === 'string') {
        try { data[key] = JSON.parse(data[key]); } catch { /* keep as is */ }
      }
    });

    if (req.files?.image?.[0]) {
      const buf = req.files.image[0].buffer;
      const mime = req.files.image[0].mimetype;
      data.image = `data:${mime};base64,${buf.toString('base64')}`;
    }
    if (req.files?.images) {
      data.images = req.files.images.map(f => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { images: _imgs, ...productObj } = product.toObject();
    res.json(productObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE Product (Admin) ───────────────────────────────────────────────────
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── BUY Single Product ───────────────────────────────────────────────────────
router.post('/:id/buy', auth, async (req, res) => {
  try {
    const { quantity, phone, address, pincode, city, state, notes, paymentMethod, selectedSize, selectedColor, transactionId } = req.body;
    const qty = parseInt(quantity) || 1;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < qty) return res.status(400).json({ message: 'Insufficient stock' });

    product.stock -= qty;
    product.isLowStock = product.stock < 10;
    product.salesCount = (product.salesCount || 0) + qty;
    const finalUnitPrice = product.price * (1 - (product.discount || 0) / 100);
    const saleRevenue = qty * finalUnitPrice;
    product.revenue = (product.revenue || 0) + saleRevenue;
    await product.save();

    // Fetch customer name
    const userDoc = await User.findById(req.user.id);
    const customerName = userDoc ? userDoc.name : 'Customer';

    const orderId = `ELN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const sale = new Sales({
      orderId,
      product: product._id,
      productName: product.name,
      quantity: qty,
      unitPrice: product.price,
      totalAmount: qty * product.price,
      discount: product.discount || 0,
      deliveryCharge: 120,
      finalAmount: saleRevenue,
      status: 'pending',
      paymentMethod: paymentMethod || 'Credit Card',
      transactionId: transactionId || '',
      customerName,
      customerEmail: req.user.email || '',
      customerPhone: phone || '',
      shippingAddress: address || '',
      pincode: pincode || '',
      city: city || '',
      state: state || '',
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'unpaid' : (transactionId ? 'pending_verification' : 'unpaid'),
      notes: notes || '',
      selectedSize: selectedSize || '',
      selectedColor: selectedColor || '',
    });
    await sale.save();

    res.status(201).json({ message: 'Order placed successfully', sale, orderId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── CART CHECKOUT ────────────────────────────────────────────────────────────
router.post('/checkout', auth, async (req, res) => {
  try {
    const { items, phone, address, pincode, city, state, notes, paymentMethod, transactionId } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const checkedProducts = [];
    for (const item of items) {
      const { productId, quantity, selectedSize, selectedColor } = item;
      const qty = parseInt(quantity) || 1;
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${productId}` });
      if (product.stock < qty) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      checkedProducts.push({ product, qty, selectedSize, selectedColor });
    }

    // Fetch customer name
    const userDoc = await User.findById(req.user.id);
    const customerName = userDoc ? userDoc.name : 'Customer';

    const baseOrderId = `ELN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const salesCreated = [];

    for (let i = 0; i < checkedProducts.length; i++) {
      const { product, qty, selectedSize, selectedColor } = checkedProducts[i];
      product.stock -= qty;
      product.isLowStock = product.stock < 10;
      product.salesCount = (product.salesCount || 0) + qty;
      const finalUnitPrice = product.price * (1 - (product.discount || 0) / 100);
      const saleRevenue = qty * finalUnitPrice;
      product.revenue = (product.revenue || 0) + saleRevenue;
      await product.save();

      const sale = new Sales({
        orderId: checkedProducts.length > 1 ? `${baseOrderId}-${i}` : baseOrderId,
        product: product._id,
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
        totalAmount: qty * product.price,
        discount: product.discount || 0,
        deliveryCharge: i === 0 ? 120 : 0,
        finalAmount: saleRevenue,
        status: 'pending',
        paymentMethod: paymentMethod || 'Credit Card',
        transactionId: transactionId || '',
        customerName,
        customerEmail: req.user.email || '',
        customerPhone: phone || '',
        shippingAddress: address || '',
        pincode: pincode || '',
        city: city || '',
        state: state || '',
        paymentStatus: paymentMethod === 'Cash on Delivery' ? 'unpaid' : (transactionId ? 'pending_verification' : 'unpaid'),
        notes: notes || '',
        selectedSize: selectedSize || '',
        selectedColor: selectedColor || '',
      });
      await sale.save();
      salesCreated.push(sale);
    }

    res.status(201).json({ message: 'Order placed successfully', orderId: baseOrderId, sales: salesCreated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
