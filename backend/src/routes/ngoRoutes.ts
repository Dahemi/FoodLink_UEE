import { Router } from 'express';
import { NGOModel } from '../models/NGO.js';
import { authenticateAnyUser } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';

const router = Router();

/**
 * GET /api/ngos
 * Returns sanitized NGO documents (public-safe)
 */
router.get('/', authenticateAnyUser, async (req, res, next) => {
  try {
    const ngos = await NGOModel.find({ isActive: true })
      .select('-password -refreshTokens -verificationToken -passwordResetToken')
      .lean();
    sendSuccess(res, ngos, 'NGOs retrieved successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ngos/locations
 * Returns minimal data for map pins: id, name, address, coordinates
 */
router.get('/locations', authenticateAnyUser, async (req, res, next) => {
  try {
    const ngos = await NGOModel.find({ isActive: true })
      .select('name address')
      .lean();

    const locations = ngos
      .map((n: any) => {
        const addr = n.address || {};
        const coords = addr.coordinates
          ? { latitude: Number(addr.coordinates.latitude), longitude: Number(addr.coordinates.longitude) }
          : null;
        return {
          id: n._id,
          name: n.name,
          address: addr.street || addr.city || '',
          coordinates: coords,
        };
      })
      .filter((i: any) => i.coordinates && !Number.isNaN(i.coordinates.latitude) && !Number.isNaN(i.coordinates.longitude));

    sendSuccess(res, locations, 'NGO locations retrieved successfully');
  } catch (err) {
    next(err);
  }
});

export default router;