const router = require('express').Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Get current user profile
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// Update profile
router.patch('/me', protect, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'specialization', 'avatar', 'vehicleModel', 'vehicleType'];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Mechanic toggle online status
router.patch('/me/status', protect, async (req, res) => {
  try {
    const { isOnline, coordinates } = req.body;
    const update = { isOnline };
    if (coordinates) {
      update.location = { type: 'Point', coordinates };
    }
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
