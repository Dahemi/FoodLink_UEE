import { Router } from 'express';
import { z } from 'zod';
import { TaskModel } from '../models/index.js';

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
router.get('/tasks', async (_req, res, next) => {
  try {
    const tasks = await TaskModel.find().sort({ createdAt: -1 }).lean();
    res.json(tasks);
  } catch (e) { next(e); }
});

router.post('/tasks', async (req, res, next) => {
  try {
    const parsed = taskSchema.parse(req.body);
    const task = await TaskModel.create(parsed);
    res.status(201).json(task);
  } catch (e) { next(e); }
});

router.get('/tasks/:id', async (req, res, next) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    res.json(task);
  } catch (e) { next(e); }
});

router.patch('/tasks/:id/status', async (req, res, next) => {
  try {
    const status = z.enum(['assigned', 'accepted', 'in_progress', 'completed', 'cancelled']).parse(req.body.status);
    const task = await TaskModel.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!task) return res.status(404).json({ message: 'Not found' });
    res.json(task);
  } catch (e) { next(e); }
});

router.patch('/tasks/:id/reschedule', async (req, res, next) => {
  try {
    const body = z.object({ pickupTime: z.string(), deliveryTime: z.string().optional() }).parse(req.body);
    const task = await TaskModel.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!task) return res.status(404).json({ message: 'Not found' });
    res.json(task);
  } catch (e) { next(e); }
});

// Stats
router.get('/stats', async (_req, res, next) => {
  try {
    const tasks = await TaskModel.find().lean();
    const completed = tasks.filter(t => t.status === 'completed');
    const stats = {
      completedTasks: completed.length,
      totalDeliveries: completed.length,
      mealsDelivered: completed.reduce((sum, t) => {
        const match = String(t.foodDetails.quantity || '').match(/\d+/);
        return sum + (match ? parseInt(match[0]) : 0);
      }, 0),
      averageRating: 0,
      totalHours: completed.length * 2,
      impactScore: completed.length * 10,
    };
    res.json(stats);
  } catch (e) { next(e); }
});

export default router;
