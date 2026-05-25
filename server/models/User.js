import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['passenger', 'officer', 'admin'],
    default: 'passenger',
  },
  // Fields specific to Officers
  department: {
    type: String,
    enum: ['TTE', 'Station Master', 'RPF', 'Catering Supervisor', 'Medical Team', 'General Admin'],
    default: 'General Admin',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  assignedZone: {
    type: String, // e.g. "Northern Railway", "NDLS Station", "Train 12345"
    default: 'All Zones',
  },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (password) {
  return await bcryptjs.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
