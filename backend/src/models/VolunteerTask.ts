import mongoose, { Schema, InferSchemaType } from 'mongoose';

// Location schema for pickup and delivery
const TaskLocationSchema = new Schema({
  address: { type: String, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  contactPerson: { type: String, required: true },
  contactPhone: { type: String, required: true },
  accessInstructions: { type: String, maxlength: 300 },
  landmark: { type: String }
}, { _id: false });

// Time tracking schema
const TimeTrackingSchema = new Schema({
  scheduledTime: { type: Date, required: true },
  estimatedDuration: { type: Number }, // in minutes
  actualStartTime: { type: Date },
  actualEndTime: { type: Date },
  actualDuration: { type: Number }, // in minutes
  delays: [{
    reason: { 
      type: String, 
      enum: ['traffic', 'weather', 'location_issues', 'contact_unavailable', 'vehicle_issues', 'other']
    },
    delayMinutes: { type: Number },
    description: { type: String, maxlength: 300 },
    reportedAt: { type: Date, default: Date.now }
  }]
}, { _id: false });

// Task evidence schema (photos, signatures, etc.)
const EvidenceSchema = new Schema({
  type: { 
    type: String, 
    enum: ['pickup_photo', 'delivery_photo', 'signature', 'condition_photo', 'issue_photo'],
    required: true
  },
  url: { type: String, required: true },
  description: { type: String, maxlength: 200 },
  timestamp: { type: Date, default: Date.now },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
}, { _id: false });

// Main VolunteerTask Schema
const VolunteerTaskSchema = new Schema({
  // References
  claimId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Claim', 
    required: true 
  },
  donationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Donation', 
    required: true 
  },
  volunteerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Volunteer', 
    required: true 
  },
  ngoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO', 
    required: true 
  },
  donorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Donor', 
    required: true 
  },
  
  // Task identification
  taskNumber: { 
    type: String, 
    unique: true, 
    required: true 
  }, // Auto-generated unique task number
  
  // Task type and details
  taskType: { 
    type: String, 
    enum: ['pickup_only', 'delivery_only', 'pickup_and_delivery'],
    required: true
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true
  },
  
  // Locations
  pickupLocation: { 
    type: TaskLocationSchema, 
    required: true 
  },
  deliveryLocation: { 
    type: TaskLocationSchema 
  }, // Optional for pickup_only tasks
  
  // Time tracking
  pickupSchedule: { 
    type: TimeTrackingSchema, 
    required: true 
  },
  deliverySchedule: { 
    type: TimeTrackingSchema 
  }, // Optional for pickup_only tasks
  
  // Food details (copied from donation for quick access)
  foodDetails: {
    type: { type: String, required: true },
    quantity: { type: String, required: true },
    estimatedServings: { type: Number, required: true },
    storageRequirements: { type: String, required: true },
    expiryDateTime: { type: Date, required: true },
    specialInstructions: { type: String }
  },
  
  // Status tracking
  status: { 
    type: String, 
    enum: [
      'assigned', // Task assigned to volunteer
      'accepted', // Volunteer accepted the task
      'declined', // Volunteer declined the task
      'en_route_pickup', // Volunteer is on the way to pickup
      'at_pickup', // Volunteer arrived at pickup location
      'pickup_completed', // Food picked up successfully
      'en_route_delivery', // On the way to delivery (if applicable)
      'at_delivery', // Arrived at delivery location
      'completed', // Task fully completed
      'cancelled', // Task cancelled
      'failed' // Task failed for some reason
    ],
    default: 'assigned'
  },
  
  // Assignment details
  assignedAt: { 
    type: Date, 
    default: Date.now 
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO', 
    required: true 
  },
  acceptedAt: { type: Date },
  declinedAt: { type: Date },
  declineReason: { type: String, maxlength: 500 },
  
  // Completion details
  completedAt: { type: Date },
  
  // Evidence and verification
  evidence: [EvidenceSchema],
  
  // Distance and route
  estimatedDistance: { type: Number }, // in kilometers
  actualDistance: { type: Number }, // in kilometers
  routeOptimized: { type: Boolean, default: false },
  
  // Vehicle and logistics
  vehicleUsed: { 
    type: String, 
    enum: ['bike', 'car', 'van', 'walking', 'public_transport', 'other']
  },
  fuelCost: { type: Number }, // Volunteer can report fuel costs
  parkingCost: { type: Number },
  otherExpenses: { type: Number },
  
  // Communication
  communicationLog: [{
    timestamp: { type: Date, default: Date.now },
    type: { 
      type: String, 
      enum: ['call', 'sms', 'in_app_message', 'email', 'other']
    },
    with: { 
      type: String, 
      enum: ['donor', 'ngo', 'beneficiary', 'admin']
    },
    summary: { type: String, maxlength: 300 },
    outcome: { 
      type: String, 
      enum: ['successful', 'no_response', 'rescheduled', 'issue_reported']
    }
  }],
  
  // Issues and problems
  issues: [{
    type: { 
      type: String, 
      enum: ['location_not_found', 'contact_unavailable', 'food_quality', 'quantity_mismatch', 'vehicle_breakdown', 'weather', 'safety', 'other']
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
      enum: ['open', 'investigating', 'resolved', 'escalated'],
      default: 'open'
    },
    resolution: { type: String, maxlength: 500 },
    resolvedAt: { type: Date }
  }],
  
  // Ratings and feedback
  volunteerRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  }, // NGO rates volunteer
  volunteerFeedback: { 
    type: String, 
    maxlength: 1000 
  },
  donorRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  }, // Volunteer rates donor
  donorFeedback: { 
    type: String, 
    maxlength: 1000 
  },
  ngoRating: { 
    type: Number, 
    min: 1, 
    max: 5 
  }, // Volunteer rates NGO
  ngoFeedback: { 
    type: String, 
    maxlength: 1000 
  },
  
  // Rescheduling
  rescheduleHistory: [{
    originalTime: { type: Date, required: true },
    newTime: { type: Date, required: true },
    reason: { type: String, maxlength: 300 },
    requestedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Volunteer' 
    },
    approvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'NGO' 
    },
    rescheduledAt: { type: Date, default: Date.now }
  }],
  
  // Cancellation
  cancellationReason: { 
    type: String,
    enum: [
      'volunteer_unavailable', 'donor_unavailable', 'ngo_unavailable',
      'food_spoiled', 'weather_conditions', 'vehicle_issues',
      'safety_concerns', 'location_inaccessible', 'other'
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
  tags: [{ type: String }], // For categorization
  notes: { type: String, maxlength: 1000 }, // Internal notes
  
  // Notifications
  notificationsSent: [{
    type: { 
      type: String, 
      enum: ['assignment', 'reminder', 'status_update', 'completion', 'cancellation']
    },
    sentAt: { type: Date, default: Date.now },
    recipient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    channel: { 
      type: String, 
      enum: ['push', 'email', 'sms']
    },
    status: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'failed']
    }
  }]
}, { 
  timestamps: true 
});

