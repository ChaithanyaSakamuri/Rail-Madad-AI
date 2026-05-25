import mongoose from 'mongoose';

const salesSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  productName: String,
  quantity: { type: Number, required: true },
  unitPrice: Number,
  totalAmount: Number,
  discount: { type: Number, default: 0 },
  finalAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packing', 'packed', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },
  paymentMethod: String,
  transactionId: { type: String, default: '' },
  trackingId: { type: String, default: '' },
  deliveryCharge: { type: Number, default: 120 },
  customerName: { type: String, default: '' },
  customerEmail: String,
  customerPhone: String,
  shippingAddress: String,
  pincode: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending_verification', 'paid', 'refunded'],
    default: 'unpaid',
  },
  courierPartner: {
    type: String,
    enum: ['Delhivery', 'Shiprocket', 'Blue Dart', 'DTDC', 'Indian Post', 'None'],
    default: 'None',
  },
  dispatchDate: Date,
  estimatedDeliveryDate: Date,
  adminNotes: { type: String, default: '' },
  notes: String,
  selectedSize: String,
  selectedColor: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Sales', salesSchema);
