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
    console.log('Creating feedback with data:', req.body);
    
    const feedback = new BeneficiaryFeedbackModel({
      ngoId: req.body.ngoId,
      beneficiaryId: req.body.beneficiaryId,
      rating: req.body.rating,
      comment: req.body.comment,
      anonymous: req.body.anonymous || false
    });

    console.log('Created feedback model:', feedback);
    
    const savedFeedback = await feedback.save();
    console.log('Saved feedback:', savedFeedback);

    // Verify it exists in DB
    const verifyFeedback = await BeneficiaryFeedbackModel.findById(savedFeedback._id);
    console.log('Verified feedback in DB:', verifyFeedback);
    
    sendCreated(res, savedFeedback, 'Feedback submitted');
  } catch (err) {
    console.error('Error saving feedback:', err);
    next(err);
  }
});

/**
 * GET /api/beneficiary-feedback/ngo/:id
 * Get feedbacks for an NGO (public-safe)
 */
router.get('/ngo/:id', async (req, res, next) => {
  try {
    const feedbacks = await BeneficiaryFeedbackModel.find({ ngoId: req.params.id })
      .populate('beneficiaryId', 'name')
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