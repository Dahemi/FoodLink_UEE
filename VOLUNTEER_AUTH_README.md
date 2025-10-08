# Volunteer Authentication System

This document describes the implementation of a separate authentication system for volunteers in the FoodLink application.

## Overview

The volunteer authentication system provides:
- Secure login/registration for volunteers
- Protected volunteer routes
- User profile management
- Session management with JWT tokens
- Role-based access control

## Architecture

### Frontend Components

1. **Authentication Context** (`context/AuthContext.tsx`)
   - Manages volunteer authentication state
   - Handles login, registration, logout
   - Token management and refresh

2. **Login Screen** (`app/volunteer-login.tsx`)
   - Volunteer registration and login form
   - Profile setup during registration
   - Availability and preferences configuration

3. **Protected Routes** (`components/ProtectedRoute.tsx`)
   - Route protection based on authentication
   - Role-based access control
   - Automatic redirects

4. **API Service** (`services/volunteerAuthApi.ts`)
   - HTTP client for authentication endpoints
   - Token management
   - Error handling

### Backend Components

1. **User Model** (`backend/src/auth/model.ts`)
   - Volunteer user schema with Mongoose
   - Password hashing with bcrypt
   - Refresh token management

2. **Authentication Routes** (`backend/src/auth/routes.ts`)
   - Login/register endpoints
   - JWT token generation
   - Profile management
   - Password reset functionality

## Features

### Registration
- Email and password validation
- Profile information collection
- Vehicle type selection
- Availability preferences
- Time slot preferences
- Maximum distance setting

### Authentication
- Secure password hashing
- JWT access tokens (1 hour expiry)
- Refresh tokens (7 days expiry)
- Automatic token refresh
- Session management

### Profile Management
- Update personal information
- Modify availability
- Change preferences
- Vehicle type updates

### Security
- Password hashing with bcrypt
- JWT token authentication
- Refresh token rotation
- Secure session storage
- Input validation with Zod

## API Endpoints

### Authentication
- `POST /api/auth/volunteer/login` - Login
- `POST /api/auth/volunteer/register` - Register
- `POST /api/auth/volunteer/logout` - Logout
- `POST /api/auth/volunteer/refresh` - Refresh token

### Profile
- `GET /api/auth/volunteer/profile` - Get profile
- `PATCH /api/auth/volunteer/profile` - Update profile

### Password Management
- `POST /api/auth/volunteer/forgot-password` - Request password reset
- `POST /api/auth/volunteer/reset-password` - Reset password

## Usage

### For Volunteers

1. **Registration**
   - Select "Volunteer" role on role selection screen
   - Fill out registration form with personal details
   - Set availability and preferences
   - Create account

2. **Login**
   - Enter email and password
   - Access volunteer dashboard
   - Manage tasks and profile

3. **Profile Management**
   - Update personal information
   - Modify availability schedule
   - Change vehicle preferences

### For Developers

1. **Environment Setup**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Set environment variables
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Database Setup**
   ```bash
   # Start MongoDB
   mongod
   
   # Run backend
   npm run dev
   ```

3. **Frontend Integration**
   ```typescript
   // Use authentication context
   import { useAuth } from '../context/AuthContext';
   
   const { authState, login, logout } = useAuth();
   ```

## Security Considerations

1. **Password Security**
   - Minimum 6 character passwords
   - Bcrypt hashing with salt rounds
   - No plain text password storage

2. **Token Security**
   - Short-lived access tokens (1 hour)
   - Refresh token rotation
   - Secure token storage

3. **Input Validation**
   - Zod schema validation
   - Email format validation
   - Phone number validation
   - Address validation

4. **Session Management**
   - Automatic logout on token expiry
   - Secure token refresh
   - Cleanup of expired tokens

## Future Enhancements

1. **Email Verification**
   - Email confirmation on registration
   - Resend verification emails

2. **Password Reset**
   - Email-based password reset
   - Secure reset token generation

3. **Two-Factor Authentication**
   - SMS-based 2FA
   - Authenticator app support

4. **Social Login**
   - Google OAuth integration
   - Facebook login support

5. **Profile Pictures**
   - Image upload functionality
   - Avatar management

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check API URL configuration
   - Verify backend is running
   - Check network connectivity

2. **Token Expiry**
   - Automatic refresh should handle this
   - Manual logout/login if needed

3. **Registration Issues**
   - Validate all required fields
   - Check email format
   - Ensure unique email address

### Debug Mode

Enable debug logging by setting:
```typescript
// In AuthContext.tsx
console.log('Auth state:', authState);
console.log('API response:', response);
```

## Dependencies

### Frontend
- `@react-native-async-storage/async-storage` - Local storage
- `react-native-paper` - UI components
- `expo-router` - Navigation

### Backend
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `mongoose` - Database ODM
- `zod` - Schema validation
- `express` - Web framework

## Testing

### Manual Testing
1. Test registration flow
2. Test login/logout
3. Test protected routes
4. Test profile updates
5. Test token refresh

### Automated Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test
```

## Deployment

### Backend Deployment
1. Set production environment variables
2. Configure MongoDB connection
3. Set secure JWT secrets
4. Enable HTTPS

### Frontend Deployment
1. Configure API URL
2. Set up environment variables
3. Build and deploy

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check backend logs
4. Verify environment configuration
