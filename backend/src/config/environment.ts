import dotenv from 'dotenv';

// Load environment variables - try multiple approaches
const result = dotenv.config();
if (result.error) {
  console.log('dotenv.config() error:', result.error);
  // Try alternative path
  const altResult = dotenv.config({ path: '.env' });
  if (altResult.error) {
    console.log('Alternative dotenv.config() error:', altResult.error);
  }
}

// Environment configuration
export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '4000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/foodlink',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  
  // Email (for future use)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER || 'your-email@gmail.com',
  SMTP_PASS: process.env.SMTP_PASS || 'your-app-password',
  
  // File uploads
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE || '20'),
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE || '100'),
};

// Validate required environment variables
export const validateEnvironment = (): void => {
  const requiredVars = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.warn(`Warning: ${varName} environment variable is not set`);
    }
  }
  
  console.log('Environment check:');
  console.log('NODE_ENV:', config.NODE_ENV);
  console.log('PORT:', config.PORT);
  console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'Not found');
};
