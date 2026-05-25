import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Sales from '../models/Sales.js';

dotenv.config();

const clearSales = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected!');

    console.log('Clearing all sales/orders documents from the database...');
    const result = await Sales.deleteMany({});
    console.log(`✅ Cleared successfully! Deleted ${result.deletedCount} order records.`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing sales:', err);
    process.exit(1);
  }
};

clearSales();
