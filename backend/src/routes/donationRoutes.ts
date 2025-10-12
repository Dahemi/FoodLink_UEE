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

// Get all available donations (NGOs and others can view)
router.get('/', authenticateAnyUser, async (req, res, next) => {
  try {
    console.log('Donations GET request received');
    console.log('User type:', req.userType);
    console.log('User ID:', req.user?._id);
    
    const { page = 1, limit = 20, type, category, urgency, location, status } = req.query;
    
    // Build query - don't filter by status if not provided
    const query: any = {
      expiryDateTime: { $gt: new Date() } // Only non-expired donations
    };
    
    // Only add status filter if explicitly provided
    if (status) {
      query.status = status;
    } else {
      // Default to showing available donations for NGOs
      query.status = 'available';
    }
    
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
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    const donations = await DonationModel.find(query)
      .populate('donorId', 'name donorType businessName address phone stats')
      .populate('claimedBy', 'name organizationType')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();
    
    const total = await DonationModel.countDocuments(query);
    
    console.log('Donations found:', donations.length);
    console.log('Total count:', total);
    console.log('Sample donation:', donations[0] ? {
      id: donations[0]._id,
      title: donations[0].title,
      status: donations[0].status,
      donorId: donations[0].donorId
    } : 'none');
    
    // Normalize the response format
    const normalizedDonations = donations.map((donation: any) => {
      // Extract donor info with safe property access
      let donorInfo;
      
      if (donation.donorId && typeof donation.donorId === 'object' && '_id' in donation.donorId) {
        // Donor is populated
        donorInfo = {
          _id: donation.donorId._id,
          name: donation.donorId.name || 'Unknown',
          donorType: donation.donorId.donorType || 'individual',
          businessName: donation.donorId.businessName || undefined,
          phone: donation.donorId.phone || undefined,
          rating: donation.donorId.stats?.averageRating ?? 0,
          totalDonations: donation.donorId.stats?.totalDonations ?? 0,
        };
      } else {
        // Donor is not populated (just ID)
        donorInfo = donation.donorId;
      }

      return {
        ...donation,
        donorId: donorInfo,
        // Ensure images is always an array of strings
        images: donation.images ? 
          (Array.isArray(donation.images) ? 
            donation.images.map((img: any) => typeof img === 'string' ? img : img.url || img) 
            : []) 
          : []
      };
    });
    
    sendSuccess(res, {
      donations: normalizedDonations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }, 'Donations retrieved successfully');
  } catch (e) { 
    console.error('Donation GET error:', e);
    next(e); 
  }
});

