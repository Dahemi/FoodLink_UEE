import { Router } from 'express';
import { z } from 'zod';
import { TaskModel, DonationModel, VolunteerTaskModel } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';
import jwt from 'jsonwebtoken';
import { VolunteerModel } from '../models/Volunteer.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token (same as in volunteerAuthRoutes)
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const volunteer = await VolunteerModel.findById(decoded.volunteerId);
    
    if (!volunteer || !volunteer.isActive) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.volunteer = volunteer;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const router = Router();

const taskSchema = z.object({
  donorInfo: z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    contactPerson: z.string(),
  }),
  ngoInfo: z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    contactPerson: z.string(),
  }),
  foodDetails: z.object({
    type: z.string(),
    quantity: z.string(),
    expiryTime: z.string(),
    specialInstructions: z.string().optional(),
  }),
  pickupTime: z.string(),
  deliveryTime: z.string(),
  status: z.enum(['assigned', 'accepted', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  distance: z.string().optional(),
  estimatedDuration: z.string().optional(),
});

// Tasks
router.get('/tasks', authenticateToken, async (_req, res, next) => {
  try {
    const tasks = await TaskModel.find().sort({ createdAt: -1 }).lean();
    
    // Transform _id to id for frontend compatibility
    const transformedTasks = tasks.map(task => ({
      ...task,
      id: task._id.toString(),
      _id: undefined // Remove _id to avoid confusion
    }));
    
    res.json(transformedTasks);
  } catch (e) { next(e); }
});

router.post('/tasks', authenticateToken, async (req, res, next) => {
  try {
    const parsed = taskSchema.parse(req.body);
    const task = await TaskModel.create(parsed);
    res.status(201).json(task);
  } catch (e) { next(e); }
});

router.get('/tasks/:id', authenticateToken, async (req, res, next) => {
  try {
    const task = await TaskModel.findById(req.params.id).lean();
    if (!task) return res.status(404).json({ message: 'Not found' });
    
    // Transform _id to id for frontend compatibility
    const transformedTask = {
      ...task,
      id: task._id.toString(),
      _id: undefined // Remove _id to avoid confusion
    };
    
    res.json(transformedTask);
  } catch (e) { next(e); }
});

router.patch('/tasks/:id/status', authenticateToken, async (req, res, next) => {
  try {
    console.log('Update task status request:', {
      taskId: req.params.id,
      status: req.body.status,
      volunteerId: req.volunteer?._id
    });
    
    const status = z.enum(['assigned', 'accepted', 'in_progress', 'completed', 'cancelled']).parse(req.body.status);
    const task = await TaskModel.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (!task) {
      console.log('Task not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Not found' });
    }
    
    console.log('Task updated successfully:', task._id);
    
    // Transform _id to id for frontend compatibility
    const transformedTask = {
      ...task.toObject(),
      id: task._id.toString(),
      _id: undefined // Remove _id to avoid confusion
    };
    
    res.json(transformedTask);
  } catch (e) { 
    console.error('Error updating task status:', e);
    next(e); 
  }
});

router.patch('/tasks/:id/reschedule', authenticateToken, async (req, res, next) => {
  try {
    const body = z.object({ pickupTime: z.string(), deliveryTime: z.string().optional() }).parse(req.body);
    const task = await TaskModel.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!task) return res.status(404).json({ message: 'Not found' });
    
    // Transform _id to id for frontend compatibility
    const transformedTask = {
      ...task.toObject(),
      id: task._id.toString(),
      _id: undefined // Remove _id to avoid confusion
    };
    
    res.json(transformedTask);
  } catch (e) { next(e); }
});

// Stats
router.get('/stats', authenticateToken, async (_req, res, next) => {
  try {
    const tasks = await TaskModel.find().lean();
    const completed = tasks.filter(t => t.status === 'completed');
    const stats = {
      completedTasks: completed.length,
      totalDeliveries: completed.length,
      mealsDelivered: completed.reduce((sum, t) => {
        const foodDetails = t.foodDetails as any;
        const match = String(foodDetails?.quantity || '').match(/\d+/);
        return sum + (match ? parseInt(match[0]) : 0);
      }, 0),
      averageRating: 0,
      totalHours: completed.length * 2,
      impactScore: completed.length * 10,
    };
    res.json(stats);
  } catch (e) { next(e); }
});

