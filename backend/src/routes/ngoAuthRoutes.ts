import { Router } from 'express';
import { NGOModel } from '../models/NGO.js';
import { generateTokens } from '../utils/tokenUtils.js';
import { ngoRegisterSchema, ngoUpdateSchema, loginSchema } from '../utils/validationSchemas.js';
import { authenticateNGO } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError, sendCreated } from '../utils/responseUtils.js';

const router = Router();

// NGO Authentication Routes
router.post('/register', async (req, res, next) => {
  try {
    const data = ngoRegisterSchema.parse(req.body);
    
    // Check if NGO already exists
    const existingNGO = await NGOModel.findOne({ 
      $or: [
        { email: data.email },
        { registrationNumber: data.registrationNumber }
      ]
    });
    if (existingNGO) {
      return sendError(res, 'NGO with this email or registration number already exists', 400);
    }

    const ngo = new NGOModel(data);
    await ngo.save();

    const { accessToken, refreshToken } = generateTokens(ngo._id.toString(), 'ngo');
    const refreshTokenHash = (ngo as any).generateRefreshToken();
    
    await ngo.save();

    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    sendCreated(res, {
      token: accessToken,
      refreshToken: refreshTokenHash,
      expiresAt,
      user: ngo.toJSON(),
    }, 'NGO account created successfully');
  } catch (e) { 
    next(e); 
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const ngo = await NGOModel.findOne({ email, isActive: true });
    if (!ngo) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isPasswordValid = await (ngo as any).comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Update last login
    ngo.lastLogin = new Date();
    await ngo.save();

    const { accessToken, refreshToken } = generateTokens(ngo._id.toString(), 'ngo');
    const refreshTokenHash = (ngo as any).generateRefreshToken();
    
    await ngo.save();

    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    sendSuccess(res, {
      token: accessToken,
      refreshToken: refreshTokenHash,
      expiresAt,
      user: ngo.toJSON(),
    }, 'Login successful');
  } catch (e) { 
    next(e); 
  }
});

router.post('/logout', authenticateNGO, async (req, res, next) => {
  try {
    const ngo = req.ngo;
    if (!ngo) {
      return sendError(res, 'No authenticated user', 401);
    }
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Remove the current refresh token
    ngo.refreshTokens = ngo.refreshTokens.filter(
      (t: any) => t.token !== token
    );
    
    await ngo.save();
    
    sendSuccess(res, null, 'Logged out successfully');
  } catch (e) { 
    next(e); 
  }
});

router.get('/profile', authenticateNGO, async (req, res, next) => {
  try {
    if (!req.ngo) {
      return sendError(res, 'No authenticated user', 401);
    }
    sendSuccess(res, req.ngo.toJSON(), 'Profile retrieved successfully');
  } catch (e) { 
    next(e); 
  }
});

router.patch('/profile', authenticateNGO, async (req, res, next) => {
  try {
    const data = ngoUpdateSchema.parse(req.body);
    
    const ngo = req.ngo;
    if (!ngo) {
      return sendError(res, 'No authenticated user', 401);
    }
    
    Object.assign(ngo, data);
    await ngo.save();
    
    sendSuccess(res, ngo.toJSON(), 'Profile updated successfully');
  } catch (e) { 
    next(e); 
  }
});

export default router;
