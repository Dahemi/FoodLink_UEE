import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '4000'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database - MUST use environment variable for production
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/foodlink',

  // JWT - MUST use strong secrets in production
  JWT_SECRET:
    process.env.JWT_SECRET ||
    'your-super-secret-jwt-key-change-this-in-production',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    'your-super-secret-refresh-key-change-this-in-production',
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d',

  // CORS - Allow your production domain
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',

  // File uploads
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ],

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || '100'
  ),

  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE || '20'),
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE || '100'),
};

// Validate required environment variables in production
export const validateEnvironment = (): void => {
  if (config.NODE_ENV === 'production') {
    const required = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }

    // Warn if using default secrets
    if (config.JWT_SECRET.includes('change-this')) {
      console.warn('⚠️  WARNING: Using default JWT_SECRET in production!');
    }
  }
};
