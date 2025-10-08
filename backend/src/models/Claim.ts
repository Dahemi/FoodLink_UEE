import mongoose, { Schema, InferSchemaType } from 'mongoose';

// Distribution plan schema
const DistributionPlanSchema = new Schema({
  targetBeneficiaries: { 
    type: Number, 
    required: true,
    min: 1
  },
  distributionDate: { 
    type: Date, 
    required: true 
  },
  distributionLocation: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  distributionMethod: { 
    type: String, 
    enum: ['direct_distribution', 'meal_service', 'food_bank', 'community_kitchen'],
    required: true
  },
  specialArrangements: { 
    type: String, 
    maxlength: 500 
  }
}, { _id: false });

// Volunteer assignment schema
const VolunteerAssignmentSchema = new Schema({
  volunteerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Volunteer', 
    required: true 
  },
  assignedAt: { 
    type: Date, 
    default: Date.now 
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO', 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['pickup', 'delivery', 'both'],
    default: 'both'
  },
  status: { 
    type: String, 
    enum: ['assigned', 'accepted', 'declined', 'completed', 'cancelled'],
    default: 'assigned'
  },
  acceptedAt: { type: Date },
  declinedAt: { type: Date },
  declineReason: { type: String, maxlength: 300 },
  completedAt: { type: Date },
  notes: { type: String, maxlength: 500 }
}, { _id: false });

// Main Claim Schema
const ClaimSchema = new Schema({
  // Basic information
  donationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Donation', 
    required: true 
  },
  ngoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO', 
    required: true 
  },
  claimNumber: { 
    type: String, 
    unique: true, 
    required: true 
  }, // Auto-generated unique claim number
  
  // Claim details
  claimMessage: { 
    type: String, 
    maxlength: 1000 
  }, // Message from NGO to donor
  urgencyLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true
  },
  
  // Distribution plan
  distributionPlan: { 
    type: DistributionPlanSchema, 
    required: true 
  },
  
  // Status tracking
  status: { 
    type: String, 
    enum: [
      'pending', // Waiting for donor approval
      'approved', // Donor approved the claim
      'rejected', // Donor rejected the claim
      'volunteer_assigned', // Volunteer has been assigned
      'pickup_scheduled', // Pickup time confirmed
      'in_progress', // Pickup/delivery in progress
      'completed', // Successfully completed
      'cancelled', // Cancelled by either party
      'expired' // Claim expired
    ],
    default: 'pending'
  },
  
  // Approval/Rejection
  donorResponse: {
    status: { 
      type: String, 
      enum: ['approved', 'rejected'] 
    },
    respondedAt: { type: Date },
    message: { type: String, maxlength: 500 },
    conditions: { type: String, maxlength: 500 } // Any special conditions from donor
  },
  
  // Volunteer assignment
  volunteerAssignment: { 
    type: VolunteerAssignmentSchema 
  },
  
  // Scheduling
  scheduledPickupTime: { 
    type: Date 
  },
  confirmedPickupTime: { 
    type: Date 
  },
  actualPickupTime: { 
    type: Date 
  },
  estimatedDeliveryTime: { 
    type: Date 
  },
  actualDeliveryTime: { 
    type: Date 
  },
  
  // Communication
  lastCommunication: { 
    type: Date 
  },
  communicationCount: { 
    type: Number, 
    default: 0 
  },
  
  // Quality and feedback
  donorRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  donorFeedback: { 
    type: String, 
    maxlength: 1000 
  },
  ngoRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  ngoFeedback: { 
    type: String, 
    maxlength: 1000 
  },
  volunteerRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  volunteerFeedback: { 
    type: String, 
    maxlength: 1000 
  },
  
  // Issues and resolution
  issues: [{
    reportedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'NGO' 
    },
    issueType: { 
      type: String, 
      enum: ['quality', 'quantity', 'timing', 'location', 'communication', 'safety', 'other']
    },
    description: { type: String, maxlength: 1000 },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    reportedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['open', 'investigating', 'resolved', 'closed'],
      default: 'open'
    },
    resolution: { type: String, maxlength: 500 },
    resolvedAt: { type: Date },
    resolvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'NGO' 
    }
  }],
  
  // Cancellation
  cancellationReason: { 
    type: String,
    enum: [
      'donor_unavailable', 'ngo_unavailable', 'volunteer_unavailable',
      'food_spoiled', 'location_inaccessible', 'weather_conditions',
      'safety_concerns', 'miscommunication', 'other'
    ]
  },
  cancellationNote: { 
    type: String, 
    maxlength: 500 
  },
  cancelledBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO' 
  },
  cancelledAt: { 
    type: Date 
  },
  
  // Administrative
  priority: { 
    type: Number, 
    default: 0 
  }, // Higher number = higher priority
  tags: [{ type: String }], // For categorization and filtering
  
  // Expiry
  expiresAt: { 
    type: Date, 
    required: true 
  } // When this claim expires if not acted upon
}, { 
  timestamps: true 
});

