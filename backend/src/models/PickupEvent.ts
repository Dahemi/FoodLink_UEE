import mongoose, { Schema, InferSchemaType } from 'mongoose';

// Location tracking schema for real-time updates
const LocationUpdateSchema = new Schema({
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  accuracy: { type: Number }, // GPS accuracy in meters
  timestamp: { type: Date, default: Date.now },
  speed: { type: Number }, // Speed in km/h
  heading: { type: Number }, // Direction in degrees
  address: { type: String } // Reverse geocoded address
}, { _id: false });

// Food condition assessment schema
const FoodConditionSchema = new Schema({
  overallCondition: { 
    type: String, 
    enum: ['excellent', 'good', 'fair', 'poor', 'unacceptable'],
    required: true
  },
  temperature: { type: Number }, // Temperature in Celsius
  appearance: { 
    type: String, 
    enum: ['fresh', 'slightly_aged', 'aged', 'spoiled']
  },
  smell: { 
    type: String, 
    enum: ['fresh', 'normal', 'slightly_off', 'bad']
  },
  packaging: { 
    type: String, 
    enum: ['intact', 'slightly_damaged', 'damaged', 'compromised']
  },
  quantity: {
    expected: { type: String, required: true },
    actual: { type: String, required: true },
    variance: { type: String } // Description of any difference
  },
  photos: [{ 
    url: { type: String, required: true },
    description: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  notes: { type: String, maxlength: 500 },
  assessedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  assessedAt: { type: Date, default: Date.now }
}, { _id: false });

// Signature schema for confirmation
const SignatureSchema = new Schema({
  signatureUrl: { type: String, required: true }, // Base64 or image URL
  signerName: { type: String, required: true },
  signerRole: { 
    type: String, 
    enum: ['donor', 'volunteer', 'ngo_representative', 'beneficiary'],
    required: true
  },
  signerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  deviceInfo: { type: String }
}, { _id: false });

// Main PickupEvent Schema
const PickupEventSchema = new Schema({
  // References
  donationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Donation', 
    required: true 
  },
  claimId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Claim', 
    required: true 
  },
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'VolunteerTask', 
    required: true 
  },
  volunteerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Volunteer', 
    required: true 
  },
  donorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Donor', 
    required: true 
  },
  ngoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO', 
    required: true 
  },
  
  // Event identification
  eventNumber: { 
    type: String, 
    unique: true, 
    required: true 
  }, // Auto-generated unique event number
  
  // Timing
  scheduledStartTime: { 
    type: Date, 
    required: true 
  },
  scheduledEndTime: { 
    type: Date, 
    required: true 
  },
  actualStartTime: { type: Date },
  actualEndTime: { type: Date },
  
  // Status tracking
  status: { 
    type: String, 
    enum: [
      'scheduled', // Event is scheduled
      'volunteer_en_route', // Volunteer is on the way
      'volunteer_arrived', // Volunteer arrived at pickup location
      'food_assessment', // Assessing food condition
      'pickup_in_progress', // Actively picking up food
      'pickup_completed', // Food successfully picked up
      'delivery_in_progress', // On the way to delivery (if applicable)
      'delivered', // Food delivered to NGO/beneficiaries
      'completed', // Event fully completed
      'cancelled', // Event cancelled
      'failed' // Event failed
    ],
    default: 'scheduled'
  },
  
  // Location tracking
  pickupLocation: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  deliveryLocation: {
    address: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  
  // Real-time location updates
  locationUpdates: [LocationUpdateSchema],
  
  // Food assessment
  foodCondition: { type: FoodConditionSchema },
  
  // Confirmations and signatures
  pickupConfirmation: {
    confirmedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Volunteer' 
    },
    confirmedAt: { type: Date },
    signature: { type: SignatureSchema },
    notes: { type: String, maxlength: 500 }
  },
  
  deliveryConfirmation: {
    confirmedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'NGO' 
    },
    confirmedAt: { type: Date },
    signature: { type: SignatureSchema },
    notes: { type: String, maxlength: 500 },
    beneficiaryCount: { type: Number } // How many people will benefit
  },
  
  // Route and logistics
  route: {
    estimatedDistance: { type: Number }, // in kilometers
    actualDistance: { type: Number }, // in kilometers
    estimatedDuration: { type: Number }, // in minutes
    actualDuration: { type: Number }, // in minutes
    routeOptimized: { type: Boolean, default: false },
    waypoints: [{ // Intermediate stops
      address: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      purpose: { type: String }, // 'fuel', 'rest', 'other_pickup', etc.
      arrivedAt: { type: Date },
      leftAt: { type: Date }
    }]
  },
  
  // Vehicle and logistics details
  vehicle: {
    type: { 
      type: String, 
      enum: ['bike', 'car', 'van', 'truck', 'walking', 'public_transport'],
      required: true
    },
    licensePlate: { type: String },
    model: { type: String },
    capacity: { type: String }, // e.g., "50 kg", "20 boxes"
    fuelUsed: { type: Number }, // in liters
    fuelCost: { type: Number },
    parkingCost: { type: Number },
    tollCost: { type: Number },
    otherExpenses: { type: Number }
  },
  
  // Weather conditions
  weather: {
    condition: { 
      type: String, 
      enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'foggy', 'snowy']
    },
    temperature: { type: Number }, // in Celsius
    humidity: { type: Number }, // percentage
    windSpeed: { type: Number }, // km/h
    impact: { 
      type: String, 
      enum: ['none', 'minor', 'moderate', 'severe']
    },
    notes: { type: String, maxlength: 300 }
  },
  
  // Issues and incidents
  incidents: [{
    type: { 
      type: String, 
      enum: [
        'traffic_delay', 'vehicle_breakdown', 'weather_delay', 'location_not_found',
        'contact_unavailable', 'food_quality_issue', 'quantity_mismatch',
        'safety_concern', 'accident', 'theft', 'other'
      ]
    },
    description: { type: String, maxlength: 1000, required: true },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    reportedAt: { type: Date, default: Date.now },
    reportedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String }
    },
    photos: [{ 
      url: { type: String },
      description: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    resolution: { type: String, maxlength: 500 },
    resolvedAt: { type: Date },
    resolvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }
  }],
  
  // Communication log
  communications: [{
    timestamp: { type: Date, default: Date.now },
    type: { 
      type: String, 
      enum: ['call', 'sms', 'in_app_message', 'email']
    },
    from: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    to: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    purpose: { 
      type: String, 
      enum: ['coordination', 'delay_notification', 'arrival_notification', 'issue_report', 'confirmation']
    },
    summary: { type: String, maxlength: 300 },
    outcome: { 
      type: String, 
      enum: ['successful', 'no_response', 'voicemail', 'busy', 'failed']
    }
  }],
  
  // Quality metrics
  metrics: {
    onTimePerformance: { type: Boolean }, // Was pickup on time?
    communicationRating: { type: Number, min: 1, max: 5 },
    professionalismRating: { type: Number, min: 1, max: 5 },
    foodHandlingRating: { type: Number, min: 1, max: 5 },
    overallRating: { type: Number, min: 1, max: 5 },
    wouldRecommend: { type: Boolean }
  },
  
  // Environmental impact
  environmentalImpact: {
    carbonFootprint: { type: Number }, // kg CO2
    fuelEfficiency: { type: Number }, // km per liter
    wasteReduced: { type: Number }, // estimated kg of food waste prevented
    mealsProvided: { type: Number }, // estimated number of meals
    peopleServed: { type: Number } // estimated number of people served
  },
  
  // Completion details
  completionNotes: { type: String, maxlength: 1000 },
  completedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // Administrative
  verificationRequired: { type: Boolean, default: false },
  verifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  verifiedAt: { type: Date },
  
  // Cancellation
  cancellationReason: { 
    type: String,
    enum: [
      'donor_cancelled', 'volunteer_unavailable', 'ngo_cancelled',
      'food_spoiled', 'weather_conditions', 'safety_concerns',
      'vehicle_issues', 'emergency', 'other'
    ]
  },
  cancellationNote: { type: String, maxlength: 500 },
  cancelledBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  cancelledAt: { type: Date }
}, { 
  timestamps: true 
});

