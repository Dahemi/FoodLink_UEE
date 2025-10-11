import mongoose, { Schema, InferSchemaType } from 'mongoose';

const NGORequirementSchema = new Schema({
  ngoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO', 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  foodType: { 
    type: String, 
    enum: ['cooked_meal', 'raw_ingredients', 'packaged_food', 'beverages', 'dairy', 'bakery', 'fruits_vegetables', 'other'],
    required: true 
  },
  category: { 
    type: String, 
    enum: ['vegetarian', 'non_vegetarian', 'vegan', 'halal', 'kosher', 'mixed'],
    required: true 
  },
  quantity: { 
    type: String, 
    required: true 
  },
  estimatedServings: { 
    type: Number, 
    required: true,
    min: 1
  },
  urgency: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  neededBy: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  beneficiaryCount: { 
    type: Number, 
    required: true,
    min: 1
  },
  specialInstructions: { 
    type: String, 
    maxlength: 500 
  },
  images: [{ 
    url: { type: String },
    caption: { type: String }
  }],
  verificationDocuments: [{ 
    url: { type: String, required: true },
    type: { type: String, enum: ['registration', 'certification', 'permit', 'other'] },
    name: { type: String, required: true }
  }],
  tags: [{ type: String }],
  location: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  status: { 
    type: String, 
    enum: ['open', 'partially_fulfilled', 'fulfilled', 'cancelled'],
    default: 'open'
  }
}, { 
  timestamps: true 
});

// Indexes
NGORequirementSchema.index({ ngoId: 1 });
NGORequirementSchema.index({ urgency: 1 });
NGORequirementSchema.index({ neededBy: 1 });
NGORequirementSchema.index({ status: 1 });
NGORequirementSchema.index({ 'location.coordinates': '2dsphere' });

export type NGORequirementDocument = InferSchemaType<typeof NGORequirementSchema> & { 
  _id: mongoose.Types.ObjectId;
};

export const NGORequirementModel = mongoose.model<NGORequirementDocument>('NGORequirement', NGORequirementSchema);