import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Sales from '../models/Sales.js';
import Product from '../models/Product.js';

dotenv.config();

const check = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected!');

    const sales = await Sales.find().limit(5);
    console.log('Found sales count:', sales.length);
    for (const sale of sales) {
      console.log(`Order ID: ${sale.orderId}, Product Name: ${sale.productName}, Product Ref: ${sale.product}`);
      if (sale.product) {
        const prod = await Product.findById(sale.product);
        if (prod) {
          console.log(`  -> Product exists: ${prod.name}, Image: ${prod.image ? prod.image.substring(0, 50) + '...' : 'NONE'}`);
        } else {
          console.log(`  -> Product NOT FOUND in database for ID: ${sale.product}`);
        }
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
