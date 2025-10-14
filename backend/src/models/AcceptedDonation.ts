import mongoose, { Schema, InferSchemaType } from 'mongoose';

const AcceptedDonationSchema = new Schema({
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NGO',
    required: true
  },
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  status: {
    type: String,
    enum: ['accepted', 'distributed', 'cancelled'],
    default: 'accepted'
  },
  acceptedAt: {
    type: Date,
    default: Date.now
  },
  distributionLocation: {
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    address: { type: String, required: true }
  },
  beneficiariesNotified: {
    type: Boolean,
    default: false
  },
  notificationSentAt: Date,
  distributionStartTime: Date,
  distributionEndTime: Date,
}, {
  timestamps: true
});

// Indexes
AcceptedDonationSchema.index({ ngoId: 1, status: 1 });
AcceptedDonationSchema.index({ donationId: 1 });
AcceptedDonationSchema.index({ 'distributionLocation.coordinates': '2dsphere' });

export type AcceptedDonationDocument = InferSchemaType<typeof AcceptedDonationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AcceptedDonationModel = mongoose.model<AcceptedDonationDocument>('AcceptedDonation', AcceptedDonationSchema);