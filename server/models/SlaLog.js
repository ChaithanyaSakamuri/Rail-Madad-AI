import mongoose from 'mongoose';

const slaLogSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
  },
  priority: {
    type: String,
    enum: ['P1', 'P2', 'P3', 'P4'],
    required: true,
  },
  slaDeadline: {
    type: Date,
    required: true,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  breached: {
    type: Boolean,
    default: false,
  },
  escalationLevelReached: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('SlaLog', slaLogSchema);
