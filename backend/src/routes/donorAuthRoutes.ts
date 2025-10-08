import { Router } from 'express';
import { DonorModel } from '../models/Donor.js';
import { generateTokens } from '../utils/tokenUtils.js';
import { donorRegisterSchema, donorUpdateSchema, loginSchema } from '../utils/validationSchemas.js';
import { authenticateDonor } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError, sendCreated } from '../utils/responseUtils.js';

const router = Router();

// Donor Authentication Routes
router.post('/register', async (req, res, next) => {
  try {
    const data = donorRegisterSchema.parse(req.body);
    
    // Check if donor already exists
    const existingDonor = await DonorModel.findOne({ email: data.email });
    if (existingDonor) {
      return sendError(res, 'Donor with this email already exists', 400);
    }

    const donor = new DonorModel(data);
    await donor.save();

    const { accessToken, refreshToken } = generateTokens(donor._id.toString(), 'donor');
    const refreshTokenHash = (donor as any).generateRefreshToken();
    
    await donor.save();

    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    sendCreated(res, {
      token: accessToken,
      refreshToken: refreshTokenHash,
      expiresAt,
      user: donor.toJSON(),
    }, 'Donor account created successfully');
  } catch (e) { 
    next(e); 
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const donor = await DonorModel.findOne({ email, isActive: true });
    if (!donor) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isPasswordValid = await (donor as any).comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Update last login
    donor.lastLogin = new Date();
    await donor.save();

    const { accessToken, refreshToken } = generateTokens(donor._id.toString(), 'donor');
    const refreshTokenHash = (donor as any).generateRefreshToken();
    
    await donor.save();

    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    sendSuccess(res, {
      token: accessToken,
      refreshToken: refreshTokenHash,
      expiresAt,
      user: donor.toJSON(),
    }, 'Login successful');
  } catch (e) { 
    next(e); 
  }
});

router.post('/logout', authenticateDonor, async (req, res, next) => {
  try {
    const donor = req.donor;
    if (!donor) {
      return sendError(res, 'No authenticated user', 401);
    }
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Remove the current refresh token
    donor.refreshTokens = donor.refreshTokens.filter(
      (t: any) => t.token !== token
    );
    
    await donor.save();
    
    sendSuccess(res, null, 'Logged out successfully');
  } catch (e) { 
    next(e); 
  }
});

router.get('/profile', authenticateDonor, async (req, res, next) => {
  try {
    if (!req.donor) {
      return sendError(res, 'No authenticated user', 401);
    }
    sendSuccess(res, req.donor.toJSON(), 'Profile retrieved successfully');
  } catch (e) { 
    next(e); 
  }
});

router.patch('/profile', authenticateDonor, async (req, res, next) => {
  try {
    const data = donorUpdateSchema.parse(req.body);
    
    const donor = req.donor;
    if (!donor) {
      return sendError(res, 'No authenticated user', 401);
    }
    
    Object.assign(donor, data);
    await donor.save();
    
    sendSuccess(res, donor.toJSON(), 'Profile updated successfully');
  } catch (e) { 
    next(e); 
  }
});

export default router;