// Indexes for performance
VolunteerTaskSchema.index({ volunteerId: 1 });
VolunteerTaskSchema.index({ claimId: 1 });
VolunteerTaskSchema.index({ donationId: 1 });
VolunteerTaskSchema.index({ ngoId: 1 });
VolunteerTaskSchema.index({ status: 1 });
VolunteerTaskSchema.index({ 'pickupSchedule.scheduledTime': 1 });
VolunteerTaskSchema.index({ priority: 1, status: 1 });
// taskNumber already has unique: true, so no need to index again
VolunteerTaskSchema.index({ createdAt: -1 });

// Pre-save middleware to generate task number
VolunteerTaskSchema.pre('save', async function(next) {
  if (this.isNew && !this.taskNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.taskNumber = `TSK-${dateStr}-${randomStr}`;
  }
  next();
});

// Virtual for task duration
VolunteerTaskSchema.virtual('totalDuration').get(function() {
  let total = 0;
  if (this.pickupSchedule?.actualDuration) {
    total += this.pickupSchedule.actualDuration;
  }
  if (this.deliverySchedule?.actualDuration) {
    total += this.deliverySchedule.actualDuration;
  }
  return total;
});

// Virtual for task age
VolunteerTaskSchema.virtual('ageInHours').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
});

// Method to check if task is overdue
VolunteerTaskSchema.methods.isOverdue = function(): boolean {
  if (!this.pickupSchedule?.scheduledTime) return false;
  return new Date() > new Date(this.pickupSchedule.scheduledTime) && 
         !['completed', 'cancelled', 'failed'].includes(this.status);
};

// Method to update status with timestamp
VolunteerTaskSchema.methods.updateStatus = function(newStatus: string) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Set appropriate timestamps
  if (newStatus === 'accepted') {
    this.acceptedAt = new Date();
  } else if (newStatus === 'declined') {
    this.declinedAt = new Date();
  } else if (newStatus === 'completed') {
    this.completedAt = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
  }
  
  return { oldStatus, newStatus };
};

// Method to add evidence
VolunteerTaskSchema.methods.addEvidence = function(type: string, url: string, description?: string, location?: any) {
  this.evidence.push({
    type,
    url,
    description: description || '',
    timestamp: new Date(),
    location: location || null
  });
};

// Method to add issue
VolunteerTaskSchema.methods.addIssue = function(type: string, description: string, severity: string = 'medium') {
  this.issues.push({
    type,
    description,
    severity,
    reportedAt: new Date(),
    status: 'open'
  });
};

// Method to calculate estimated completion time
VolunteerTaskSchema.methods.getEstimatedCompletionTime = function(): Date | null {
  if (!this.pickupSchedule?.scheduledTime) return null;
  
  let totalMinutes = this.pickupSchedule.estimatedDuration || 30; // Default 30 min for pickup
  
  if (this.deliverySchedule?.estimatedDuration) {
    totalMinutes += this.deliverySchedule.estimatedDuration;
  }
  
  // Add travel time estimate (rough calculation)
  if (this.estimatedDistance) {
    const travelMinutes = this.estimatedDistance * 3; // Assume 3 minutes per km
    totalMinutes += travelMinutes;
  }
  
  const startTime = new Date(this.pickupSchedule.scheduledTime);
  return new Date(startTime.getTime() + totalMinutes * 60000);
};

export type VolunteerTaskDocument = InferSchemaType<typeof VolunteerTaskSchema> & { 
  _id: mongoose.Types.ObjectId;
  totalDuration: number;
  ageInHours: number;
  isOverdue: () => boolean;
  updateStatus: (newStatus: string) => { oldStatus: string; newStatus: string };
  addEvidence: (type: string, url: string, description?: string, location?: any) => void;
  addIssue: (type: string, description: string, severity?: string) => void;
  getEstimatedCompletionTime: () => Date | null;
};

export const VolunteerTaskModel = mongoose.model<VolunteerTaskDocument>('VolunteerTask', VolunteerTaskSchema);
