const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Request = require('../models/Request');

const adminOnly = [protect, requireRole('ADMIN')];

// Dashboard stats
router.get('/stats', ...adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalMechanics, totalOwners, totalRequests, completedJobs, pendingJobs] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'MECHANIC' }),
        User.countDocuments({ role: 'CAR_OWNER' }),
        Request.countDocuments(),
        Request.countDocuments({ status: 'COMPLETED' }),
        Request.countDocuments({ status: 'PENDING' }),
      ]);
    const revenue = await Request.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$serviceFee' } } },
    ]);
    res.json({
      totalUsers,
      totalMechanics,
      totalOwners,
      totalRequests,
      completedJobs,
      pendingJobs,
      revenue: revenue[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List all users with filters
router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve / block a user
router.patch('/users/:id', ...adminOnly, async (req, res) => {
  try {
    const { isApproved } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Certify / revoke / reject a mechanic's certification.
// Body: { decision: 'APPROVE' | 'REJECT' | 'REVOKE' }
// (legacy `isCertified: boolean` still accepted: true → APPROVE, false → REVOKE)
router.patch('/users/:id/certify', ...adminOnly, async (req, res) => {
  try {
    let { decision, isCertified } = req.body;
    if (!decision && typeof isCertified === 'boolean') {
      decision = isCertified ? 'APPROVE' : 'REVOKE';
    }
    if (!['APPROVE', 'REJECT', 'REVOKE'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'MECHANIC') {
      return res.status(400).json({ message: 'Only mechanics can be certified' });
    }

    if (decision === 'APPROVE') {
      user.isCertified = true;
      user.certifiedAt = new Date();
      user.certifiedBy = req.user._id;
      user.certificateStatus = 'APPROVED';
    } else if (decision === 'REJECT') {
      user.isCertified = false;
      user.certifiedAt = null;
      user.certifiedBy = null;
      user.certificateStatus = 'REJECTED';
    } else {
      user.isCertified = false;
      user.certifiedAt = null;
      user.certifiedBy = null;
      if (user.certificateStatus === 'APPROVED') user.certificateStatus = 'PENDING';
    }

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a user
router.delete('/users/:id', ...adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// List all requests / jobs
router.get('/jobs', ...adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const jobs = await Request.find(filter)
      .populate('owner', 'name email phone')
      .populate('mechanic', 'name email phone isCertified')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Request.countDocuments(filter);
    res.json({ jobs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
