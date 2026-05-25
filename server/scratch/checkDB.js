import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcryptjs from 'bcryptjs';

dotenv.config();

const check = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/smartstore');
    console.log('Connected successfully!');

    const users = await User.find({});
    console.log(`\nFound ${users.length} user(s) in local DB:`);
    for (const u of users) {
      console.log(`- ID: ${u._id}`);
      console.log(`  Name: ${u.name}`);
      console.log(`  Email: "${u.email}"`);
      console.log(`  Role: ${u.role}`);
      console.log(`  Password Hash: "${u.password}"`);
      
      // Let's test if the admin password "Admin@123" matches if this is the admin
      if (u.email === 'admin@smartstore.ai') {
        const isMatch = await bcryptjs.compare('Admin@123', u.password);
        console.log(`  Does "Admin@123" match? ${isMatch ? '✅ YES' : '❌ NO'}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking DB:', error);
    process.exit(1);
  }
};

check();
