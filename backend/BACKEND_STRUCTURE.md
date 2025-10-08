# FoodLink Backend Structure

## 📁 Organized File Structure

```
backend/src/
├── config/                     # Configuration files
│   ├── database.ts             # Database connection and setup
│   └── environment.ts          # Environment variables and validation
│
├── middleware/                 # Express middleware
│   └── authMiddleware.ts       # Authentication and authorization
│
├── models/                     # Database models (Mongoose schemas)
│   ├── Donor.ts               # Donor model with CASCADE delete
│   ├── NGO.ts                 # NGO model with CASCADE delete
│   ├── Volunteer.ts           # Volunteer model with CASCADE delete
│   ├── Beneficiary.ts         # Beneficiary model with CASCADE delete
│   ├── Donation.ts            # Donation model
│   ├── Claim.ts               # Claim model
│   ├── VolunteerTask.ts       # Volunteer task model
│   ├── PickupEvent.ts         # Pickup event tracking model
│   ├── Message.ts             # Message and conversation models
│   ├── Feedback.ts            # Feedback and rating model
│   ├── Notification.ts        # Notification model
│   └── index.ts               # Model exports and documentation
│
├── routes/                     # API route handlers
│   ├── volunteerAuthRoutes.ts  # Volunteer authentication
│   ├── donorAuthRoutes.ts      # Donor authentication
│   ├── ngoAuthRoutes.ts        # NGO authentication
│   ├── beneficiaryAuthRoutes.ts# Beneficiary authentication
│   ├── donationRoutes.ts       # Donation management
│   ├── volunteerTaskRoutes.ts  # Volunteer task management (legacy)
│   └── index.ts                # Route aggregation and API info
│
├── utils/                      # Utility functions
│   ├── tokenUtils.ts           # JWT token generation and validation
│   ├── validationSchemas.ts    # Zod validation schemas
│   └── responseUtils.ts        # Standardized API responses
│
└── server.ts                   # Main server file
```

## 🎯 Key Improvements

### 1. **Organized Structure**
- **Separation of Concerns**: Each directory has a specific purpose
- **CamelCase Naming**: All files use descriptive camelCase names
- **Logical Grouping**: Related functionality grouped together

### 2. **Stakeholder-Specific Models**
- **Donor.ts**: Food donors (individuals/businesses)
- **NGO.ts**: Non-governmental organizations
- **Volunteer.ts**: Food delivery volunteers  
- **Beneficiary.ts**: Food recipients

### 3. **CASCADE Delete Operations**
- **Data Integrity**: Automatic cleanup when stakeholders are deleted
- **Referential Integrity**: Maintains database consistency
- **Performance**: Prevents orphaned records

### 4. **Standardized Authentication**
- **Multi-Type Auth**: Support for all stakeholder types
- **Token Management**: Centralized JWT handling
- **Role-Based Access**: Proper authorization middleware

### 5. **Utility Functions**
- **Response Standardization**: Consistent API responses
- **Validation Schemas**: Reusable Zod schemas
- **Token Management**: Centralized token utilities

## 🚀 API Endpoints

### Authentication Endpoints
```
POST /api/auth/volunteer/register
POST /api/auth/volunteer/login
POST /api/auth/volunteer/logout
GET  /api/auth/volunteer/profile
PATCH /api/auth/volunteer/profile

POST /api/auth/donor/register
POST /api/auth/donor/login
POST /api/auth/donor/logout
GET  /api/auth/donor/profile
PATCH /api/auth/donor/profile

POST /api/auth/ngo/register
POST /api/auth/ngo/login
POST /api/auth/ngo/logout
GET  /api/auth/ngo/profile
PATCH /api/auth/ngo/profile

POST /api/auth/beneficiary/register
POST /api/auth/beneficiary/login
POST /api/auth/beneficiary/logout
GET  /api/auth/beneficiary/profile
PATCH /api/auth/beneficiary/profile
```

### Feature Endpoints
```
GET    /api/donations           # Browse available donations (NGOs)
POST   /api/donations           # Create donation (Donors)
GET    /api/donations/:id       # Get donation details
PATCH  /api/donations/:id       # Update donation (Donors)
DELETE /api/donations/:id       # Delete donation (Donors)
POST   /api/donations/:id/interest # Express interest (NGOs)

GET  /api/volunteer/tasks       # Get volunteer tasks (Legacy)
POST /api/volunteer/tasks       # Create task (Legacy)
GET  /api/volunteer/stats       # Get volunteer stats (Legacy)
```

### Utility Endpoints
```
GET /api/health                 # Health check
GET /api/info                   # API information
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
MONGO_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key

# Server
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Database Connection
- **Connection Pooling**: Optimized for performance
- **Error Handling**: Comprehensive error management
- **Graceful Shutdown**: Clean database disconnection

## 🛡️ Security Features

### Authentication
- **bcrypt Password Hashing**: 12 salt rounds
- **JWT Tokens**: Access and refresh token system
- **Token Rotation**: Automatic refresh token rotation
- **Multi-Model Auth**: Support for all stakeholder types

### Authorization
- **Role-Based Access**: Stakeholder-specific permissions
- **Resource Ownership**: Users can only access their own data
- **Verification Requirements**: Optional verification checks

### Data Protection
- **Sensitive Data Exclusion**: Passwords and tokens excluded from JSON
- **Input Validation**: Comprehensive Zod schema validation
- **SQL Injection Protection**: Mongoose ODM protection

## 📊 Performance Optimizations

### Database Indexing
- **Location Indexes**: 2dsphere for GPS queries
- **Compound Indexes**: Status + timestamp combinations
- **Unique Constraints**: Email and registration numbers
- **Foreign Key Indexes**: All reference fields

### Response Optimization
- **Pagination**: Built-in pagination support
- **Selective Population**: Only populate needed fields
- **Lean Queries**: Use lean() for read-only operations
- **Aggregation Pipelines**: Efficient data aggregation

## 🔄 Migration Guide

### From Old Structure
1. **Import Updates**: Update all import statements
2. **Route Updates**: Use new route structure
3. **Model Updates**: Use specific stakeholder models
4. **Middleware Updates**: Use new authentication middleware

### Example Migration
```javascript
// Old
import { VolunteerModel } from './auth/model.js';

// New
import { VolunteerModel } from './models/Volunteer.js';
// or
import { VolunteerModel } from './models/index.js';
```

## 🧪 Testing

### Model Testing
```javascript
import { VolunteerModel, DonorModel, NGOModel } from './models/index.js';

// Test CASCADE delete
const volunteer = await VolunteerModel.findById(id);
await volunteer.deleteOne(); // Automatically deletes related data
```

### Route Testing
```bash
# Test authentication
curl -X POST http://localhost:4000/api/auth/volunteer/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123",...}'

# Test API info
curl http://localhost:4000/api/info
```

## 📈 Scalability

### Horizontal Scaling
- **Stateless Design**: No server-side sessions
- **Database Sharding**: Ready for MongoDB sharding
- **Load Balancing**: Supports multiple server instances

### Performance Monitoring
- **Database Metrics**: Connection pool monitoring
- **Response Times**: Built-in timing middleware
- **Error Tracking**: Comprehensive error logging

This organized structure provides a solid foundation for team development, with clear separation of concerns and scalable architecture.
