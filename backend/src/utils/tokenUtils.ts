import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = '1h';
const JWT_REFRESH_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  userType: 'volunteer' | 'donor' | 'ngo' | 'beneficiary';
  type: 'access' | 'refresh';
}

// Generate access and refresh tokens for any user type
export const generateTokens = (userId: string, userType: 'volunteer' | 'donor' | 'ngo' | 'beneficiary') => {
  const userIdField = `${userType}Id`;
  
  const accessToken = jwt.sign(
    { [userIdField]: userId, userType, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { [userIdField]: userId, userType, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
  
  return { accessToken, refreshToken };
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.volunteerId || decoded.donorId || decoded.ngoId || decoded.beneficiaryId,
      userType: decoded.userType,
      type: 'access'
    };
  } catch (error) {
    return null;
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    return {
      userId: decoded.volunteerId || decoded.donorId || decoded.ngoId || decoded.beneficiaryId,
      userType: decoded.userType,
      type: 'refresh'
    };
  } catch (error) {
    return null;
  }
};

// Generate verification token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate password reset token
export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
