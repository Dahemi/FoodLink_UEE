import { Router } from 'express';

// Import all route modules
import volunteerAuthRoutes from './volunteerAuthRoutes.js';
import donorAuthRoutes from './donorAuthRoutes.js';
import ngoAuthRoutes from './ngoAuthRoutes.js';
import beneficiaryAuthRoutes from './beneficiaryAuthRoutes.js';
import volunteerTaskRoutes from './volunteerTaskRoutes.js';
import donationRoutes from './donationRoutes.js';
import ngoRequirementRoutes from './ngoRequirementRoutes.js';
import fileUploadRoutes from './fileUploadRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Authentication routes
router.use('/auth/volunteer', volunteerAuthRoutes);
router.use('/auth/donor', donorAuthRoutes);
router.use('/auth/ngo', ngoAuthRoutes);
router.use('/auth/beneficiary', beneficiaryAuthRoutes);

// Feature routes
router.use('/donations', donationRoutes);
router.use('/volunteer', volunteerTaskRoutes); // Legacy volunteer task routes

// Feature routes
router.use('/donations', donationRoutes);
router.use('/volunteer', volunteerTaskRoutes);
router.use('/ngo-requirements', ngoRequirementRoutes);
router.use('/upload', fileUploadRoutes);

// API info endpoint
router.get('/info', (_req, res) => {
  res.json({
    name: 'FoodLink API',
    version: '1.0.0',
    description: 'API for FoodLink - Connecting food donors with those in need',
    endpoints: {
      authentication: {
        volunteer: '/api/auth/volunteer',
        donor: '/api/auth/donor',
        ngo: '/api/auth/ngo',
        beneficiary: '/api/auth/beneficiary'
      },
      features: {
        donations: '/api/donations',
        tasks: '/api/volunteer' // Legacy endpoint
      },
      utility: {
        health: '/api/health',
        info: '/api/info'
      }
    }
  });
});

export default router;