// Get donation by ID
router.get('/:id', authenticateAnyUser, async (req, res, next) => {
  try {
    const donation = await DonationModel.findById(req.params.id)
      .populate('donorId', 'name donorType address phone businessName')
      .populate('claimedBy', 'name organizationType')
      .lean();
    
    if (!donation) {
      return sendNotFound(res, 'Donation not found');
    }
    
    // Check if user has permission to view this donation
    const userId = req.user._id.toString();
    const userType = req.userType;
    
    if (userType === 'donor' && donation.donorId._id.toString() !== userId) {
      return sendError(res, 'Access denied', 403);
    }
    
    // Normalize images to array of strings
    if (donation.images && typeof donation.images.toObject === 'function') {
      const imagesArray = donation.images.toObject();
      donation.images = imagesArray.map((img: any) => 
        typeof img === 'string' ? img : (img.url || img)
      );
    }
    
    sendSuccess(res, donation, 'Donation retrieved successfully');
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

// Get donor's donation history
router.get('/donor/history', authenticateDonor, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;
    
    // Build query
    const query: any = { donorId: req.donor._id };
    
    if (status) {
      const statuses = (status as string).split(',');
      query.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }
    
    // Fetch donations
    const donations = await DonationModel.find(query)
      .populate('claimedBy', 'name organizationType')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();
    
    const total = await DonationModel.countDocuments(query);
    
    // Calculate stats
    const allDonorDonations = await DonationModel.find({ donorId: req.donor._id });
    const stats = {
      totalDonations: allDonorDonations.length,
      activeDonations: allDonorDonations.filter(d => d.status === 'available' || d.status === 'claimed' || d.status === 'pickup_scheduled' || d.status === 'picked_up').length,
      completedDonations: allDonorDonations.filter(d => d.status === 'delivered').length,
      totalServings: allDonorDonations.reduce((sum, d) => sum + (d.foodDetails?.estimatedServings || 0), 0),
      totalImpact: allDonorDonations.filter(d => d.status === 'delivered').reduce((sum, d) => sum + (d.foodDetails?.estimatedServings || 0), 0),
    };
    
    sendSuccess(res, {
      donations,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }, 'Donation history retrieved successfully');
  } catch (e) {
    next(e);
  }
});

// Get donor stats
router.get('/donor/stats', authenticateDonor, async (req, res, next) => {
  try {
    const donations = await DonationModel.find({ donorId: req.donor._id });
    
    const stats = {
      totalDonations: donations.length,
      activeDonations: donations.filter(d => d.status === 'available' || d.status === 'claimed').length,
      completedDonations: donations.filter(d => d.status === 'delivered').length,
      totalServings: donations.reduce((sum, d) => sum + (d.foodDetails?.estimatedServings || 0), 0),
      totalImpact: donations.filter(d => d.status === 'delivered').reduce((sum, d) => sum + (d.foodDetails?.estimatedServings || 0), 0),
    };
    
    sendSuccess(res, stats, 'Donor stats retrieved successfully');
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
    const stats = req.ngo.stats || { averageRating: 0 };
    if (!donation.canBeClaimedBy(req.ngo._id.toString(), stats.averageRating, req.ngo.isVerified)) {
      return sendError(res, 'You do not meet the requirements to claim this donation', 403);
    }
    
    // Update donation status to 'claimed'
    donation.status = 'claimed';
    donation.claimedBy = req.ngo._id;
    donation.claimedAt = new Date();
    
    // Add to interested NGOs list
    donation.addInterestedNGO(req.ngo._id.toString(), message);
    
    await donation.save();
    
    // Populate the donation for response
    const populatedDonation = await DonationModel.findById(donation._id)
      .populate('donorId', 'name donorType businessName phone')
      .populate('claimedBy', 'name organizationType contactPerson phone')
      .lean();
    
    // Normalize images to array of strings
    if (populatedDonation && populatedDonation.images) {
      const imagesArray = typeof populatedDonation.images.toObject === 'function'
        ? populatedDonation.images.toObject()
        : Array.isArray(populatedDonation.images)
          ? populatedDonation.images
          : [];
      populatedDonation.images = imagesArray.map((img: any) =>
        typeof img === 'string' ? img : (img.url || img)
      );
    }
    
    sendSuccess(res, populatedDonation, 'Donation accepted successfully');
  } catch (e) { 
    next(e); 
  }
});

// Get NGO's claim history (for History page)
router.get('/ngo/claims', authenticateNGO, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;
    
    // Build query for donations claimed by this NGO
    const query: any = { claimedBy: req.ngo._id };
    
    // Add status filter - map to donation statuses
    if (status && status !== 'all') {
      const statusMap: any = {
        'pending': 'claimed',
        'approved': 'pickup_scheduled',
        'picked_up': 'picked_up',
        'delivered': 'delivered',
        'cancelled': ['cancelled', 'expired']
      };
      
      const mappedStatus = statusMap[status as string];
      if (mappedStatus) {
        query.status = Array.isArray(mappedStatus) ? { $in: mappedStatus } : mappedStatus;
      }
    }
    
    // Add date range filter
    if (dateFrom || dateTo) {
      query.claimedAt = {};
      if (dateFrom) query.claimedAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.claimedAt.$lte = new Date(dateTo as string);
    }
    
    // Fetch claimed donations
    const claims = await DonationModel.find(query)
      .populate('donorId', 'name businessName')
      .sort({ claimedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();
    
    const total = await DonationModel.countDocuments(query);
    
    // Transform donations to claim format
    const transformedClaims = claims.map((donation: any) => ({
      _id: donation._id,
      donationId: {
        _id: donation._id,
        title: donation.title,
        foodDetails: donation.foodDetails,
        pickupLocation: donation.pickupLocation,
        images: donation.images || []
      },
      donorId: donation.donorId,
      status: mapDonationStatusToClaim(donation.status),
      createdAt: donation.claimedAt || donation.createdAt,
      updatedAt: donation.updatedAt,
      beneficiariesServed: donation.beneficiariesServed || 0,
      volunteersInvolved: donation.volunteersInvolved || 0,
      distributionNotes: donation.distributionNotes || '',
      pickupScheduledAt: donation.pickupDateTime,
      deliveredAt: donation.deliveredAt
    }));
    
    sendSuccess(res, {
      claims: transformedClaims,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }, 'Claim history retrieved successfully');
  } catch (e) {
    console.error('NGO claims error:', e);
    next(e);
  }
});

// Get NGO's claim statistics
router.get('/ngo/stats', authenticateNGO, async (req, res, next) => {
  try {
    const claims = await DonationModel.find({ claimedBy: req.ngo._id });
    
    const stats = {
      totalClaims: claims.length,
      approvedClaims: claims.filter(d => d.status === 'pickup_scheduled' || d.status === 'picked_up').length,
      completedClaims: claims.filter(d => d.status === 'delivered').length,
      totalServings: claims.reduce((sum, d) => sum + (d.foodDetails?.estimatedServings || 0), 0),
      totalBeneficiaries: claims.reduce((sum, d) => sum + (d.beneficiariesServed || 0), 0),
    };
    
    sendSuccess(res, stats, 'NGO statistics retrieved successfully');
  } catch (e) {
    next(e);
  }
});

// Helper function to map donation status to claim status
function mapDonationStatusToClaim(donationStatus: string): string {
  const statusMap: any = {
    'claimed': 'pending',
    'pickup_scheduled': 'approved',
    'picked_up': 'picked_up',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'expired': 'cancelled'
  };
  return statusMap[donationStatus] || donationStatus;
}

export default router;
