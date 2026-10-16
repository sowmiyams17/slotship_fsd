const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const DeliverySlot = require('../models/DeliverySlot');
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
