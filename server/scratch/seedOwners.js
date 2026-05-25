import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const OWNERS = [
  {
    name: 'Sakamuri Chaithanya',
    email: 'chaituchowdary301@gmail.com',
    password: 'Deepya@23',
    role: 'admin',
  },
  {
    name: 'Kilaru Rajesh',
    email: 'kilarurajesh23@gmail.com',
    password: 'Deepya@23',
    role: 'admin',
  },
  {
    name: 'Sakhamuri Deepya',
    email: 'sakhamurideepya23@gmail.com',
    password: 'Deepya@23',
    role: 'admin',
  }
];

const seedOwners = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected successfully!');

    for (const owner of OWNERS) {
      const emailLower = owner.email.toLowerCase();
      let user = await User.findOne({ email: emailLower });

      if (user) {
        console.log(`User "${owner.name}" (${owner.email}) already exists. Updating to Admin...`);
        user.name = owner.name;
        user.role = 'admin';
        user.password = owner.password; // Schema save hook will hash it if modified
        user.authProvider = 'email';
        await user.save();
        console.log(`✅ User "${owner.name}" updated successfully.`);
      } else {
        console.log(`User "${owner.name}" (${owner.email}) not found. Creating new Admin user...`);
        user = new User({
          name: owner.name,
          email: emailLower,
          password: owner.password,
          role: 'admin',
          authProvider: 'email',
        });
        await user.save();
        console.log(`✅ User "${owner.name}" created successfully.`);
      }
    }

    console.log('\n🎉 All 3 owners seeded successfully as Admin!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedOwners();
