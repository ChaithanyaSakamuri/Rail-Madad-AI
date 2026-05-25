import mongoose from 'mongoose';

const escalationSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
  },
  escalatedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  escalationLevel: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    default: 'SLA Breached',
  },
  escalatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Escalation', escalationSchema);
