import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['trend', 'recommendation', 'alert', 'prediction'],
    required: true,
  },
  title: String,
  description: String,
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  metrics: {
    currentRevenue: Number,
    projectedRevenue: Number,
    percentageChange: Number,
    confidence: { type: Number, default: 0.85 },
  },
  recommendations: [String],
  isRead: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  generatedBy: {
    model: String,
    timestamp: { type: Date, default: Date.now },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('AIInsight', aiInsightSchema);
