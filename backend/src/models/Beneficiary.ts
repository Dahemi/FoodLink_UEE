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

const BeneficiarySchema = new Schema({
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
  
  // Beneficiary specific fields
  householdSize: { type: Number, default: 1, min: 1 },
  dietaryRestrictions: [{ 
    type: String, 
    enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'dairy-free', 'nut-free'] 
  }],
  preferredNGOs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NGO' }],
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
  },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  
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
    totalMealsReceived: { type: Number, default: 0 },
    totalPickups: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalInteractions: { type: Number, default: 0 },
  },
  
  // Notification preferences
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    mealAlerts: { type: Boolean, default: true },
    distributionUpdates: { type: Boolean, default: true },
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
BeneficiarySchema.index({ verificationStatus: 1 });
BeneficiarySchema.index({ 'address.coordinates': '2dsphere' }); // For location-based queries
BeneficiarySchema.index({ isActive: 1, isVerified: 1 });

// Hash password before saving
BeneficiarySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// CASCADE delete - remove related data when beneficiary is deleted
BeneficiarySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const beneficiaryId = this._id;
    
    // Import models (avoiding circular dependency)
    const { MessageModel } = await import('./Message');
    const { FeedbackModel } = await import('./Feedback');
    const { NotificationModel } = await import('./Notification');
    
    // Delete messages sent by this beneficiary
    await MessageModel.deleteMany({ senderId: beneficiaryId });
    
    // Delete feedback given by or about this beneficiary
    await FeedbackModel.deleteMany({ 
      $or: [{ reviewerId: beneficiaryId }, { revieweeId: beneficiaryId }]
    });
    
    // Delete notifications for this beneficiary
    await NotificationModel.deleteMany({ recipientId: beneficiaryId });
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
BeneficiarySchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate refresh token
BeneficiarySchema.methods.generateRefreshToken = function(): string {
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
BeneficiarySchema.methods.generateVerificationToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = token;
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

// Generate password reset token
BeneficiarySchema.methods.generatePasswordResetToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

// Clean expired refresh tokens
BeneficiarySchema.methods.cleanExpiredTokens = function() {
  this.refreshTokens = this.refreshTokens.filter(
    (token: any) => token.expiresAt > new Date()
  );
};

// Virtual for full address
BeneficiarySchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

export type BeneficiaryDocument = InferSchemaType<typeof BeneficiarySchema> & { 
  _id: mongoose.Types.ObjectId;
  comparePassword: (password: string) => Promise<boolean>;
  generateRefreshToken: () => string;
  generateVerificationToken: () => string;
  generatePasswordResetToken: () => string;
  cleanExpiredTokens: () => void;
  fullAddress: string;
};

export const BeneficiaryModel = mongoose.model<BeneficiaryDocument>('Beneficiary', BeneficiarySchema);
