const express = require('express');
const { body, query, validationResult } = require('express-validator');
const DeliverySlot = require('../models/DeliverySlot');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Default two-hour windows used when seeding
const DEFAULT_WINDOWS = [
  { startTime: '09:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '13:00' },
  { startTime: '14:00', endTime: '16:00' },
  { startTime: '16:00', endTime: '18:00' },
];

// @route  GET /api/slots?date=YYYY-MM-DD
// @desc   List available slots for a given future date (authenticated customers)
router.get(
  '/',
  protect,
  [query('date').isISO8601().withMessage('date query param must be a valid date (YYYY-MM-DD)')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { date } = req.query;
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);

    // Reject past dates
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (start < today) {
      return res.status(400).json({ message: 'Cannot query slots for past dates' });
    }

    const end = new Date(start);
    end.setUTCHours(23, 59, 59, 999);

    const slots = await DeliverySlot.find({
      date: { $gte: start, $lte: end },
      isActive: true,
    }).sort({ startTime: 1 });

    // If no slots exist for this date, auto-generate default windows
    if (slots.length === 0) {
      const created = await DeliverySlot.insertMany(
        DEFAULT_WINDOWS.map((w) => ({
          date: start,
          startTime: w.startTime,
          endTime: w.endTime,
          capacity: 10,
          booked: 0,
          isActive: true,
        }))
      );
      return res.json(
        created.map((s) => ({ ...s.toObject(), available: s.capacity - s.booked }))
      );
    }

    res.json(
      slots
        .filter((s) => s.booked < s.capacity) // only show slots with capacity
        .map((s) => ({ ...s.toObject(), available: s.capacity - s.booked }))
    );
  }
);

// @route  POST /api/slots
// @desc   Admin: create a slot manually
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('date').isISO8601().withMessage('date must be ISO 8601'),
    body('startTime').notEmpty(),
    body('endTime').notEmpty(),
    body('capacity').isInt({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { date, startTime, endTime, capacity, zone } = req.body;
    const slot = await DeliverySlot.create({ date, startTime, endTime, capacity, zone });
    res.status(201).json(slot);
  }
);

module.exports = router;
