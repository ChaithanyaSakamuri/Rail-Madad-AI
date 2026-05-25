import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  remark: {
    type: String,
    default: '',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true,
  },
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  complaintText: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: 'English',
  },
  trainNumber: {
    type: String,
    default: '',
  },
  coachNumber: {
    type: String,
    default: '',
  },
  station: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['Cleanliness', 'Maintenance', 'Safety/Crime', 'Catering', 'Medical Emergency', 'General'],
    default: 'General',
  },
  priority: {
    type: String,
    enum: ['P1', 'P2', 'P3', 'P4'],
    default: 'P4',
  },
  status: {
    type: String,
    enum: ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Escalated'],
    default: 'Submitted',
  },
  assignedOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  aiDetails: {
    confidence: { type: Number, default: 1.0 },
    detectedIssue: { type: String, default: '' },
    tags: [{ type: String }],
    visualConfidence: { type: Number, default: 0.0 }
  },
  slaDeadline: {
    type: Date,
    required: true,
  },
  escalationLevel: {
    type: Number,
    default: 0, // 0 = original officer, 1 = senior supervisor, 2 = divisional manager, 3 = ministry escalation
  },
  timeline: [timelineSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for faster lookups
complaintSchema.index({ complaintId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ assignedOfficer: 1 });
complaintSchema.index({ passenger: 1 });
complaintSchema.index({ priority: 1 });

export default mongoose.model('Complaint', complaintSchema);
