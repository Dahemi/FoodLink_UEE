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

const NGOSchema = new Schema({
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
  
  // NGO specific fields
  registrationNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  organizationType: { 
    type: String, 
    enum: ['charity', 'ngo', 'religious', 'community', 'government'], 
    required: true 
  },
  servingAreas: [{ type: String }], // Areas they serve
  capacity: { type: Number, default: 100 }, // How many people they can serve
  operatingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' }
  },
  certifications: [{ type: String }], // Food safety certifications
  website: { type: String },
  description: { type: String, maxlength: 1000 },
  
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
    totalClaims: { type: Number, default: 0 },
    totalMealsDistributed: { type: Number, default: 0 },
    totalVolunteersManaged: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalInteractions: { type: Number, default: 0 },
  },
  
  // Notification preferences
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    newDonations: { type: Boolean, default: true },
    volunteerUpdates: { type: Boolean, default: true },
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

// Indexes for performance (email and registrationNumber already have unique: true)
NGOSchema.index({ organizationType: 1 });
NGOSchema.index({ 'address.coordinates': '2dsphere' }); // For location-based queries
NGOSchema.index({ isActive: 1, isVerified: 1 });

// Hash password before saving
NGOSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// CASCADE delete - remove related data when NGO is deleted
NGOSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const ngoId = this._id;
    
    // Import models (avoiding circular dependency)
    const { ClaimModel } = await import('./Claim');
    const { VolunteerTaskModel } = await import('./VolunteerTask');
    const { PickupEventModel } = await import('./PickupEvent');
    const { MessageModel } = await import('./Message');
    const { FeedbackModel } = await import('./Feedback');
    const { NotificationModel } = await import('./Notification');
    
    // Delete related claims
    await ClaimModel.deleteMany({ ngoId });
    
    // Delete related volunteer tasks
    await VolunteerTaskModel.deleteMany({ ngoId });
    
    // Delete related pickup events
    await PickupEventModel.deleteMany({ ngoId });
    
    // Delete messages sent by this NGO
    await MessageModel.deleteMany({ senderId: ngoId });
    
    // Delete feedback given by or about this NGO
    await FeedbackModel.deleteMany({ 
      $or: [{ reviewerId: ngoId }, { revieweeId: ngoId }]
    });
    
    // Delete notifications for this NGO
    await NotificationModel.deleteMany({ recipientId: ngoId });
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
NGOSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate refresh token
NGOSchema.methods.generateRefreshToken = function(): string {
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
NGOSchema.methods.generateVerificationToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = token;
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

// Generate password reset token
NGOSchema.methods.generatePasswordResetToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

// Clean expired refresh tokens
NGOSchema.methods.cleanExpiredTokens = function() {
  this.refreshTokens = this.refreshTokens.filter(
    (token: any) => token.expiresAt > new Date()
  );
};

// Virtual for full address
NGOSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

export type NGODocument = InferSchemaType<typeof NGOSchema> & { 
  _id: mongoose.Types.ObjectId;
  comparePassword: (password: string) => Promise<boolean>;
  generateRefreshToken: () => string;
  generateVerificationToken: () => string;
  generatePasswordResetToken: () => string;
  cleanExpiredTokens: () => void;
  fullAddress: string;
};

export const NGOModel = mongoose.model<NGODocument>('NGO', NGOSchema);