// Indexes for performance
PickupEventSchema.index({ donationId: 1 });
PickupEventSchema.index({ volunteerId: 1 });
PickupEventSchema.index({ status: 1 });
PickupEventSchema.index({ scheduledStartTime: 1 });
// eventNumber already has unique: true, so no need to index again
PickupEventSchema.index({ createdAt: -1 });

// Pre-save middleware to generate event number
PickupEventSchema.pre('save', async function(next) {
  if (this.isNew && !this.eventNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.eventNumber = `PKP-${dateStr}-${randomStr}`;
  }
  next();
});

// Virtual for event duration
PickupEventSchema.virtual('actualDuration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    const diffMs = new Date(this.actualEndTime).getTime() - new Date(this.actualStartTime).getTime();
    return Math.floor(diffMs / (1000 * 60)); // Duration in minutes
  }
  return null;
});

// Virtual for delay calculation
PickupEventSchema.virtual('delayMinutes').get(function() {
  if (this.scheduledStartTime && this.actualStartTime) {
    const diffMs = new Date(this.actualStartTime).getTime() - new Date(this.scheduledStartTime).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60))); // Delay in minutes
  }
  return null;
});

// Method to update location
PickupEventSchema.methods.updateLocation = function(latitude: number, longitude: number, accuracy?: number, speed?: number, heading?: number) {
  this.locationUpdates.push({
    coordinates: { latitude, longitude },
    accuracy,
    speed,
    heading,
    timestamp: new Date()
  });
  
  // Keep only last 100 location updates to prevent document from growing too large
  if (this.locationUpdates.length > 100) {
    this.locationUpdates = this.locationUpdates.slice(-100);
  }
};

