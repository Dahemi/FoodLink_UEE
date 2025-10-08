import mongoose, { Schema, InferSchemaType } from 'mongoose';

// Food details schema
const FoodDetailsSchema = new Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['cooked_meal', 'raw_ingredients', 'packaged_food', 'beverages', 'dairy', 'bakery', 'fruits_vegetables', 'other']
  },
  category: { 
    type: String, 
    required: true,
    enum: ['vegetarian', 'non_vegetarian', 'vegan', 'halal', 'kosher', 'mixed']
  },
  quantity: { 
    type: String, 
    required: true 
  }, // e.g., "50 servings", "10 kg", "20 boxes"
  estimatedServings: { 
    type: Number, 
    required: true,
    min: 1
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  ingredients: [{ type: String }], // List of main ingredients
  allergens: [{ 
    type: String,
    enum: ['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'shellfish', 'fish', 'sesame']
  }],
  nutritionalInfo: {
    calories: { type: Number },
    protein: { type: Number },
    carbs: { type: Number },
    fat: { type: Number }
  },
  storageRequirements: { 
    type: String,
    enum: ['room_temperature', 'refrigerated', 'frozen'],
    default: 'room_temperature'
  }
}, { _id: false });

// Pickup schedule schema
const PickupScheduleSchema = new Schema({
  preferredDate: { type: Date, required: true },
  preferredTimeStart: { type: String, required: true }, // "14:00"
  preferredTimeEnd: { type: String, required: true }, // "16:00"
  flexibleTiming: { type: Boolean, default: false },
  urgency: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  specialInstructions: { type: String, maxlength: 500 }
}, { _id: false });

// Location schema
const LocationSchema = new Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  landmark: { type: String }, // Nearby landmark for easier finding
  accessInstructions: { type: String, maxlength: 300 } // How to access the location
}, { _id: false });

// Main Donation Schema
const DonationSchema = new Schema({
  // Basic information
  donorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Donor', 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  
  // Food details
  foodDetails: { 
    type: FoodDetailsSchema, 
    required: true 
  },
  
  // Images
  images: [{ 
    url: { type: String, required: true },
    caption: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Timing
  expiryDateTime: { 
    type: Date, 
    required: true 
  },
  preparedDateTime: { 
    type: Date 
  }, // When the food was prepared
  
  // Pickup details
  pickupLocation: { 
    type: LocationSchema, 
    required: true 
  },
  pickupSchedule: { 
    type: PickupScheduleSchema, 
    required: true 
  },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['available', 'claimed', 'pickup_scheduled', 'picked_up', 'delivered', 'expired', 'cancelled'],
    default: 'available'
  },
  
  // Visibility and restrictions
  isPublic: { 
    type: Boolean, 
    default: true 
  }, // Whether visible to all NGOs or specific ones
  restrictedToNGOs: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO' 
  }], // If not public, which NGOs can see it
  
  // Requirements
  minimumNGORating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  requiresVerifiedNGO: { 
    type: Boolean, 
    default: false 
  },
  
  // Tracking
  viewCount: { 
    type: Number, 
    default: 0 
  },
  interestedNGOs: [{ 
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },
    interestedAt: { type: Date, default: Date.now },
    message: { type: String, maxlength: 500 }
  }],
  
  // Claim information (populated when claimed)
  claimedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO' 
  },
  claimedAt: { 
    type: Date 
  },
  
  // Completion tracking
  actualPickupTime: { 
    type: Date 
  },
  deliveredAt: { 
    type: Date 
  },
  
  // Quality and feedback
  donorRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  }, // NGO rates the donor
  donorFeedback: { 
    type: String, 
    maxlength: 1000 
  },
  
  // Administrative
  moderationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved'
  },
  moderationNotes: { 
    type: String 
  },
  
  // Cancellation
  cancellationReason: { 
    type: String,
    enum: ['expired', 'no_longer_available', 'quality_issues', 'donor_cancelled', 'ngo_cancelled', 'other']
  },
  cancellationNote: { 
    type: String, 
    maxlength: 500 
  },
  cancelledBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Donor' 
  },
  cancelledAt: { 
    type: Date 
  }
}, { 
  timestamps: true 
});

// Indexes for performance
DonationSchema.index({ donorId: 1 });
DonationSchema.index({ status: 1 });
DonationSchema.index({ 'pickupLocation.coordinates': '2dsphere' }); // For location-based queries
DonationSchema.index({ expiryDateTime: 1 });
DonationSchema.index({ createdAt: -1 }); // For recent donations
DonationSchema.index({ claimedBy: 1 });
DonationSchema.index({ 'foodDetails.type': 1 });
DonationSchema.index({ 'foodDetails.category': 1 });
DonationSchema.index({ isPublic: 1, status: 1 });

// Virtual for time until expiry
DonationSchema.virtual('hoursUntilExpiry').get(function() {
  if (!this.expiryDateTime) return null;
  const now = new Date();
  const expiry = new Date(this.expiryDateTime);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60))); // Hours
});

// Virtual for urgency level based on expiry
DonationSchema.virtual('urgencyLevel').get(function() {
  const hoursLeft = this.hoursUntilExpiry;
  if (hoursLeft === null) return 'unknown';
  if (hoursLeft <= 2) return 'urgent';
  if (hoursLeft <= 6) return 'high';
  if (hoursLeft <= 24) return 'medium';
  return 'low';
});

// Method to check if donation is still available
DonationSchema.methods.isAvailable = function(): boolean {
  return this.status === 'available' && new Date() < new Date(this.expiryDateTime);
};

// Method to check if NGO can claim this donation
DonationSchema.methods.canBeClaimedBy = function(ngoId: string, ngoRating: number, isVerified: boolean): boolean {
  if (!this.isAvailable()) return false;
  
  // Check rating requirement
  if (this.minimumNGORating > 0 && ngoRating < this.minimumNGORating) return false;
  
  // Check verification requirement
  if (this.requiresVerifiedNGO && !isVerified) return false;
  
  // Check if restricted to specific NGOs
  if (!this.isPublic && this.restrictedToNGOs.length > 0) {
    return this.restrictedToNGOs.some(id => id.toString() === ngoId);
  }
  
  return true;
};

// Method to add interested NGO
DonationSchema.methods.addInterestedNGO = function(ngoId: string, message?: string) {
  // Check if NGO is already interested
  const existingIndex = this.interestedNGOs.findIndex(
    (interested: any) => interested.ngoId.toString() === ngoId
  );
  
  if (existingIndex === -1) {
    this.interestedNGOs.push({
      ngoId,
      message: message || '',
      interestedAt: new Date()
    });
  }
};

export type DonationDocument = InferSchemaType<typeof DonationSchema> & { 
  _id: mongoose.Types.ObjectId;
  hoursUntilExpiry: number | null;
  urgencyLevel: string;
  isAvailable: () => boolean;
  canBeClaimedBy: (ngoId: string, ngoRating: number, isVerified: boolean) => boolean;
  addInterestedNGO: (ngoId: string, message?: string) => void;
};

export const DonationModel = mongoose.model<DonationDocument>('Donation', DonationSchema);
