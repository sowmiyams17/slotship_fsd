const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const DeliverySlot = require('../models/DeliverySlot');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Valid status transitions
const TRANSITIONS = {
  pending:          ['confirmed'],
  confirmed:        ['assigned'],
  assigned:         ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered:        [],
};

// @route  POST /api/orders
// @desc   Customer: create a booking
router.post(
  '/',
  protect,
  authorize('customer'),
  [
    body('slotId').notEmpty().withMessage('slotId is required'),
    body('pickupAddress').trim().notEmpty().withMessage('Pickup address is required'),
    body('deliveryAddress').trim().notEmpty().withMessage('Delivery address is required'),
    body('recipientName').trim().notEmpty().withMessage('Recipient name is required'),
    body('recipientPhone').trim().notEmpty().withMessage('Recipient phone is required'),
    body('packageDescription').trim().notEmpty().withMessage('Package description is required'),
    body('deliveryDate').isISO8601().withMessage('deliveryDate must be a valid date'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { slotId, pickupAddress, deliveryAddress, recipientName, recipientPhone,
            packageDescription, deliveryDate, notes } = req.body;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (new Date(deliveryDate) < today) {
      return res.status(400).json({ message: 'Delivery date cannot be in the past' });
    }

    const slot = await DeliverySlot.findOneAndUpdate(
      { _id: slotId, isActive: true, $expr: { $lt: ['$booked', '$capacity'] } },
      { $inc: { booked: 1 } },
      { new: true }
    );

    if (!slot) return res.status(409).json({ message: 'Slot is full or does not exist' });

    try {
      const order = await Order.create({
        customer: req.user._id,
        deliverySlot: slot._id,
        pickupAddress,
        deliveryAddress,
        recipientName,
        recipientPhone,
        packageDescription,
        deliveryDate: new Date(deliveryDate),
        notes,
        statusHistory: [{ status: 'pending', changedBy: req.user._id }],
      });

      const populated = await order.populate('deliverySlot', 'date startTime endTime');
      res.status(201).json(populated);
    } catch (err) {
      await DeliverySlot.findByIdAndUpdate(slotId, { $inc: { booked: -1 } });
      console.error(err);
      res.status(500).json({ message: 'Order creation failed' });
    }
  }
);

// @route  GET /api/orders
// @desc   Customer: own orders | Admin: all orders
router.get('/', protect, authorize('customer', 'admin'), async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { customer: req.user._id };
  const orders = await Order.find(filter)
    .populate('customer', 'name email phone')
    .populate('deliverySlot', 'date startTime endTime')
    .populate('driver', 'name email phone')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @route  GET /api/orders/driver/mine
// @desc   Driver: their assigned orders (must be before /:id)
router.get('/driver/mine', protect, authorize('driver'), async (req, res) => {
  const orders = await Order.find({ driver: req.user._id })
    .populate('customer', 'name email phone')
    .populate('deliverySlot', 'date startTime endTime')
    .sort({ deliveryDate: 1 });
  res.json(orders);
});

// @route  GET /api/orders/:id
// @desc   Customer (own) | Admin (any) | Driver (assigned)
router.get('/:id', protect, authorize('customer', 'admin', 'driver'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('deliverySlot', 'date startTime endTime')
    .populate('driver', 'name email phone')
    .populate('statusHistory.changedBy', 'name role');

  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Enforce scope
  if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  if (req.user.role === 'driver' && (!order.driver || order.driver._id.toString() !== req.user._id.toString())) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(order);
});

// @route  PATCH /api/orders/:id/status
// @desc   Admin: confirm / assign | Driver: progress delivery
router.patch(
  '/:id/status',
  protect,
  authorize('admin', 'driver'),
  [
    body('status').notEmpty().withMessage('status is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const { status, driverId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Validate transition
    const allowed = TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid transition: ${order.status} → ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      });
    }

    // Role-based permission per transition
    if (req.user.role === 'driver') {
      // Drivers may only move: assigned → out_for_delivery → delivered
      if (!['out_for_delivery', 'delivered'].includes(status)) {
        return res.status(403).json({ message: 'Drivers may only update delivery progress' });
      }
      if (!order.driver || order.driver.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not assigned to this order' });
      }
    }

    // Admin assigning a driver
    if (status === 'assigned') {
      if (!driverId) return res.status(400).json({ message: 'driverId is required when assigning' });
      if (!mongoose.isValidObjectId(driverId)) return res.status(400).json({ message: 'Invalid driverId' });
      const driver = await User.findOne({ _id: driverId, role: 'driver', isActive: true });
      if (!driver) return res.status(404).json({ message: 'Driver not found or inactive' });
      order.driver = driverId;
    }

    order.status = status;
    order.statusHistory.push({ status, changedBy: req.user._id });
    await order.save();

    const updated = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('deliverySlot', 'date startTime endTime')
      .populate('driver', 'name email phone')
      .populate('statusHistory.changedBy', 'name role');

    res.json(updated);
  }
);

module.exports = router;
