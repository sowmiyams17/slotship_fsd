const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deliverySlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliverySlot',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    pickupAddress: { type: String, required: true, trim: true },
    deliveryAddress: { type: String, required: true, trim: true },
    recipientName: { type: String, required: true, trim: true },
    recipientPhone: { type: String, required: true, trim: true },
    packageDescription: { type: String, required: true, trim: true },
    deliveryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'assigned', 'out_for_delivery', 'delivered'],
      default: 'pending',
    },
    notes: { type: String, trim: true },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
