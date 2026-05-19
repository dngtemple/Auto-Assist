const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth');
const Request = require('../models/Request');
const User = require('../models/User');

// Car owner creates a service request
router.post('/', protect, requireRole('CAR_OWNER'), async (req, res) => {
  try {
    const { issueDescription, vehicleType, vehicleModel, coordinates, address } = req.body;
    const request = await Request.create({
      owner: req.user._id,
      issueDescription,
      vehicleType,
      vehicleModel,
      ownerLocation: { type: 'Point', coordinates, address },
    });
    await request.populate('owner', 'name phone avatar');
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get nearby PENDING requests for an online mechanic
router.get('/pending-nearby', protect, requireRole('MECHANIC'), async (req, res) => {
  try {
    const mechanic = await User.findById(req.user._id).select('location');
    const [lng, lat] = mechanic.location.coordinates;
    const hasLocation = lng !== 0 || lat !== 0;
    const filter = hasLocation
      ? {
          status: 'PENDING',
          ownerLocation: {
            $geoWithin: { $centerSphere: [[lng, lat], 10 / 6378.1] },
          },
        }
      : { status: 'PENDING' };
    const requests = await Request.find(filter).populate('owner', 'name phone avatar');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get requests for current user
router.get('/mine', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'CAR_OWNER'
      ? { owner: req.user._id }
      : { mechanic: req.user._id };
    const requests = await Request.find(filter)
      .populate('owner', 'name phone avatar')
      .populate('mechanic', 'name phone avatar rating specialization isCertified')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single request
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('owner', 'name phone avatar')
      .populate('mechanic', 'name phone avatar rating specialization isCertified');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mechanic accepts a job
router.patch('/:id/accept', protect, requireRole('MECHANIC'), async (req, res) => {
  try {
    const request = await Request.findOneAndUpdate(
      { _id: req.params.id, status: 'PENDING' },
      { mechanic: req.user._id, status: 'ACCEPTED' },
      { new: true }
    ).populate('owner', 'name phone avatar');
    if (!request) return res.status(400).json({ message: 'Job no longer available' });
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update request status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, serviceFee } = req.body;
    const updates = { status };
    if (status === 'COMPLETED') {
      updates.completedAt = new Date();
      if (serviceFee) updates.serviceFee = serviceFee;
      await User.findByIdAndUpdate(req.user._id, { $inc: { totalJobs: 1 } });
    }
    const request = await Request.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('owner', 'name phone avatar')
      .populate('mechanic', 'name phone avatar rating isCertified');
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Submit a rating
router.patch('/:id/rate', protect, requireRole('CAR_OWNER'), async (req, res) => {
  try {
    const { rating, review } = req.body;
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { rating, review },
      { new: true }
    );
    if (request.mechanic) {
      const jobs = await Request.find({ mechanic: request.mechanic, rating: { $ne: null } });
      const avg = jobs.reduce((sum, r) => sum + r.rating, 0) / jobs.length;
      await User.findByIdAndUpdate(request.mechanic, { rating: avg.toFixed(1) });
    }
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
