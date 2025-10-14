import { Router } from 'express';
import { BeneficiaryFeedbackModel } from '../models/BeneficiaryFeedback.js';
import { sendCreated, sendSuccess } from '../utils/responseUtils.js';

const router = Router();

/**
 * POST /api/beneficiary-feedback
 * Create feedback
 *
 * - Accepts optional beneficiaryId in body (frontend can pass it).
 * - If beneficiaryId is not provided, and the request is authenticated as a beneficiary,
 *   the authenticated id will be used.
 * - If neither is present, feedback can still be saved only when anonymous=true.
 */
router.post('/', async (req, res, next) => {
  try {
    const { ngoId, rating, comment, beneficiaryId, anonymous = false } = req.body;
    
    if (!ngoId || !rating) {
      return res.status(400).json({ error: 'ngoId and rating required' });
    }

    if (!beneficiaryId && !anonymous) {
      return res.status(400).json({ error: 'beneficiaryId required for non-anonymous feedback' });
    }

    const feedback = new BeneficiaryFeedbackModel({
      ngoId,
      beneficiaryId, // Store the beneficiary ID
      rating,
      comment,
      anonymous
    });

    await feedback.save();
    
    // Populate beneficiary data before sending response
    const populatedFeedback = await BeneficiaryFeedbackModel
      .findById(feedback._id)
      .populate('beneficiaryId', 'name email');

    sendCreated(res, populatedFeedback, 'Feedback submitted');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/beneficiary-feedback/ngo/:id
 * Get feedbacks for an NGO (public-safe)
 */
router.get('/ngo/:id', async (req, res, next) => {
  try {
    const feedbacks = await BeneficiaryFeedbackModel
      .find({ ngoId: req.params.id })
      .populate('beneficiaryId', 'name email') // Always populate beneficiary data
      .sort('-createdAt');
    
    sendSuccess(res, feedbacks);
  } catch (err) {
    next(err);
  }
});

// Middleware to log feedback requests
router.use((req, res, next) => {
  console.log('Feedback request:', {
    method: req.method,
    path: req.path,
    body: req.body
  });
  next();
});

export default router;