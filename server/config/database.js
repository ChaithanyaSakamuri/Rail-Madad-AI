import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    // Set a short server selection timeout of 5 seconds for fast fallback
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected (Atlas): ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB Atlas connection failed: ${error.message}`);
    console.log('Attempting to connect to local MongoDB database...');
    try {
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/smartstore', {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`✅ Connected successfully to local MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (localError) {
      console.error(`❌ Local MongoDB connection also failed: ${localError.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
