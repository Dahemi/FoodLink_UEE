import mongoose, { Schema, InferSchemaType } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Address schema for location-based queries
const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'Sri Lanka' },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }
}, { _id: false });

const DonorSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  phone: { 
    type: String, 
    required: true,
    trim: true 
  },
  address: { 
    type: AddressSchema, 
    required: true 
  },
  profileImage: { type: String }, // URL to profile image
  
  // Donor specific fields
  donorType: { 
    type: String, 
    enum: ['individual', 'restaurant', 'hotel', 'catering', 'grocery', 'bakery', 'other'], 
    required: true 
  },
  businessName: { type: String }, // For business donors
  businessLicense: { type: String }, // For business verification
  averageDonationFrequency: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'occasional'], 
    default: 'occasional' 
  },
  preferredPickupTimes: [{ type: String }],
  specialInstructions: { type: String, maxlength: 500 },
  
  // Account status
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  
  // Authentication
  lastLogin: { 
    type: Date 
  },
  refreshTokens: [{
    token: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Password reset
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  
  // Statistics
  stats: {
    totalDonations: { type: Number, default: 0 },
    totalMealsProvided: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalInteractions: { type: Number, default: 0 },
  },
  
  // Notification preferences
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    donationUpdates: { type: Boolean, default: true },
    pickupReminders: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false }
  }
}, { 
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete (ret as any).password;
      delete (ret as any).refreshTokens;
      delete (ret as any).verificationToken;
      delete (ret as any).passwordResetToken;
      return ret;
    }
  }
});

// Indexes for performance (email already has unique: true, so no need to index again)
DonorSchema.index({ donorType: 1 });
DonorSchema.index({ 'address.coordinates': '2dsphere' }); // For location-based queries
DonorSchema.index({ isActive: 1, isVerified: 1 });

// Hash password before saving
DonorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// CASCADE delete - remove related data when donor is deleted
DonorSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const donorId = this._id;
    
    // Import models (avoiding circular dependency)
    const { DonationModel } = await import('./Donation');
    const { ClaimModel } = await import('./Claim');
    const { VolunteerTaskModel } = await import('./VolunteerTask');
    const { PickupEventModel } = await import('./PickupEvent');
    const { MessageModel } = await import('./Message');
    const { FeedbackModel } = await import('./Feedback');
    const { NotificationModel } = await import('./Notification');
    
    // Get all donations by this donor
    const donations = await DonationModel.find({ donorId });
    const donationIds = donations.map(d => d._id);
    
    // Delete related claims
    await ClaimModel.deleteMany({ donationId: { $in: donationIds } });
    
    // Delete related volunteer tasks
    await VolunteerTaskModel.deleteMany({ donorId });
    
    // Delete related pickup events
    await PickupEventModel.deleteMany({ donorId });
    
    // Delete donations
    await DonationModel.deleteMany({ donorId });
    
    // Delete messages sent by this donor
    await MessageModel.deleteMany({ senderId: donorId });
    
    // Delete feedback given by or about this donor
    await FeedbackModel.deleteMany({ 
      $or: [{ reviewerId: donorId }, { revieweeId: donorId }]
    });
    
    // Delete notifications for this donor
    await NotificationModel.deleteMany({ recipientId: donorId });
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
DonorSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate refresh token
DonorSchema.methods.generateRefreshToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  this.refreshTokens.push({
    token,
    expiresAt,
    createdAt: new Date()
  });
  
  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  return token;
};

// Generate verification token
DonorSchema.methods.generateVerificationToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = token;
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

// Generate password reset token
DonorSchema.methods.generatePasswordResetToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

// Clean expired refresh tokens
DonorSchema.methods.cleanExpiredTokens = function() {
  this.refreshTokens = this.refreshTokens.filter(
    (token: any) => token.expiresAt > new Date()
  );
};

// Virtual for full address
DonorSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

export type DonorDocument = InferSchemaType<typeof DonorSchema> & { 
  _id: mongoose.Types.ObjectId;
  comparePassword: (password: string) => Promise<boolean>;
  generateRefreshToken: () => string;
  generateVerificationToken: () => string;
  generatePasswordResetToken: () => string;
  cleanExpiredTokens: () => void;
  fullAddress: string;
};

export const DonorModel = mongoose.model<DonorDocument>('Donor', DonorSchema);
