import { Router } from 'express';
import { BeneficiaryModel } from '../models/Beneficiary.js';
import { generateTokens } from '../utils/tokenUtils.js';
import { beneficiaryRegisterSchema, beneficiaryUpdateSchema, loginSchema } from '../utils/validationSchemas.js';
import { authenticateBeneficiary } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError, sendCreated } from '../utils/responseUtils.js';

const router = Router();

// Beneficiary Authentication Routes
router.post('/register', async (req, res, next) => {
  try {
    const data = beneficiaryRegisterSchema.parse(req.body);
    
    // Check if beneficiary already exists
    const existingBeneficiary = await BeneficiaryModel.findOne({ email: data.email });
    if (existingBeneficiary) {
      return sendError(res, 'Beneficiary with this email already exists', 400);
    }

    const beneficiary = new BeneficiaryModel(data);
    await beneficiary.save();

    const { accessToken, refreshToken } = generateTokens(beneficiary._id.toString(), 'beneficiary');
    const refreshTokenHash = (beneficiary as any).generateRefreshToken();
    
    await beneficiary.save();

    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    sendCreated(res, {
      token: accessToken,
      refreshToken: refreshTokenHash,
      expiresAt,
      user: beneficiary.toJSON(),
    }, 'Beneficiary account created successfully');
  } catch (e) { 
    next(e); 
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const beneficiary = await BeneficiaryModel.findOne({ email, isActive: true });
    if (!beneficiary) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isPasswordValid = await (beneficiary as any).comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Update last login
    beneficiary.lastLogin = new Date();
    await beneficiary.save();

    const { accessToken, refreshToken } = generateTokens(beneficiary._id.toString(), 'beneficiary');
    const refreshTokenHash = (beneficiary as any).generateRefreshToken();
    
    await beneficiary.save();

    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    sendSuccess(res, {
      token: accessToken,
      refreshToken: refreshTokenHash,
      expiresAt,
      user: beneficiary.toJSON(),
    }, 'Login successful');
  } catch (e) { 
    next(e); 
  }
});

router.post('/logout', authenticateBeneficiary, async (req, res, next) => {
  try {
    const beneficiary = req.beneficiary;
    if (!beneficiary) {
      return sendError(res, 'No authenticated user', 401);
    }
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Remove the current refresh token
    beneficiary.refreshTokens = beneficiary.refreshTokens.filter(
      (t: any) => t.token !== token
    );
    
    await beneficiary.save();
    
    sendSuccess(res, null, 'Logged out successfully');
  } catch (e) { 
    next(e); 
  }
});

router.get('/profile', authenticateBeneficiary, async (req, res, next) => {
  try {
    if (!req.beneficiary) {
      return sendError(res, 'No authenticated user', 401);
    }
    sendSuccess(res, req.beneficiary.toJSON(), 'Profile retrieved successfully');
  } catch (e) { 
    next(e); 
  }
});

router.patch('/profile', authenticateBeneficiary, async (req, res, next) => {
  try {
    const data = beneficiaryUpdateSchema.parse(req.body);
    
    const beneficiary = req.beneficiary;
    if (!beneficiary) {
      return sendError(res, 'No authenticated user', 401);
    }
    
    Object.assign(beneficiary, data);
    await beneficiary.save();
    
    sendSuccess(res, beneficiary.toJSON(), 'Profile updated successfully');
  } catch (e) { 
    next(e); 
  }
});

export default router;
