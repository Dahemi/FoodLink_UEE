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
    type: String, 
    required: true,
    trim: true 
  },
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
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  },
  refreshTokens: [{
    token: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  stats: {
    completedTasks: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    mealsDelivered: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    impactScore: { type: Number, default: 0 },
  }
}, { 
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete (ret as any).password;
      delete (ret as any).refreshTokens;
      return ret;
    }
  }
});

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

// Clean expired refresh tokens
VolunteerSchema.methods.cleanExpiredTokens = function() {
  this.refreshTokens = this.refreshTokens.filter(
    (token: any) => token.expiresAt > new Date()
  );
};

export type VolunteerDocument = InferSchemaType<typeof VolunteerSchema> & { 
  _id: mongoose.Types.ObjectId;
  comparePassword: (password: string) => Promise<boolean>;
  generateRefreshToken: () => string;
  cleanExpiredTokens: () => void;
};

export const VolunteerModel = mongoose.model('Volunteer', VolunteerSchema);