// Method to add incident
PickupEventSchema.methods.addIncident = function(type: string, description: string, reportedBy: string, severity: string = 'medium', location?: any) {
  this.incidents.push({
    type,
    description,
    severity,
    reportedBy,
    reportedAt: new Date(),
    location: location || null
  });
};

// Method to update status with timestamp
PickupEventSchema.methods.updateStatus = function(newStatus: string) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Set appropriate timestamps
  if (newStatus === 'volunteer_arrived' && !this.actualStartTime) {
    this.actualStartTime = new Date();
  } else if (newStatus === 'completed' && !this.actualEndTime) {
    this.actualEndTime = new Date();
  }
  
  return { oldStatus, newStatus };
};

// Method to calculate efficiency metrics
PickupEventSchema.methods.calculateEfficiency = function() {
  const metrics = {
    timeEfficiency: 0,
    routeEfficiency: 0,
    fuelEfficiency: 0,
    overallEfficiency: 0
  };
  
  // Time efficiency (actual vs estimated duration)
  if (this.route.estimatedDuration && this.actualDuration) {
    metrics.timeEfficiency = Math.min(100, (this.route.estimatedDuration / this.actualDuration) * 100);
  }
  
  // Route efficiency (actual vs estimated distance)
  if (this.route.estimatedDistance && this.route.actualDistance) {
    metrics.routeEfficiency = Math.min(100, (this.route.estimatedDistance / this.route.actualDistance) * 100);
  }
  
  // Fuel efficiency
  if (this.vehicle.fuelUsed && this.route.actualDistance) {
    metrics.fuelEfficiency = this.route.actualDistance / this.vehicle.fuelUsed; // km per liter
  }
  
  // Overall efficiency (average of available metrics)
  const availableMetrics = [metrics.timeEfficiency, metrics.routeEfficiency].filter(m => m > 0);
  if (availableMetrics.length > 0) {
    metrics.overallEfficiency = availableMetrics.reduce((sum, m) => sum + m, 0) / availableMetrics.length;
  }
  
  return metrics;
};

export type PickupEventDocument = InferSchemaType<typeof PickupEventSchema> & { 
  _id: mongoose.Types.ObjectId;
  actualDuration: number | null;
  delayMinutes: number | null;
  updateLocation: (latitude: number, longitude: number, accuracy?: number, speed?: number, heading?: number) => void;
  addIncident: (type: string, description: string, reportedBy: string, severity?: string, location?: any) => void;
  updateStatus: (newStatus: string) => { oldStatus: string; newStatus: string };
  calculateEfficiency: () => { timeEfficiency: number; routeEfficiency: number; fuelEfficiency: number; overallEfficiency: number };
};

export const PickupEventModel = mongoose.model<PickupEventDocument>('PickupEvent', PickupEventSchema);
