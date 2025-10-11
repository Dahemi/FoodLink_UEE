import { Router } from 'express';
import { NGORequirementModel } from '../models/NGORequirement.js';
import { authenticateNGO, authenticateAnyUser } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/responseUtils.js';
import { z } from 'zod';

const router = Router();

// Validation schema for requirements
const requirementCreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  foodType: z.enum(['cooked_meal', 'raw_ingredients', 'packaged_food', 'beverages', 'dairy', 'bakery', 'fruits_vegetables', 'other']),
  category: z.enum(['vegetarian', 'non_vegetarian', 'vegan', 'halal', 'kosher', 'mixed']),
  quantity: z.string().min(1),
  estimatedServings: z.number().min(1),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  neededBy: z.string().datetime(),
  beneficiaryCount: z.number().min(1),
  specialInstructions: z.string().max(500).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    caption: z.string().optional()
  })).optional(),
  verificationDocuments: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['registration', 'certification', 'permit', 'other']),
    name: z.string().min(1)
  })).optional(),
  tags: z.array(z.string()).optional(),
  location: z.object({
    address: z.string().min(1),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    })
  })
});

const requirementUpdateSchema = requirementCreateSchema.partial();

// Create requirement (NGOs only)
router.post('/', authenticateNGO, async (req, res, next) => {
  try {
    const data = requirementCreateSchema.parse(req.body);
    
    const requirement = new NGORequirementModel({
      ...data,
      ngoId: req.ngo._id,
    });
    
    await requirement.save();
    
    sendCreated(res, requirement.toJSON(), 'Requirement created successfully');
  } catch (e) { 
    next(e); 
  }
});

// Get all requirements (with filters)
router.get('/', authenticateAnyUser, async (req, res, next) => {
  try {
    const { 
      urgency, 
      foodType, 
      category, 
      status = 'open',
      page = 1, 
      limit = 20,
      lat,
      lng,
      radius = 10 // km
    } = req.query;

    let query: any = { isActive: true, status };

    // Add filters
    if (urgency) query.urgency = urgency;
    if (foodType) query.foodType = foodType;
    if (category) query.category = category;

    // Location-based search
    if (lat && lng) {
      query['location.coordinates'] = {
        $near: {
          $geometry: { 
            type: 'Point', 
            coordinates: [Number(lng), Number(lat)] 
          },
          $maxDistance: Number(radius) * 1000 // Convert km to meters
        }
      };
    }

    const requirements = await NGORequirementModel
      .find(query)
      .populate('ngoId', 'name organizationType address phone')
      .sort({ urgency: -1, neededBy: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();
    
    const total = await NGORequirementModel.countDocuments(query);
    
    sendSuccess(res, {
      requirements,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }, 'Requirements retrieved successfully');
  } catch (e) { 
    next(e); 
  }
});

// Get NGO's own requirements
router.get('/my-requirements', authenticateNGO, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query: any = { ngoId: req.ngo._id };
    if (status) query.status = status;

    const requirements = await NGORequirementModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();
    
    const total = await NGORequirementModel.countDocuments(query);
    
    sendSuccess(res, {
      requirements,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }, 'Your requirements retrieved successfully');
  } catch (e) { 
    next(e); 
  }
});

// Get requirement by ID
router.get('/:id', authenticateAnyUser, async (req, res, next) => {
  try {
    const requirement = await NGORequirementModel
      .findById(req.params.id)
      .populate('ngoId', 'name organizationType address phone email')
      .lean();
    
    if (!requirement) {
      return sendNotFound(res, 'Requirement not found');
    }
    
    sendSuccess(res, requirement, 'Requirement retrieved successfully');
  } catch (e) { 
    next(e); 
  }
});

// Update requirement (NGO owner only)
router.patch('/:id', authenticateNGO, async (req, res, next) => {
  try {
    const data = requirementUpdateSchema.parse(req.body);
    
    const requirement = await NGORequirementModel.findById(req.params.id);
    
    if (!requirement) {
      return sendNotFound(res, 'Requirement not found');
    }
    
    // Check ownership
    if (requirement.ngoId.toString() !== req.ngo._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }
    
    Object.assign(requirement, data);
    await requirement.save();
    
    sendSuccess(res, requirement.toJSON(), 'Requirement updated successfully');
  } catch (e) { 
    next(e); 
  }
});

// Delete requirement (NGO owner only)
router.delete('/:id', authenticateNGO, async (req, res, next) => {
  try {
    const requirement = await NGORequirementModel.findById(req.params.id);
    
    if (!requirement) {
      return sendNotFound(res, 'Requirement not found');
    }
    
    // Check ownership
    if (requirement.ngoId.toString() !== req.ngo._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }
    
    await requirement.deleteOne();
    
    sendSuccess(res, null, 'Requirement deleted successfully');
  } catch (e) { 
    next(e); 
  }
});

// Update requirement status
router.patch('/:id/status', authenticateNGO, async (req, res, next) => {
  try {
    const { status } = z.object({
      status: z.enum(['open', 'partially_fulfilled', 'fulfilled', 'cancelled'])
    }).parse(req.body);
    
    const requirement = await NGORequirementModel.findById(req.params.id);
    
    if (!requirement) {
      return sendNotFound(res, 'Requirement not found');
    }
    
    // Check ownership
    if (requirement.ngoId.toString() !== req.ngo._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }
    
    requirement.status = status;
    await requirement.save();
    
    sendSuccess(res, requirement.toJSON(), 'Requirement status updated successfully');
  } catch (e) { 
    next(e); 
  }
});

export default router;