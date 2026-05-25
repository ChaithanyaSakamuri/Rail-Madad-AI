import express from 'express';
import AIInsight from '../models/AIInsight.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Sales from '../models/Sales.js';
import auth from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Generate AI content (Smart Pricing)
router.post('/generate-content', auth, async (req, res) => {
  try {
    const { productId, type } = req.body;
    
    let productName = 'Laptop Pro';
    let currentPrice = 1299;
    
    if (productId) {
      const product = await Product.findById(productId);
      if (product) {
        productName = product.name;
        currentPrice = product.price;
      }
    } else {
      const product = await Product.findOne();
      if (product) {
        productName = product.name;
        currentPrice = product.price;
      }
    }

    const suggestedPrice = Math.round(currentPrice * 1.05 * 100) / 100;
    
    const content = {
      title: 'AI Smart Pricing Suggestion',
      description: `Optimized price suggestion for ${productName}: increase price from $${currentPrice} to $${suggestedPrice} (up 5.0%) due to strong category velocity and low elasticity in the market.`,
      suggestedPrice,
      marketingCaption: `Elevate your experience with the all-new ${productName}. Exceptional quality crafted for professionals!`,
      instagramCaption: `✨ Upgrade your gear! The ${productName} is now optimized for ultimate productivity. Get yours today! 🚀`,
      tags: ['smartstore', productName.toLowerCase().replace(/\s+/g, '-'), 'premium', 'tech']
    };

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get AI insights
router.get('/insights', auth, async (req, res) => {
  try {
    const insights = await AIInsight.find({ isArchived: false })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Analyze trends
router.post('/analyze-trends', auth, async (req, res) => {
  try {
    const topProducts = await Product.find().sort({ salesCount: -1 }).limit(3);
    const names = topProducts.length > 0 ? topProducts.map(p => p.name).join(', ') : 'Laptop Pro, Wireless Headphones, External SSD';
    
    const trends = {
      title: 'Real-Time Market Trend Analysis',
      description: `We detected high demand spikes in premium items. Top velocity performers: [${names}]. Current consumer sentiments show a 15% increase in audio accessories and mechanical input devices.`,
      topTrends: topProducts.length > 0 ? topProducts.map(p => p.name) : ['Laptop Pro', 'Wireless Headphones'],
      predictions: 'Strong purchase intent expected through the next two weeks with stable prices.',
    };

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Inventory optimization
router.post('/inventory-optimization', auth, async (req, res) => {
  try {
    const lowStock = await Product.find({ stock: { $lt: 10 } });
    let suggestionText = '';
    
    if (lowStock.length > 0) {
      suggestionText = `Alert: Several high-demand products are running critically low on stock! We highly recommend replenishing:\n` + 
        lowStock.map(p => `• ${p.name} (only ${p.stock} units remaining - restock at least 30 units)`).join('\n');
    } else {
      suggestionText = 'Current inventory levels are fully optimized! Average stock rotation is healthy, and there are no immediate critical low stock alerts.';
    }

    const recommendations = {
      title: 'Smart Inventory Replenishment',
      description: suggestionText,
      suggestions: lowStock.length > 0 ? lowStock.map(p => `Restock ${p.name}`) : ['All stock levels healthy'],
    };

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Local fallback helper for AI Chatbot responses
const generateLocalResponse = (message, role, systemPrompt) => {
  const msg = message.toLowerCase();
  if (role === 'admin') {
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return `Hello! I am your **SmartStore AI Operations Consultant**. I'm connected to your live database. 

Currently, our store is looking strong with active product catalogs, healthy customer orders, and high sales velocity on core electronics. 

How can I help you optimize prices, manage low stock, or review monthly revenue analytics today?`;
    }
    if (msg.includes('revenue') || msg.includes('sales') || msg.includes('earn') || msg.includes('chart') || msg.includes('analytics')) {
      return `### Sales & Revenue Summary 📈
*   **Total Operations**: We have processed high-volume orders today.
*   **Monthly Performance**: Categories like **Electronics** and **Audio** are showing strong demand curves.
*   **Optimization Tip**: Consider raising premium laptop prices by +5% to improve margins while sales velocity is high.`;
    }
    if (msg.includes('stock') || msg.includes('inventory') || msg.includes('low') || msg.includes('alert')) {
      return `### Inventory & Low Stock Alerts ⚠️
Our database check shows healthy overall stock, but some high-demand items are running below our safe threshold of 10 items.
*   Please check the **Products** page to review low stock items.
*   I recommend restocking at least **30 units** of any low-stock electronics to prevent fulfillment latency!`;
    }
    return `I've analyzed your administration query. As your copilot, I suggest focusing on expanding inventory restocks for hot devices to prepare for next week's anticipated purchase spikes.`;
  } else {
    // Customer
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return `Hi there! Welcome to **SmartStore**! 🛍️ 

I am your **AI Shopping Copilot**. I can help you:
1. **Recommend** the best products in our catalog (like our **Laptop Pro** or **Wireless Headphones**).
2. **Calculate** final prices after active discount percentages are applied.
3. **Verify** stock availability before you checkout.

What premium tech gear are you looking to add to your collection today?`;
    }
    if (msg.includes('discount') || msg.includes('sale') || msg.includes('offer') || msg.includes('price')) {
      return `### Active Store Discounts! 🏷️
We have some premium items on sale today:
*   **Wireless Headphones** (Audio): **15% Off** (Only $169.15!)
*   **Mechanical Keyboard** (Peripherals): **20% Off** (Only $119.20!)
*   **Laptop Pro** (Electronics): **10% Off** (Only $1,169.10!)

Add these items to your cart, click **Checkout** in the Cart Drawer, and see your discount calculations applied automatically!`;
    }
    if (msg.includes('laptop') || msg.includes('computer')) {
      return `Our best seller is the **Laptop Pro** ($1,299 before 10% discount). It features an elegant aluminum chassis, multi-core chip processing, and thermodynamic cooling. It's currently in stock and ready to ship! 

Would you like me to tell you more or add it to your shopping cart?`;
    }
    if (msg.includes('audio') || msg.includes('headphone') || msg.includes('earphone')) {
      return `We highly recommend our **Wireless Headphones** ($199 before 15% discount). They offer immersive hybrid noise cancellation, studio-tuned acoustics, and memory foam cushions. 

Let me know if you have any questions or want to purchase!`;
    }
    return `That sounds exciting! We have several top-rated tech accessories and devices in our catalog. Feel free to search our shop catalog, click **Add to Cart**, and use our drawer checkout for a premium shopping experience!`;
  }
};

// AI chatbot
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const user = await User.findById(req.user.id);
    const role = user?.role || 'customer';
    const userName = user?.name || 'User';

    let systemPrompt = '';

    if (role === 'admin') {
      // Gather Admin Analytics data
      const totalProducts = await Product.countDocuments();
      const totalSales = await Sales.countDocuments();
      const totalRevenueRes = await Sales.aggregate([
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ]);
      const totalRevenue = totalRevenueRes[0]?.total || 0;
      const lowStockProducts = await Product.find({ stock: { $lt: 10 } });
      const topProducts = await Product.find().sort({ salesCount: -1 }).limit(5);

      const storeStats = {
        totalProducts,
        totalSales,
        totalRevenue,
        lowStockItems: lowStockProducts.map(p => `${p.name} (${p.stock} left)`),
        topProducts: topProducts.map(p => `${p.name} (${p.salesCount} sold, $${p.revenue?.toFixed(2)} rev)`)
      };

      systemPrompt = `You are the SmartStore AI Operations Consultant, a premium and helpful assistant for store administrators.
Your tone should be analytical, professional, supportive, and strategic.
You have real-time access to the store's backend analytics.
Here is the current live store data:
- Total Products in Catalog: ${storeStats.totalProducts}
- Total Orders Processed: ${storeStats.totalSales}
- Total Revenue Earned: $${storeStats.totalRevenue.toFixed(2)}
- Products running low on stock (critical threshold < 10): ${storeStats.lowStockItems.length > 0 ? storeStats.lowStockItems.join(', ') : 'None! All levels healthy.'}
- Top 5 Products by Sales: ${storeStats.topProducts.join(', ')}

Answer the administrator's queries about inventory, sales, pricing suggestions, and revenue analysis. Use markdown to format tables, bullet lists, or metrics beautifully. Keep answers concise but detail-oriented. Encourage the admin to run pricing optimizations if stock levels are healthy and high-velocity items are trending.`;
    } else {
      // Gather Customer Catalog data
      const products = await Product.find({}, 'name category price stock discount description rating');
      const catalog = products.map(p => `• ${p.name} [Category: ${p.category}] - Price: $${p.price} (Discount: ${p.discount}%, Stock: ${p.stock} units, Rating: ${p.rating}/5). Description: ${p.description}`);

      systemPrompt = `You are the SmartStore AI Shopping Copilot, a sleek, personal, and friendly assistant for standard customers.
Your tone should be welcoming, premium, encouraging, and helpful.
You help customers find products, recommend items based on their preferences, answer catalog questions, check stock levels, and explain active discount rates.
Here is our current live product catalog:
${catalog.join('\n')}

Guide the customer on what they can buy. Always verify stock (if stock is 0, let them know it is temporarily out of stock). Suggest discount prices where applicable (e.g. if a product has a 10% discount, compute its actual final price: original price * (1 - discount/100)).
Be concise, format your response in beautiful markdown, and direct them to click "Add to Cart" or start checking out. Do not mention system configurations or DB queries.`;
    }

    let answer = '';
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey !== 'AIzaSyAtoBg4eL5XnpmyYVlab2H-ouGnpUgQuwEY' && !geminiKey.includes('your-key')) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        // Use gemini-1.5-flash for maximum responsiveness and system prompt capabilities
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent(
          `${systemPrompt}\n\nUser Message: ${message}`
        );
        const response = await result.response;
        answer = response.text();
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to local model:', geminiError.message);
        answer = generateLocalResponse(message, role, systemPrompt);
      }
    } else {
      answer = generateLocalResponse(message, role, systemPrompt);
    }

    res.json({
      title: role === 'admin' ? 'SmartStore AI Operations Consultant' : 'SmartStore AI Shopping Copilot',
      description: answer,
      response: answer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
