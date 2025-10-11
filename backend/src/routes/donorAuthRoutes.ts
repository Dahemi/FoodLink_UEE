import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { DonorModel } from '../models/Donor.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
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
  address: z.string().min(10),
  donorType: z.enum([
    'individual',
    'restaurant',
    'hotel',
    'catering',
    'grocery',
    'bakery',
    'other',
  ]),
  businessName: z.string().optional(),
  averageDonationFrequency: z
    .enum(['daily', 'weekly', 'monthly', 'occasional'])
    .optional(),
  preferredPickupTimes: z.array(z.string()).optional(),
  specialInstructions: z.string().max(500).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  address: z.string().min(10).optional(),
  donorType: z
    .enum([
      'individual',
      'restaurant',
      'hotel',
      'catering',
      'grocery',
      'bakery',
      'other',
    ])
    .optional(),
  businessName: z.string().optional(),
  averageDonationFrequency: z
    .enum(['daily', 'weekly', 'monthly', 'occasional'])
    .optional(),
  preferredPickupTimes: z.array(z.string()).optional(),
  specialInstructions: z.string().max(500).optional(),
});

// Helper function to generate tokens
const generateTokens = (donorId: string) => {
  const accessToken = jwt.sign({ donorId, type: 'access' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    { donorId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

// Helper to parse address string into structured format
function parseAddress(addressStr: string) {
  const parts = addressStr.split(',').map((s) => s.trim());
  return {
    street: parts[0] || addressStr,
    city: parts[1] || 'Colombo',
    state: parts[2] || 'Western Province',
    zipCode: parts[3] || '00000',
    country: 'Sri Lanka',
    coordinates: {
      latitude: 6.9271,
      longitude: 79.8612,
    },
  };
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      donor?: any;
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
    const donor = await DonorModel.findById(decoded.donorId);

    if (!donor || !donor.isActive) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.donor = donor;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Routes
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const donor = await DonorModel.findOne({ email, isActive: true });
    if (!donor) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await (donor as any).comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    donor.lastLogin = new Date();
    await donor.save();

    const { accessToken, refreshToken } = generateTokens(donor._id.toString());
    const refreshTokenHash = (donor as any).generateRefreshToken();

    await donor.save();

    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    res.json({
      token: accessToken,
      refreshToken: refreshTokenHash,
      expiresAt,
      user: donor.toJSON(),
    });
  } catch (e) {
    next(e);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if donor already exists
    const existingDonor = await DonorModel.findOne({ email: data.email });
    if (existingDonor) {
      return res
        .status(400)
        .json({ message: 'Donor with this email already exists' });
    }

    // Parse address
    const addressData = parseAddress(data.address);

    const donor = new DonorModel({
      ...data,
      address: addressData,
    });
    await donor.save();

    const { accessToken, refreshToken } = generateTokens(donor._id.toString());
    const refreshTokenHash = (donor as any).generateRefreshToken();

    await donor.save();

    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    res.status(201).json({
      token: accessToken,
      refreshToken: refreshTokenHash,
      expiresAt,
      user: donor.toJSON(),
    });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const donor = req.donor;
    if (!donor) {
      return res.status(401).json({ message: 'No authenticated user' });
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Remove the current refresh token
    donor.refreshTokens = donor.refreshTokens.filter(
      (t: any) => t.token !== token
    );

    await donor.save();

    res.json({ message: 'Logged out successfully' });
  } catch (e) {
    next(e);
  }
});

router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    if (!req.donor) {
      return res.status(401).json({ message: 'No authenticated user' });
    }
    res.json(req.donor.toJSON());
  } catch (e) {
    next(e);
  }
});

router.patch('/profile', authenticateToken, async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const donor = req.donor;
    if (!donor) {
      return res.status(401).json({ message: 'No authenticated user' });
    }

    // Update address if provided
    if (data.address) {
      donor.address = parseAddress(data.address);
    }

    // Update other fields
    Object.keys(data).forEach((key) => {
      if (key !== 'address' && data[key as keyof typeof data] !== undefined) {
        (donor as any)[key] = data[key as keyof typeof data];
      }
    });

    await donor.save();

    res.json(donor.toJSON());
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

    const donor = await DonorModel.findOne({
      'refreshTokens.token': refreshToken,
      'refreshTokens.expiresAt': { $gt: new Date() },
    });

    if (!donor) {
      return res
        .status(403)
        .json({ message: 'Invalid or expired refresh token' });
    }

    // Clean expired tokens
    (donor as any).cleanExpiredTokens();

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      donor._id.toString()
    );
    const newRefreshTokenHash = (donor as any).generateRefreshToken();

    await donor.save();

    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

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

    const donor = await DonorModel.findOne({ email, isActive: true });
    if (!donor) {
      // Don't reveal if email exists or not
      return res.json({
        message: 'If the email exists, a password reset link has been sent',
      });
    }

    // Generate password reset token
    const resetToken = (donor as any).generatePasswordResetToken();
    await donor.save();

    // In a real app, you would send an email with reset link
    // For now, just return success
    res.json({
      message: 'If the email exists, a password reset link has been sent',
    });
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
