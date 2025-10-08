import { z } from 'zod';

// Common schemas
export const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().default('Sri Lanka'),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Volunteer schemas
export const volunteerRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().min(10),
  address: addressSchema,
  vehicleType: z.enum(['bike', 'car', 'van', 'walking']).optional(),
  availability: z.object({
    monday: z.boolean().optional(),
    tuesday: z.boolean().optional(),
    wednesday: z.boolean().optional(),
    thursday: z.boolean().optional(),
    friday: z.boolean().optional(),
    saturday: z.boolean().optional(),
    sunday: z.boolean().optional(),
  }).optional(),
  preferredTimeSlots: z.array(z.enum(['morning', 'afternoon', 'evening'])).optional(),
  maxDistance: z.number().min(1).max(50).optional(),
});

export const volunteerUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  address: addressSchema.optional(),
  vehicleType: z.enum(['bike', 'car', 'van', 'walking']).optional(),
  availability: z.object({
    monday: z.boolean().optional(),
    tuesday: z.boolean().optional(),
    wednesday: z.boolean().optional(),
    thursday: z.boolean().optional(),
    friday: z.boolean().optional(),
    saturday: z.boolean().optional(),
    sunday: z.boolean().optional(),
  }).optional(),
  preferredTimeSlots: z.array(z.enum(['morning', 'afternoon', 'evening'])).optional(),
  maxDistance: z.number().min(1).max(50).optional(),
});

// Donor schemas
export const donorRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().min(10),
  address: addressSchema,
  donorType: z.enum(['individual', 'restaurant', 'hotel', 'catering', 'grocery', 'bakery', 'other']),
  businessName: z.string().optional(),
  businessLicense: z.string().optional(),
  averageDonationFrequency: z.enum(['daily', 'weekly', 'monthly', 'occasional']).optional(),
  preferredPickupTimes: z.array(z.string()).optional(),
  specialInstructions: z.string().max(500).optional(),
});

export const donorUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  address: addressSchema.optional(),
  businessName: z.string().optional(),
  businessLicense: z.string().optional(),
  averageDonationFrequency: z.enum(['daily', 'weekly', 'monthly', 'occasional']).optional(),
  preferredPickupTimes: z.array(z.string()).optional(),
  specialInstructions: z.string().max(500).optional(),
});

// NGO schemas
export const ngoRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().min(10),
  address: addressSchema,
  registrationNumber: z.string().min(1),
  organizationType: z.enum(['charity', 'ngo', 'religious', 'community', 'government']),
  servingAreas: z.array(z.string()).optional(),
  capacity: z.number().min(1).optional(),
  operatingHours: z.object({
    start: z.string().default('09:00'),
    end: z.string().default('17:00')
  }).optional(),
  certifications: z.array(z.string()).optional(),
  website: z.string().url().optional(),
  description: z.string().max(1000).optional(),
});

export const ngoUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  address: addressSchema.optional(),
  servingAreas: z.array(z.string()).optional(),
  capacity: z.number().min(1).optional(),
  operatingHours: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  certifications: z.array(z.string()).optional(),
  website: z.string().url().optional(),
  description: z.string().max(1000).optional(),
});

// Beneficiary schemas
export const beneficiaryRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().min(10),
  address: addressSchema,
  householdSize: z.number().min(1).optional(),
  dietaryRestrictions: z.array(z.enum(['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'dairy-free', 'nut-free'])).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional(),
});

export const beneficiaryUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  address: addressSchema.optional(),
  householdSize: z.number().min(1).optional(),
  dietaryRestrictions: z.array(z.enum(['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'dairy-free', 'nut-free'])).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional(),
});

// Donation schemas
export const donationCreateSchema = z.object({
  title: z.string().min(1).max(100),
  foodDetails: z.object({
    type: z.enum(['cooked_meal', 'raw_ingredients', 'packaged_food', 'beverages', 'dairy', 'bakery', 'fruits_vegetables', 'other']),
    category: z.enum(['vegetarian', 'non_vegetarian', 'vegan', 'halal', 'kosher', 'mixed']),
    quantity: z.string().min(1),
    estimatedServings: z.number().min(1),
    description: z.string().min(1).max(1000),
    ingredients: z.array(z.string()).optional(),
    allergens: z.array(z.enum(['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'shellfish', 'fish', 'sesame'])).optional(),
    storageRequirements: z.enum(['room_temperature', 'refrigerated', 'frozen']).optional(),
  }),
  expiryDateTime: z.string().datetime(),
  pickupLocation: z.object({
    address: z.string().min(1),
    coordinates: coordinatesSchema,
    landmark: z.string().optional(),
    accessInstructions: z.string().max(300).optional(),
  }),
  pickupSchedule: z.object({
    preferredDate: z.string().datetime(),
    preferredTimeStart: z.string(),
    preferredTimeEnd: z.string(),
    flexibleTiming: z.boolean().optional(),
    urgency: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    specialInstructions: z.string().max(500).optional(),
  }),
  images: z.array(z.object({
    url: z.string().url(),
    caption: z.string().optional(),
    isPrimary: z.boolean().optional(),
  })).optional(),
});

// Task schemas
export const taskUpdateStatusSchema = z.object({
  status: z.enum(['assigned', 'accepted', 'declined', 'en_route_pickup', 'at_pickup', 'pickup_completed', 'en_route_delivery', 'at_delivery', 'completed', 'cancelled', 'failed']),
});

export const taskRescheduleSchema = z.object({
  pickupTime: z.string().datetime(),
  deliveryTime: z.string().datetime().optional(),
  reason: z.string().max(300).optional(),
});

// Feedback schemas
export const feedbackCreateSchema = z.object({
  revieweeId: z.string(),
  feedbackType: z.enum([
    'donor_to_volunteer', 'donor_to_ngo',
    'volunteer_to_donor', 'volunteer_to_ngo',
    'ngo_to_donor', 'ngo_to_volunteer',
    'beneficiary_to_ngo', 'beneficiary_to_volunteer'
  ]),
  overallRating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
  wouldRecommend: z.boolean().optional(),
});

// Message schemas
export const messageCreateSchema = z.object({
  conversationId: z.string(),
  content: z.string().max(2000),
  messageType: z.enum(['text', 'image', 'document', 'audio', 'video', 'location']).optional(),
  contextType: z.enum(['donation', 'claim', 'task', 'general', 'support']),
  contextId: z.string().optional(),
});
