const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },

    issueDescription: { type: String, required: true },
    vehicleType: { type: String, default: 'Car' },
    vehicleModel: { type: String, default: '' },

    ownerLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      address: { type: String, default: '' },
    },

    mechanicLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },

    estimatedArrival: { type: Number, default: null }, // minutes
    serviceFee: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },

    completedAt: { type: Date, default: null },
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, default: '' },
  },
  { timestamps: true }
);

requestSchema.index({ ownerLocation: '2dsphere' });
requestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);
