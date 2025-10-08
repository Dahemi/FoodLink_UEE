import mongoose, { Schema, InferSchemaType } from 'mongoose';

const ContactSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  contactPerson: { type: String, required: true },
}, { _id: false });

const FoodDetailsSchema = new Schema({
  type: { type: String, required: true },
  quantity: { type: String, required: true },
  expiryTime: { type: String, required: true },
  specialInstructions: { type: String },
}, { _id: false });

const TaskSchema = new Schema({
  donorInfo: { type: ContactSchema, required: true },
  ngoInfo: { type: ContactSchema, required: true },
  foodDetails: { type: FoodDetailsSchema, required: true },
  pickupTime: { type: String, required: true },
  deliveryTime: { type: String, required: true },
  status: { type: String, enum: ['assigned', 'accepted', 'in_progress', 'completed', 'cancelled'], default: 'assigned' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
  distance: { type: String },
  estimatedDuration: { type: String },
}, { timestamps: true });

export type TaskDocument = InferSchemaType<typeof TaskSchema> & { _id: mongoose.Types.ObjectId };

export const TaskModel = mongoose.model('VolunteerTask', TaskSchema);


