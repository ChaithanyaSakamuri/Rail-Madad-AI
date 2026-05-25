import mongoose from 'mongoose';
import User from '../models/User.js';

const test = async () => {
  try {
    console.log('1. Instantiating User...');
    const user = new User({
      name: 'Test Offline',
      email: 'Offline@Example.Com',
      password: 'PlainPassword123'
    });
    console.log('Email before save validation:', user.email);
    console.log('Password before save validation:', user.password);

    console.log('\n2. Simulating pre-save hook...');
    // We can run the pre-save hooks by calling validate() or using schema hooks
    // Let's run the specific pre('save') function directly or via validate
    const hooks = user.schema.s.hooks;
    // Let's trigger Mongoose's internal save hooks manually or run the function
    // Mongoose hooks can be fetched from the schema
    for (const hook of user.schema.s.hooks.pre.save) {
      await new Promise((resolve, reject) => {
        hook.fn.call(user, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log('Password after hook 1:', user.password);
    
    // Now simulate the login save (saving when password is NOT modified)
    console.log('\n3. Simulating save on login (updating lastLogin)...');
    user.lastLogin = new Date();
    
    // Run hooks again (simulating second save)
    for (const hook of user.schema.s.hooks.pre.save) {
      await new Promise((resolve, reject) => {
        hook.fn.call(user, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    console.log('Password after hook 2 (second save):', user.password);
    console.log('Was password hashed twice?');
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      console.log('Password is a bcrypt hash.');
    } else {
      console.log('Password is not hashed.');
    }

  } catch (error) {
    console.error('Error:', error);
  }
};

test();