// Indexes for performance
ClaimSchema.index({ donationId: 1 });
ClaimSchema.index({ ngoId: 1 });
ClaimSchema.index({ status: 1 });
ClaimSchema.index({ 'volunteerAssignment.volunteerId': 1 });
ClaimSchema.index({ scheduledPickupTime: 1 });
ClaimSchema.index({ expiresAt: 1 });
ClaimSchema.index({ createdAt: -1 });
// claimNumber already has unique: true, so no need to index again

// Pre-save middleware to generate claim number
ClaimSchema.pre('save', async function(next) {
  if (this.isNew && !this.claimNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.claimNumber = `CLM-${dateStr}-${randomStr}`;
  }
  next();
});

// Virtual for claim age in hours
ClaimSchema.virtual('ageInHours').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
});

// Virtual for time until expiry
ClaimSchema.virtual('hoursUntilExpiry').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
});

// Method to check if claim is still valid
ClaimSchema.methods.isValid = function(): boolean {
  return new Date() < new Date(this.expiresAt) && 
         !['completed', 'cancelled', 'expired'].includes(this.status);
};

// Method to check if claim can be assigned to volunteer
ClaimSchema.methods.canAssignVolunteer = function(): boolean {
  return ['approved', 'volunteer_assigned'].includes(this.status);
};

// Method to assign volunteer
ClaimSchema.methods.assignVolunteer = function(volunteerId: string, assignedBy: string, role: string = 'both') {
  this.volunteerAssignment = {
    volunteerId,
    assignedBy,
    role,
    status: 'assigned',
    assignedAt: new Date()
  };
  
  if (this.status === 'approved') {
    this.status = 'volunteer_assigned';
  }
};

// Method to update volunteer assignment status
ClaimSchema.methods.updateVolunteerStatus = function(status: string, notes?: string, reason?: string) {
  if (this.volunteerAssignment) {
    this.volunteerAssignment.status = status;
    this.volunteerAssignment.notes = notes || this.volunteerAssignment.notes;
    
    if (status === 'accepted') {
      this.volunteerAssignment.acceptedAt = new Date();
    } else if (status === 'declined') {
      this.volunteerAssignment.declinedAt = new Date();
      this.volunteerAssignment.declineReason = reason;
    } else if (status === 'completed') {
      this.volunteerAssignment.completedAt = new Date();
    }
  }
};

// Method to add issue
ClaimSchema.methods.addIssue = function(reportedBy: string, issueType: string, description: string, severity: string = 'medium') {
  this.issues.push({
    reportedBy,
    issueType,
    description,
    severity,
    reportedAt: new Date(),
    status: 'open'
  });
};

export type ClaimDocument = InferSchemaType<typeof ClaimSchema> & { 
  _id: mongoose.Types.ObjectId;
  ageInHours: number;
  hoursUntilExpiry: number;
  isValid: () => boolean;
  canAssignVolunteer: () => boolean;
  assignVolunteer: (volunteerId: string, assignedBy: string, role?: string) => void;
  updateVolunteerStatus: (status: string, notes?: string, reason?: string) => void;
  addIssue: (reportedBy: string, issueType: string, description: string, severity?: string) => void;
};

export const ClaimModel = mongoose.model<ClaimDocument>('Claim', ClaimSchema);
