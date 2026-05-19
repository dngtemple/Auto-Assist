const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['CAR_OWNER', 'MECHANIC', 'ADMIN'], required: true },
    avatar: { type: String, default: null },

    // Mechanic-specific
    isOnline: { type: Boolean, default: false },
    specialization: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalJobs: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: true },
    isCertified: { type: Boolean, default: false },
    certifiedAt: { type: Date, default: null },
    certifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    certificateUrl: { type: String, default: null },
    certificateSubmittedAt: { type: Date, default: null },
    certificateStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE',
    },

    // GeoJSON for geospatial queries
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
