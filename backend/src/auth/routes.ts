import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { VolunteerModel } from './model.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = '1h';
const JWT_REFRESH_EXPIRES_IN = '7d';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(5),
  vehicleType: z.enum(['bike', 'car', 'van', 'walking']).optional(),
  availability: z.object({
    monday: z.boolean().optional(),
    tuesday: z.boolean().optional(),
    wednesday: z.boolean().optional(),
    thursday: z.boolean().optional(),
    friday: z.boolean().optional(),
    saturday: z.boolean().optional(),
    sunday: z.boolean().optional(),
  }).optional(),
  preferredTimeSlots: z.array(z.enum(['morning', 'afternoon', 'evening'])).optional(),
  maxDistance: z.number().min(1).max(50).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  address: z.string().min(5).optional(),
  vehicleType: z.enum(['bike', 'car', 'van', 'walking']).optional(),
  availability: z.object({
    monday: z.boolean().optional(),
    tuesday: z.boolean().optional(),
    wednesday: z.boolean().optional(),
    thursday: z.boolean().optional(),
    friday: z.boolean().optional(),
    saturday: z.boolean().optional(),
    sunday: z.boolean().optional(),
  }).optional(),
  preferredTimeSlots: z.array(z.enum(['morning', 'afternoon', 'evening'])).optional(),
  maxDistance: z.number().min(1).max(50).optional(),
});

// Helper function to generate tokens
const generateTokens = (volunteerId: string) => {
  const accessToken = jwt.sign(
    { volunteerId, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { volunteerId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
  
  return { accessToken, refreshToken };
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      volunteer?: any;
    }
  }
}

// Middleware to verify JWT token
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

// Routes
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const volunteer = await VolunteerModel.findOne({ email, isActive: true });
    if (!volunteer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await (volunteer as any).comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    volunteer.lastLogin = new Date();
    await volunteer.save();

    const { accessToken, refreshToken } = generateTokens(volunteer._id.toString());
    const refreshTokenHash = (volunteer as any).generateRefreshToken();
    
    await volunteer.save();

    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    res.json({
      token: accessToken,
      refreshToken: refreshTokenHash,
      expiresAt,
      user: volunteer.toJSON(),
    });
  } catch (e) { 
    next(e); 
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if volunteer already exists
    const existingVolunteer = await VolunteerModel.findOne({ email: data.email });
    if (existingVolunteer) {
      return res.status(400).json({ message: 'Volunteer with this email already exists' });
    }

    const volunteer = new VolunteerModel(data);
    await volunteer.save();

    const { accessToken, refreshToken } = generateTokens(volunteer._id.toString());
    const refreshTokenHash = (volunteer as any).generateRefreshToken();
    
    await volunteer.save();

    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    res.status(201).json({
      token: accessToken,
      refreshToken: refreshTokenHash,
      expiresAt,
      user: volunteer.toJSON(),
    });
  } catch (e) { 
    next(e); 
  }
});

router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const volunteer = req.volunteer;
    if (!volunteer) {
      return res.status(401).json({ message: 'No authenticated user' });
    }
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Remove the current refresh token
    volunteer.refreshTokens = volunteer.refreshTokens.filter(
      (t: any) => t.token !== token
    );
    
    await volunteer.save();
    
    res.json({ message: 'Logged out successfully' });
  } catch (e) { 
    next(e); 
  }
});

router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    if (!req.volunteer) {
      return res.status(401).json({ message: 'No authenticated user' });
    }
    res.json(req.volunteer.toJSON());
  } catch (e) { 
    next(e); 
  }
});

router.patch('/profile', authenticateToken, async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    
    const volunteer = req.volunteer;
    if (!volunteer) {
      return res.status(401).json({ message: 'No authenticated user' });
    }
    
    Object.assign(volunteer, data);
    await volunteer.save();
    
    res.json(volunteer.toJSON());
  } catch (e) { 
    next(e); 
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const volunteer = await VolunteerModel.findOne({
      'refreshTokens.token': refreshToken,
      'refreshTokens.expiresAt': { $gt: new Date() }
    });

    if (!volunteer) {
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    // Clean expired tokens
    (volunteer as any).cleanExpiredTokens();
    
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(volunteer._id.toString());
    const newRefreshTokenHash = (volunteer as any).generateRefreshToken();
    
    await volunteer.save();

    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    res.json({
      token: accessToken,
      refreshToken: newRefreshTokenHash,
      expiresAt,
    });
  } catch (e) { 
    next(e); 
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const volunteer = await VolunteerModel.findOne({ email, isActive: true });
    if (!volunteer) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If the email exists, a password reset link has been sent' });
    }

    // In a real app, you would send an email with reset link
    // For now, just return success
    res.json({ message: 'If the email exists, a password reset link has been sent' });
  } catch (e) { 
    next(e); 
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    // In a real app, you would verify the reset token
    // For now, just return success
    res.json({ message: 'Password reset successfully' });
  } catch (e) { 
    next(e); 
  }
});

export default router;
