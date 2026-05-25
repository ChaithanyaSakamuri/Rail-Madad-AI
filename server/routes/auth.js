import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ─── User Register / Sign Up ──────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phoneNumber, role, department, assignedZone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Force certain emails to be Admin for ease of testing
    const adminEmails = [
      'admin@railmadad.gov.in'
    ];
    
    let userRole = role || 'passenger';
    if (adminEmails.includes(cleanEmail)) {
      userRole = 'admin';
    }

    const user = new User({
      name,
      email: cleanEmail,
      password,
      phoneNumber,
      role: userRole,
      department: userRole === 'officer' ? department : 'General Admin',
      assignedZone: userRole === 'officer' ? assignedZone : 'All Zones'
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        assignedZone: user.assignedZone,
        phoneNumber: user.phoneNumber
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── User Sign In ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Signed in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        assignedZone: user.assignedZone,
        phoneNumber: user.phoneNumber
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Get Current User ─────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Forgot Password (Mock) ───────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }
    // In production, send email reset link. For mockup, return success
    res.json({ message: 'Password reset link sent to your registered email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Reset Password (Mock) ─────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.password = password;
    await user.save();
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Email Verification (Mock) ──────────────────────────────────────────────────
router.post('/verify-email', auth, async (req, res) => {
  res.json({ message: 'Email verified successfully' });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
