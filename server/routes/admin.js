const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const DeliverySlot = require('../models/DeliverySlot');
const DriverProfile = require('../models/DriverProfile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin role
router.use(protect, authorize('admin'));

// @route  GET /api/admin/stats
// @desc   Dashboard stats
router.get('/stats', async (req, res) => {
  const [totalCustomers, totalDrivers, totalOrders, pendingOrders] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'driver' }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
  ]);
  res.json({ totalCustomers, totalDrivers, totalOrders, pendingOrders });
});

// @route  GET /api/admin/drivers
// @desc   List all driver accounts
router.get('/drivers', async (req, res) => {
  const drivers = await User.find({ role: 'driver' }).select('-password').sort({ name: 1 });
  res.json(drivers);
});

// @route POST /api/admin/drivers
// @desc  Admin creates a new driver account
router.post(
  '/drivers',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('vehicleType').isIn(['bike', 'scooter', 'car', 'van']),
    body('vehicleNumber').trim().notEmpty(),
    body('licenseNumber').trim().notEmpty(),
    body('currentZone').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      password,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      currentZone,
    } = req.body;

    let user;

    try {
      const existingUser = await User.findOne({
        email: email.trim().toLowerCase(),
      });

      if (existingUser) {
        return res.status(409).json({
          message: 'An account with this email already exists',
        });
      }

      user = await User.create({
        name,
        email,
        password,
        phone,
        role: 'driver',
      });

      const profile = await DriverProfile.create({
        user: user._id,
        vehicleType,
        vehicleNumber,
        licenseNumber,
        currentZone,
        isAvailable: false,
      });

      return res.status(201).json({
        message: 'Driver created successfully',
        driver: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          profile,
        },
      });
    } catch (error) {
      // Remove the login account if profile creation failed.
      if (user) {
        try {
          await User.findByIdAndDelete(user._id);
        } catch (cleanupError) {
          console.error('Driver cleanup failed:', cleanupError);
        }
      }

      console.error('Create driver error:', error);

      if (error.code === 11000) {
        return res.status(409).json({
          message: 'Driver account or profile already exists',
        });
      }

      return res.status(500).json({
        message: 'Failed to create driver',
      });
    }
  }
);

// @route  GET /api/admin/customers
// @desc   List all customer accounts
router.get('/customers', async (req, res) => {
  const customers = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
  res.json(customers);
});

// @route  GET /api/admin/slots
// @desc   List all slots (any date)
router.get('/slots', async (req, res) => {
  const slots = await DeliverySlot.find().sort({ date: 1, startTime: 1 });
  res.json(slots.map((s) => ({ ...s.toObject(), available: s.capacity - s.booked })));
});

// @route  PATCH /api/admin/slots/:id
// @desc   Update slot capacity or active status
router.patch(
  '/slots/:id',
  [
    body('capacity').optional().isInt({ min: 1 }),
    body('isActive').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const updates = {};
    if (req.body.capacity !== undefined) updates.capacity = req.body.capacity;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;

    const slot = await DeliverySlot.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    res.json({ ...slot.toObject(), available: slot.capacity - slot.booked });
  }
);

module.exports = router;
