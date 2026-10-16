const mongoose = require('mongoose');

const driverProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'car', 'van'],
      required: true,
    },
    vehicleNumber: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, default: true },
    currentZone: { type: String, trim: true },
    totalDeliveries: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DriverProfile', driverProfileSchema);
