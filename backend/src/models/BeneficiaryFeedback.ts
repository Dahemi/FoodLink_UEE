import mongoose, { Schema, InferSchemaType } from 'mongoose';

const BeneficiaryFeedbackSchema = new Schema({
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
  beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 2000, default: '' },
  anonymous: { type: Boolean, default: false }
}, { timestamps: true });

export const BeneficiaryFeedbackModel = mongoose.model('BeneficiaryFeedback', BeneficiaryFeedbackSchema);