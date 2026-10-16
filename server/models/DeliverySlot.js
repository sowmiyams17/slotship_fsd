const mongoose = require('mongoose');

const deliverySlotSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true },   // e.g. "11:00"
    capacity: { type: Number, required: true, min: 1 },
    booked: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    zone: { type: String, trim: true },
  },
  { timestamps: true }
);

// Virtual: available slots
deliverySlotSchema.virtual('available').get(function () {
  return this.capacity - this.booked;
});

module.exports = mongoose.model('DeliverySlot', deliverySlotSchema);
