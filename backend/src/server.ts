import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, validateEnvironment } from './config/environment.js';
import { connectDatabase, setupGracefulShutdown } from './config/database.js';
import apiRoutes from './routes/index.js';
import donorAuthRoutes from './routes/donorAuthRoutes.js';
import donationRoutes from './routes/donationRoutes.js';

// Validate environment variables
validateEnvironment();

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API routes
app.use('/api', apiRoutes);
//app.use('/api/auth/volunteer', volunteerAuthRoutes);
app.use('/api/auth/donor', donorAuthRoutes);
app.use('/api/donations', donationRoutes);

// Global error handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Global error handler:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors,
      });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `${field} already exists`,
      });
    }

    // Zod validation error
    if (err.name === 'ZodError') {
      const errors = err.issues.map((issue: any) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        errors,
      });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }

    // Default error
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  }
);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

async function start() {
  try {
    // Connect to database
    await connectDatabase();

    // Setup graceful shutdown
    setupGracefulShutdown();

    // Start server
    app.listen(config.PORT, '0.0.0.0', () => {
      console.log(`🚀 FoodLink API running on http://0.0.0.0:${config.PORT}`);
      console.log(`📝 Environment: ${config.NODE_ENV}`);
      console.log(`📊 API Info: http://0.0.0.0:${config.PORT}/api/info`);
    });
  } catch (e) {
    console.error('Failed to start server', e);
    process.exit(1);
  }
}

start();
