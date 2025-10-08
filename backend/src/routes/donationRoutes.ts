import { Router } from 'express';
import { DonationModel } from '../models/Donation.js';
import { donationCreateSchema } from '../utils/validationSchemas.js';
import { authenticateDonor, authenticateNGO, authenticateAnyUser } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/responseUtils.js';

const router = Router();

// Create donation (donors only)
router.post('/', authenticateDonor, async (req, res, next) => {
  try {
    const data = donationCreateSchema.parse(req.body);
    
    const donation = new DonationModel({
      ...data,
      donorId: req.donor._id,
    });
    
    await donation.save();
    
    sendCreated(res, donation.toJSON(), 'Donation created successfully');
  } catch (e) { 
    next(e); 
  }
});

// Get all available donations (NGOs can view)
router.get('/', authenticateNGO, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, category, urgency, location } = req.query;
    
    const query: any = { 
      status: 'available',
      expiryDateTime: { $gt: new Date() } // Only non-expired donations
    };
    
    // Apply filters
    if (type) query['foodDetails.type'] = type;
    if (category) query['foodDetails.category'] = category;
    if (urgency) query['pickupSchedule.urgency'] = urgency;
    
    // Location-based filtering (if coordinates provided)
    if (location) {
      const [lng, lat, maxDistance = 10000] = (location as string).split(',').map(Number);
      query['pickupLocation.coordinates'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxDistance // in meters
        }
      };
    }
    
    const donations = await DonationModel.find(query)
      .populate('donorId', 'name donorType address phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();
    
    const total = await DonationModel.countDocuments(query);
    
    sendSuccess(res, {
      donations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }, 'Donations retrieved successfully');
  } catch (e) { 
    next(e); 
  }
});

// Get donation by ID
router.get('/:id', authenticateAnyUser, async (req, res, next) => {
  try {
    const donation = await DonationModel.findById(req.params.id)
      .populate('donorId', 'name donorType address phone')
      .populate('claimedBy', 'name organizationType');
    
    if (!donation) {
      return sendNotFound(res, 'Donation not found');
    }
    
    // Check if user has permission to view this donation
    const userId = req.user._id.toString();
    const userType = req.userType;
    
    if (userType === 'donor' && donation.donorId._id.toString() !== userId) {
      return sendError(res, 'Access denied', 403);
    }
    
    sendSuccess(res, donation.toJSON(), 'Donation retrieved successfully');
  } catch (e) { 
    next(e); 
  }
});

// Update donation (donors only, before claimed)
router.patch('/:id', authenticateDonor, async (req, res, next) => {
  try {
    const donation = await DonationModel.findById(req.params.id);
    
    if (!donation) {
      return sendNotFound(res, 'Donation not found');
    }
    
    // Check ownership
    if (donation.donorId.toString() !== req.donor._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }
    
    // Check if donation can be updated
    if (donation.status !== 'available') {
      return sendError(res, 'Cannot update donation that has been claimed', 400);
    }
    
    const updateData = donationCreateSchema.partial().parse(req.body);
    Object.assign(donation, updateData);
    
    await donation.save();
    
    sendSuccess(res, donation.toJSON(), 'Donation updated successfully');
  } catch (e) { 
    next(e); 
  }
});

// Delete donation (donors only, before claimed)
router.delete('/:id', authenticateDonor, async (req, res, next) => {
  try {
    const donation = await DonationModel.findById(req.params.id);
    
    if (!donation) {
      return sendNotFound(res, 'Donation not found');
    }
    
    // Check ownership
    if (donation.donorId.toString() !== req.donor._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }
    
    // Check if donation can be deleted
    if (donation.status !== 'available') {
      return sendError(res, 'Cannot delete donation that has been claimed', 400);
    }
    
    await donation.deleteOne();
    
    sendSuccess(res, null, 'Donation deleted successfully');
  } catch (e) { 
    next(e); 
  }
});

// Express interest in donation (NGOs only)
router.post('/:id/interest', authenticateNGO, async (req, res, next) => {
  try {
    const { message } = req.body;
    
    const donation = await DonationModel.findById(req.params.id);
    
    if (!donation) {
      return sendNotFound(res, 'Donation not found');
    }
    
    if (!donation.isAvailable()) {
      return sendError(res, 'Donation is no longer available', 400);
    }
    
    // Check if NGO can claim this donation
    if (!donation.canBeClaimedBy(req.ngo._id.toString(), req.ngo.stats.averageRating, req.ngo.isVerified)) {
      return sendError(res, 'You do not meet the requirements to claim this donation', 403);
    }
    
    donation.addInterestedNGO(req.ngo._id.toString(), message);
    await donation.save();
    
    sendSuccess(res, null, 'Interest expressed successfully');
  } catch (e) { 
    next(e); 
  }
});

export default router;
