import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['complaint_status', 'escalation', 'new_assignment', 'system_alert'],
    required: true,
  },
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index({ recipient: 1, read: 1 });

export default mongoose.model('Notification', notificationSchema);
