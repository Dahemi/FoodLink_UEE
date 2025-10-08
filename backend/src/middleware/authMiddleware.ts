import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { VolunteerModel } from '../models/Volunteer.js';
import { DonorModel } from '../models/Donor.js';
import { NGOModel } from '../models/NGO.js';
import { BeneficiaryModel } from '../models/Beneficiary.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      volunteer?: any;
      donor?: any;
      ngo?: any;
      beneficiary?: any;
      user?: any; // Generic user for any stakeholder type
      userType?: 'volunteer' | 'donor' | 'ngo' | 'beneficiary';
    }
  }
}

// Generic authentication middleware
export const authenticateToken = (userType: 'volunteer' | 'donor' | 'ngo' | 'beneficiary') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      let user = null;
      let userIdField = '';

      // Get user based on type
      switch (userType) {
        case 'volunteer':
          userIdField = 'volunteerId';
          user = await VolunteerModel.findById(decoded.volunteerId);
          req.volunteer = user;
          break;
        case 'donor':
          userIdField = 'donorId';
          user = await DonorModel.findById(decoded.donorId);
          req.donor = user;
          break;
        case 'ngo':
          userIdField = 'ngoId';
          user = await NGOModel.findById(decoded.ngoId);
          req.ngo = user;
          break;
        case 'beneficiary':
          userIdField = 'beneficiaryId';
          user = await BeneficiaryModel.findById(decoded.beneficiaryId);
          req.beneficiary = user;
          break;
      }

      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      req.user = user;
      req.userType = userType;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  };
};

// Specific middleware for each user type
export const authenticateVolunteer = authenticateToken('volunteer');
export const authenticateDonor = authenticateToken('donor');
export const authenticateNGO = authenticateToken('ngo');
export const authenticateBeneficiary = authenticateToken('beneficiary');

// Multi-type authentication (for endpoints that accept multiple user types)
export const authenticateAnyUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    let user = null;
    let userType = '';

    // Try to find user in each model
    if (decoded.volunteerId) {
      user = await VolunteerModel.findById(decoded.volunteerId);
      userType = 'volunteer';
      req.volunteer = user;
    } else if (decoded.donorId) {
      user = await DonorModel.findById(decoded.donorId);
      userType = 'donor';
      req.donor = user;
    } else if (decoded.ngoId) {
      user = await NGOModel.findById(decoded.ngoId);
      userType = 'ngo';
      req.ngo = user;
    } else if (decoded.beneficiaryId) {
      user = await BeneficiaryModel.findById(decoded.beneficiaryId);
      userType = 'beneficiary';
      req.beneficiary = user;
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    req.userType = userType as any;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userType || !allowedRoles.includes(req.userType)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Verification requirement middleware
export const requireVerified = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({ message: 'Account verification required' });
  }
  next();
};
