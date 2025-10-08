import mongoose, { Schema, InferSchemaType } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ContactSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  contactPerson: { type: String, required: true },
}, { _id: false });

const AvailabilitySchema = new Schema({
  monday: { type: Boolean, default: true },
  tuesday: { type: Boolean, default: true },
  wednesday: { type: Boolean, default: true },
  thursday: { type: Boolean, default: true },
  friday: { type: Boolean, default: true },
  saturday: { type: Boolean, default: false },
  sunday: { type: Boolean, default: false },
}, { _id: false });

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

const VolunteerSchema = new Schema({
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
  
  // Volunteer specific fields
  vehicleType: { 
    type: String, 
    enum: ['bike', 'car', 'van', 'walking'], 
    default: 'bike' 
  },
  availability: { 
    type: AvailabilitySchema, 
    default: () => ({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    })
  },
  preferredTimeSlots: [{ 
    type: String, 
    enum: ['morning', 'afternoon', 'evening'],
    default: ['morning', 'afternoon']
  }],
  maxDistance: { 
    type: Number, 
    default: 10,
    min: 1,
    max: 50
  },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
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
    completedTasks: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    mealsDelivered: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    impactScore: { type: Number, default: 0 },
  },
  
  // Notification preferences
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    taskReminders: { type: Boolean, default: true },
    statusUpdates: { type: Boolean, default: true },
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
VolunteerSchema.index({ 'address.coordinates': '2dsphere' }); // For location-based queries
VolunteerSchema.index({ isActive: 1, isVerified: 1 });

// Hash password before saving
VolunteerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// CASCADE delete - remove related data when volunteer is deleted
VolunteerSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const volunteerId = this._id;
    
    // Import models (avoiding circular dependency)
    const { VolunteerTaskModel } = await import('./VolunteerTask');
    const { PickupEventModel } = await import('./PickupEvent');
    const { MessageModel } = await import('./Message');
    const { FeedbackModel } = await import('./Feedback');
    const { NotificationModel } = await import('./Notification');
    
    // Delete related volunteer tasks
    await VolunteerTaskModel.deleteMany({ volunteerId });
    
    // Delete related pickup events
    await PickupEventModel.deleteMany({ volunteerId });
    
    // Delete messages sent by this volunteer
    await MessageModel.deleteMany({ senderId: volunteerId });
    
    // Delete feedback given by or about this volunteer
    await FeedbackModel.deleteMany({ 
      $or: [{ reviewerId: volunteerId }, { revieweeId: volunteerId }]
    });
    
    // Delete notifications for this volunteer
    await NotificationModel.deleteMany({ recipientId: volunteerId });
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
VolunteerSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate refresh token
VolunteerSchema.methods.generateRefreshToken = function(): string {
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
VolunteerSchema.methods.generateVerificationToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = token;
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

// Generate password reset token
VolunteerSchema.methods.generatePasswordResetToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

// Clean expired refresh tokens
VolunteerSchema.methods.cleanExpiredTokens = function() {
  this.refreshTokens = this.refreshTokens.filter(
    (token: any) => token.expiresAt > new Date()
  );
};

// Virtual for full address
VolunteerSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

export type VolunteerDocument = InferSchemaType<typeof VolunteerSchema> & { 
  _id: mongoose.Types.ObjectId;
  comparePassword: (password: string) => Promise<boolean>;
  generateRefreshToken: () => string;
  generateVerificationToken: () => string;
  generatePasswordResetToken: () => string;
  cleanExpiredTokens: () => void;
  fullAddress: string;
};

export const VolunteerModel = mongoose.model<VolunteerDocument>('Volunteer', VolunteerSchema);
