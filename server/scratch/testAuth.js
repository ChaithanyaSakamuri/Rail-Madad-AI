import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcryptjs from 'bcryptjs';

dotenv.config({ path: './.env' });

const test = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/test_smartstore');
    console.log('Connected!');

    // Test signup details
    const testEmail = 'testuser_' + Date.now() + '@example.com';
    const testPassword = 'TestPassword123!';

    console.log(`\n1. Creating test user: ${testEmail}`);
    const user = new User({
      name: 'Test User',
      email: testEmail,
      password: testPassword,
    });
    
    await user.save();
    console.log('User created successfully. Stored password hash:', user.password);

    console.log('\n2. Testing login comparison:');
    const fetchedUser = await User.findOne({ email: testEmail });
    if (!fetchedUser) {
      console.error('FAIL: User not found in DB!');
      process.exit(1);
    }

    console.log('Comparing passwords using bcrypt...');
    const isMatch = await fetchedUser.comparePassword(testPassword);
    console.log('Match result:', isMatch ? 'SUCCESS (true)' : 'FAIL (false)');

    // Simulate updating lastLogin like the login route does
    console.log('\n3. Testing updating lastLogin and saving user:');
    fetchedUser.lastLogin = new Date();
    await fetchedUser.save();
    console.log('Saved again. New password hash:', fetchedUser.password);

    console.log('Comparing password after second save...');
    const fetchedAgain = await User.findOne({ email: testEmail });
    const isMatchAgain = await fetchedAgain.comparePassword(testPassword);
    console.log('Match result after second save:', isMatchAgain ? 'SUCCESS (true)' : 'FAIL (false)');

    // Clean up
    await User.deleteOne({ email: testEmail });
    console.log('\nCleanup done.');
    process.exit(0);
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
};

test();
