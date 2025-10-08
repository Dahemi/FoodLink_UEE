// FoodLink Database Models
// Comprehensive models for all stakeholders and business flows

// User Management - Separate models for each stakeholder type
export { DonorModel } from './Donor';
export { NGOModel } from './NGO';
export { VolunteerModel } from './Volunteer';
export { BeneficiaryModel } from './Beneficiary';

// Donation Management
export { DonationModel } from './Donation';

// Claim Management
export { ClaimModel } from './Claim';

// Task Management
export { VolunteerTaskModel } from './VolunteerTask';

// Event Tracking
export { PickupEventModel } from './PickupEvent';

// Communication
export { MessageModel, ConversationModel } from './Message';

// Feedback System
export { FeedbackModel } from './Feedback';

// Notification System
export { NotificationModel } from './Notification';

// Legacy Task model (simple version for backward compatibility)
import mongoose, { Schema } from 'mongoose';

const LegacyTaskSchema = new Schema({
  donorInfo: {
    name: String,
    address: String,
    phone: String,
    contactPerson: String,
  },
  ngoInfo: {
    name: String,
    address: String,
    phone: String,
    contactPerson: String,
  },
  foodDetails: {
    type: String,
    quantity: String,
    expiryTime: String,
    specialInstructions: String,
  },
  pickupTime: String,
  deliveryTime: String,
  status: { 
    type: String, 
    enum: ['assigned', 'accepted', 'in_progress', 'completed', 'cancelled'], 
    default: 'assigned' 
  },
  priority: { 
    type: String, 
    enum: ['high', 'medium', 'low'], 
    default: 'low' 
  },
  distance: String,
  estimatedDuration: String,
}, { timestamps: true });

export const TaskModel = mongoose.model('LegacyTask', LegacyTaskSchema);

// Re-export for easy access
export * from './Donor';
export * from './NGO';
export * from './Volunteer';
export * from './Beneficiary';
export * from './Donation';
export * from './Claim';
export * from './VolunteerTask';
export * from './PickupEvent';
export * from './Message';
export * from './Feedback';
export * from './Notification';

/**
 * FoodLink Database Schema Overview
 * 
 * Core Entities:
 * 1. Donor, NGO, Volunteer, Beneficiary - Separate models for each stakeholder type
 * 2. Donation - Food donations posted by donors
 * 3. Claim - NGO claims on donations
 * 4. VolunteerTask - Tasks assigned to volunteers
 * 5. PickupEvent - Real-time tracking of pickup/delivery events
 * 6. Message/Conversation - Communication between stakeholders
 * 7. Feedback - Reviews and ratings system
 * 8. Notification - Push notifications and alerts
 * 
 * Key Relationships:
 * - Donor creates Donation
 * - NGO creates Claim on Donation  
 * - Claim generates VolunteerTask (assigned to Volunteer)
 * - VolunteerTask creates PickupEvent
 * - All stakeholders can have Messages, Feedback, and Notifications
 * - CASCADE delete operations ensure data integrity
 * 
 * Business Flow:
 * Donor → Donation → Claim → VolunteerTask → PickupEvent → Feedback
 *    ↓        ↓        ↓         ↓            ↓           ↓
 * Messages  Messages Messages Messages   Messages   Messages
 *    ↓        ↓        ↓         ↓            ↓           ↓
 * Notifications throughout the entire process
 */
