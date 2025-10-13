import mongoose, { Schema, InferSchemaType } from 'mongoose';

const BeneficiaryNotificationSchema = new Schema({
  // NGO that generated this notification by accepting donation
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NGO',
    required: true
  },

  // Related donation details
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },

  // Notification content
  title: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  body: { 
    type: String, 
    required: true,
    maxlength: 500
  },
  shortText: { 
    type: String, 
    maxlength: 50 
  },

  // Status tracking
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active'
  },
  
  // Metadata
  readBy: [{ 
    beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' },
    readAt: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Generate notification ID on creation
BeneficiaryNotificationSchema.pre('save', async function(next) {
  if (this.isNew && !this.notificationId) {
    const timestamp = Date.now();
    this.notificationId = `bn-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

export type BeneficiaryNotificationDocument = InferSchemaType<typeof BeneficiaryNotificationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BeneficiaryNotificationModel = mongoose.model<BeneficiaryNotificationDocument>('BeneficiaryNotification', BeneficiaryNotificationSchema);