// Get claimed donations for volunteers
router.get('/claimed-donations', authenticateToken, async (req, res, next) => {
  try {
    console.log('Claimed donations request received');
    console.log('Volunteer user:', req.volunteer?._id);
    console.log('Query params:', req.query);
    
    const { page = 1, limit = 20, status = 'claimed' } = req.query;
    
    // Find donations that are claimed and populate NGO details
    const query = { 
      status: status,
      claimedBy: { $exists: true, $ne: null }
    };
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    // First, let's check if there are any donations at all
    const allDonations = await DonationModel.find({}).limit(5).lean();
    console.log('All donations count:', allDonations.length);
    console.log('Sample donation:', allDonations[0] ? {
      id: allDonations[0]._id,
      status: allDonations[0].status,
      claimedBy: allDonations[0].claimedBy
    } : 'No donations found');
    
    const donations = await DonationModel.find(query)
      .populate('donorId', 'name donorType businessName phone address')
      .populate('claimedBy', 'name organizationType address phone contactPerson')
      .sort({ claimedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean() as any[];
    
    const total = await DonationModel.countDocuments(query);
    
    console.log('Found donations:', donations.length);
    console.log('First donation:', donations[0] ? {
      id: donations[0]._id,
      title: donations[0].title,
      status: donations[0].status,
      claimedBy: donations[0].claimedBy
    } : 'No donations');
    
    // Transform donations to include pickup and delivery addresses
    const transformedDonations = donations.map(donation => ({
      id: donation._id,
      title: donation.title,
      foodDetails: donation.foodDetails,
      pickupLocation: donation.pickupLocation,
      deliveryLocation: donation.claimedBy?.address, // NGO address as delivery location
      pickupSchedule: donation.pickupSchedule,
      donorInfo: {
        name: donation.donorId?.name || 'Unknown',
        address: donation.pickupLocation?.address || 'Address not available',
        phone: donation.donorId?.phone || 'Phone not available',
        contactPerson: donation.donorId?.name || 'Contact person not available'
      },
      ngoInfo: {
        name: donation.claimedBy?.name || 'NGO not available',
        address: donation.claimedBy?.address?.street ? 
          `${donation.claimedBy.address.street}, ${donation.claimedBy.address.city}, ${donation.claimedBy.address.state}` : 
          'Address not available',
        phone: donation.claimedBy?.phone || 'Phone not available',
        contactPerson: donation.claimedBy?.name || 'Contact person not available' // Use NGO name as contact person
      },
      status: 'claimed',
      priority: donation.pickupSchedule?.urgency || 'medium',
      claimedAt: donation.claimedAt,
      expiryDateTime: donation.expiryDateTime,
      images: donation.images || []
    }));
    
    console.log('Transformed donations:', transformedDonations.length);
    console.log('First transformed donation:', transformedDonations[0]);
    
    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Return the data directly instead of wrapping it in sendSuccess
    res.json({
      success: true,
      data: {
        donations: transformedDonations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      message: 'Claimed donations retrieved successfully'
    });
  } catch (e) { 
    console.error('Error fetching claimed donations:', e);
    next(e); 
  }
});

// Accept a claimed donation and create a volunteer task
router.post('/accept-donation', authenticateToken, async (req, res, next) => {
  try {
    const { donationId } = req.body;
    const volunteerId = req.volunteer._id;
    
    console.log('Accept donation request:', { donationId, volunteerId });
    
    if (!donationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Donation ID is required' 
      });
    }
    
    // Find the donation
    const donation = await DonationModel.findById(donationId)
      .populate('donorId', 'name phone address')
      .populate('claimedBy', 'name phone address')
      .lean();
    
    if (!donation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Donation not found' 
      });
    }
    
    if (donation.status !== 'claimed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Donation is not available for pickup' 
      });
    }
    
    // Create a volunteer task
    const taskData = {
      donorInfo: {
        name: donation.donorId?.name || 'Unknown',
        address: donation.pickupLocation?.address || 'Address not available',
        phone: donation.donorId?.phone || 'Phone not available',
        contactPerson: donation.donorId?.name || 'Contact person not available'
      },
      ngoInfo: {
        name: donation.claimedBy?.name || 'NGO not available',
        address: donation.claimedBy?.address?.street ? 
          `${donation.claimedBy.address.street}, ${donation.claimedBy.address.city}, ${donation.claimedBy.address.state}` : 
          'Address not available',
        phone: donation.claimedBy?.phone || 'Phone not available',
        contactPerson: donation.claimedBy?.name || 'Contact person not available'
      },
      foodDetails: JSON.stringify({
        type: donation.foodDetails?.type || 'Food',
        quantity: donation.foodDetails?.quantity || 'Unknown quantity',
        expiryTime: donation.expiryDateTime || new Date().toISOString(),
        specialInstructions: donation.pickupSchedule?.specialInstructions || ''
      }),
      pickupTime: donation.pickupSchedule?.availableFrom || new Date().toISOString(),
      deliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      status: 'accepted',
      priority: donation.pickupSchedule?.urgency === 'urgent' ? 'high' : 'medium', // Map urgent to high
      distance: 'Calculating...',
      estimatedDuration: '30-45 minutes'
    };
    
    // Create the task using the existing TaskModel
    const task = await TaskModel.create(taskData);
    
    // Update donation status to indicate volunteer has accepted
    await DonationModel.findByIdAndUpdate(donationId, { 
      status: 'pickup_scheduled',
      // You might want to add a volunteer assignment field here
    });
    
    console.log('Created volunteer task:', task._id);
    
    res.json({
      success: true,
      data: task,
      message: 'Pickup accepted successfully'
    });
    
  } catch (e) { 
    console.error('Error accepting donation:', e);
    next(e); 
  }
});

export default router;
