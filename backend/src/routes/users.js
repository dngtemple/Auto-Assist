const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { protect, requireRole } = require('../middleware/auth');
const User = require('../models/User');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'certificates');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
    if (!ok) return cb(new Error('Only images or PDF files are allowed'));
    cb(null, true);
  },
});

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

// Mechanic uploads / replaces business certificate
router.post(
  '/me/certificate',
  protect,
  requireRole('MECHANIC'),
  (req, res, next) => {
    upload.single('certificate')(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

      const existing = await User.findById(req.user._id).select('certificateUrl');
      if (existing?.certificateUrl) {
        const prevPath = path.join(__dirname, '..', '..', existing.certificateUrl.replace(/^\//, ''));
        fs.promises.unlink(prevPath).catch(() => {});
      }

      const relUrl = `/uploads/certificates/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          certificateUrl: relUrl,
          certificateSubmittedAt: new Date(),
          certificateStatus: 'PENDING',
        },
        { new: true }
      );
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

module.exports = router;
