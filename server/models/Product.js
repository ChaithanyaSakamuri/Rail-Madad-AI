import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  discount: { type: Number, default: 0, min: 0, max: 100 },

  // Women's clothing specific
  category: {
    type: String,
    enum: ['Cord-Sets', 'Kurtis', 'Partywear (Three-Piece Set)', 'Leggings', 'Straight Pants', 'Accessories', 'Other'],
    default: 'Other',
  },
  sizes: {
    type: [String],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size', '26', '28', '30', '32', '34', '36', '38', '40'],
    default: [],
  },
  colors: [
    {
      name: { type: String },
      hex: { type: String },
    },
  ],
  material: { type: String, trim: true },
  occasion: {
    type: [String],
    enum: ['Casual', 'Formal', 'Party', 'Wedding', 'Festive', 'Office', 'Beach', 'Sport', 'Ethnic'],
    default: [],
  },

  // Images stored as base64 or URLs
  image: { type: String }, // primary image
  images: [{ type: String }], // gallery

  stock: { type: Number, default: 0, min: 0 },
  sku: { type: String, trim: true },
  tags: [String],

  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },

  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isLowStock: { type: Boolean, default: false },

  aiGenerated: {
    description: String,
    tags: [String],
    marketingCaption: String,
    suggestedPrice: Number,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

productSchema.index({ name: 'text', description: 'text', tags: 'text', category: 1 });

export default mongoose.model('Product', productSchema);
