import mongoose, { Schema, InferSchemaType } from 'mongoose';

// Simplified food details schema matching frontend
const FoodDetailsSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['cooked_meal', 'raw_ingredients', 'packaged_food'],
    },
    category: {
      type: String,
      required: true,
      enum: ['vegetarian', 'non_vegetarian', 'vegan'],
    },
    quantity: {
      type: String,
      required: true,
    },
    estimatedServings: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    ingredients: [{ type: String }],
    allergens: [{ type: String }],
    storageInstructions: { type: String },
  },
  { _id: false }
);

// Simplified pickup schedule matching frontend
const PickupScheduleSchema = new Schema(
  {
    availableFrom: {
      type: Date,
    },
    availableUntil: {
      type: Date,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    specialInstructions: { type: String, maxlength: 500 },
  },
  { _id: false }
);

// Simplified location schema
const LocationSchema = new Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
  },
  { _id: false }
);

// Main Donation Schema - simplified to match frontend
const DonationSchema = new Schema(
  {
    // Basic information
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },

    // Food details
    foodDetails: {
      type: FoodDetailsSchema,
      required: true,
    },

    // Images (optional)
    images: [
      {
        url: { type: String, required: true },
        caption: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // Timing
    expiryDateTime: {
      type: Date,
      required: true,
    },
    preparedDateTime: {
      type: Date,
    },

    // Pickup details
    pickupLocation: {
      type: LocationSchema,
      required: true,
    },
    pickupSchedule: {
      type: PickupScheduleSchema,
      required: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: [
        'available',
        'claimed',
        'pickup_scheduled',
        'picked_up',
        'delivered',
        'expired',
        'cancelled',
      ],
      default: 'available',
    },
    views: {
      type: Number,
      default: 0,
    },

    // Claim information
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NGO',
    },
    claimedAt: {
      type: Date,
    },

    // Completion tracking
    actualPickupTime: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },

    // Feedback
    donorRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    donorFeedback: {
      type: String,
      maxlength: 1000,
    },

    // Administrative
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'approved',
    },
    moderationNotes: {
      type: String,
    },

    // Cancellation
    cancellationReason: {
      type: String,
      enum: [
        'expired',
        'no_longer_available',
        'quality_issues',
        'claimed_elsewhere',
        'donor_unavailable',
        'other',
      ],
    },
    cancelledAt: {
      type: Date,
    },

    // Interested NGOs
    interestedNGOs: [
      {
        ngoId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'NGO',
        },
        message: { type: String, maxlength: 500 },
        interestedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
DonationSchema.index({ donorId: 1 });
DonationSchema.index({ status: 1, expiryDateTime: 1 });
DonationSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
DonationSchema.index({ createdAt: -1 });

// Virtual for hours until expiry
DonationSchema.virtual('hoursUntilExpiry').get(function () {
  if (!this.expiryDateTime) return null;
  const now = new Date();
  const expiry = new Date(this.expiryDateTime);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
});

// Virtual for urgency level
DonationSchema.virtual('urgencyLevel').get(function () {
  const hours = this.hoursUntilExpiry;
  if (hours === null) return 'unknown';
  if (hours <= 2) return 'urgent';
  if (hours <= 6) return 'high';
  if (hours <= 12) return 'medium';
  return 'low';
});

// Method to check if donation is available
DonationSchema.methods.isAvailable = function (): boolean {
  return (
    this.status === 'available' && new Date(this.expiryDateTime) > new Date()
  );
};

// Method to check if can be claimed
DonationSchema.methods.canBeClaimedBy = function (
  ngoId: string,
  ngoRating: number = 0,
  isVerified: boolean = false
): boolean {
  if (!this.isAvailable()) return false;

  // Already claimed by someone else
  if (this.claimedBy && this.claimedBy.toString() !== ngoId) {
    return false;
  }

  return true;
};

// Method to add interested NGO
DonationSchema.methods.addInterestedNGO = function (
  ngoId: string,
  message?: string
) {
  const existing = this.interestedNGOs.find(
    (i: any) => i.ngoId.toString() === ngoId
  );
  if (!existing) {
    this.interestedNGOs.push({
      ngoId,
      message: message || '',
      interestedAt: new Date(),
    });
  }
};

export type DonationDocument = InferSchemaType<typeof DonationSchema> & {
  _id: mongoose.Types.ObjectId;
  hoursUntilExpiry: number | null;
  urgencyLevel: string;
  isAvailable: () => boolean;
  canBeClaimedBy: (
    ngoId: string,
    ngoRating: number,
    isVerified: boolean
  ) => boolean;
  addInterestedNGO: (ngoId: string, message?: string) => void;
};

export const DonationModel = mongoose.model<DonationDocument>(
  'Donation',
  DonationSchema
);
