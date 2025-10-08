# FoodLink Database Schema Documentation

## Overview

This document describes the comprehensive database schema for the FoodLink application, designed to support all stakeholder interactions and business flows.

## Core Entities

### 1. User Model (`users`)
**Purpose**: Unified model for all stakeholder types (donors, NGOs, volunteers, beneficiaries)

**Key Features**:
- Single table for all user types with type-specific details
- Location-based indexing for proximity matching
- Comprehensive authentication and authorization
- Statistics tracking for each user type
- Notification preferences

**Stakeholder-Specific Fields**:
- **Donors**: Business type, donation frequency, pickup preferences
- **NGOs**: Registration details, service areas, capacity, certifications
- **Volunteers**: Vehicle type, availability, preferred time slots, emergency contacts
- **Beneficiaries**: Household size, dietary restrictions, verification status

### 2. Donation Model (`donations`)
**Purpose**: Food donations posted by donors

**Key Features**:
- Detailed food information (type, quantity, expiry, allergens)
- Location and pickup scheduling
- Status tracking through donation lifecycle
- Image attachments and rich descriptions
- Visibility controls and NGO restrictions
- Expiry and urgency calculations

**Status Flow**: `available` → `claimed` → `pickup_scheduled` → `picked_up` → `delivered` → `completed`

### 3. Claim Model (`claims`)
**Purpose**: NGO claims on available donations

**Key Features**:
- Distribution planning and beneficiary targeting
- Volunteer assignment and coordination
- Approval workflow with donor response
- Issue tracking and resolution
- Communication logging
- Performance metrics

**Status Flow**: `pending` → `approved` → `volunteer_assigned` → `pickup_scheduled` → `in_progress` → `completed`

### 4. VolunteerTask Model (`volunteer_tasks`)
**Purpose**: Detailed task assignments for volunteers

**Key Features**:
- Comprehensive location and timing information
- Real-time status tracking
- Evidence collection (photos, signatures)
- Route optimization and logistics
- Issue reporting and resolution
- Performance analytics

**Status Flow**: `assigned` → `accepted` → `en_route_pickup` → `pickup_completed` → `en_route_delivery` → `completed`

### 5. PickupEvent Model (`pickup_events`)
**Purpose**: Real-time tracking of pickup and delivery events

**Key Features**:
- GPS location tracking with updates
- Food condition assessment
- Digital signatures and confirmations
- Weather and environmental factors
- Incident reporting and management
- Efficiency calculations

### 6. Message & Conversation Models (`messages`, `conversations`)
**Purpose**: Communication system between all stakeholders

**Key Features**:
- Context-aware messaging (linked to donations, tasks, etc.)
- Rich media support (images, documents, location)
- Read receipts and delivery tracking
- Message reactions and threading
- Group conversations and participant management
- Moderation and content filtering

### 7. Feedback Model (`feedbacks`)
**Purpose**: Comprehensive review and rating system

**Key Features**:
- Multi-dimensional rating criteria
- Stakeholder-specific feedback types
- Improvement suggestions and action tracking
- Helpfulness voting and moderation
- Sentiment analysis and categorization
- Impact measurement and follow-up

### 8. Notification Model (`notifications`)
**Purpose**: Multi-channel notification and alert system

**Key Features**:
- Rich push notifications with actions
- Multi-channel delivery (push, email, SMS)
- Scheduling and expiry management
- A/B testing and personalization
- Analytics and engagement tracking
- Frequency capping and quiet hours

## Relationships and Data Flow

### Primary Business Flow
```
Donor → Donation → Claim → VolunteerTask → PickupEvent → Feedback
```

### Communication Flow
```
All entities can have:
├── Messages (context-aware)
├── Notifications (real-time alerts)
└── Feedback (post-interaction reviews)
```

### Key Relationships

1. **User → Donation** (1:N) - Donors create multiple donations
2. **Donation → Claim** (1:N) - Multiple NGOs can express interest
3. **Claim → VolunteerTask** (1:1) - Each approved claim becomes a task
4. **VolunteerTask → PickupEvent** (1:1) - Real-time tracking of task execution
5. **All Entities → Message** (N:N) - Context-aware communication
6. **All Entities → Feedback** (N:N) - Cross-stakeholder reviews
7. **User → Notification** (1:N) - Personalized alerts and updates

## Indexing Strategy

### Performance Indexes
- **Location-based**: 2dsphere indexes on coordinate fields
- **Time-based**: Indexes on scheduling and expiry fields
- **Status-based**: Compound indexes on status and timestamps
- **User-based**: Indexes on all user reference fields
- **Search-based**: Text indexes on searchable content

### Key Indexes
```javascript
// Location queries
{ "address.coordinates": "2dsphere" }
{ "pickupLocation.coordinates": "2dsphere" }

// Time-based queries
{ "expiryDateTime": 1 }
{ "scheduledPickupTime": 1 }
{ "createdAt": -1 }

// Status and filtering
{ "status": 1, "createdAt": -1 }
{ "userType": 1, "isActive": 1 }
{ "recipientId": 1, "isRead": 1 }
```

## Data Validation and Constraints

### Business Rules
1. **Donation Expiry**: Must be in the future when created
2. **Claim Timing**: Cannot claim expired donations
3. **Task Assignment**: Only verified volunteers can be assigned
4. **Location Validation**: All coordinates must be valid GPS coordinates
5. **Rating Constraints**: All ratings must be between 1-5
6. **Status Transitions**: Enforced valid status progressions

### Data Integrity
- **Referential Integrity**: All foreign keys properly referenced
- **Enum Validation**: Strict validation of status and type fields
- **Required Fields**: Essential fields marked as required
- **Length Limits**: Appropriate limits on text fields
- **Unique Constraints**: Unique identifiers and email addresses

## Security Considerations

### Data Protection
- **Password Hashing**: bcrypt with salt rounds
- **Token Management**: JWT with refresh token rotation
- **Sensitive Data**: Excluded from JSON serialization
- **Field Encryption**: Support for encrypting sensitive fields

### Access Control
- **Role-based Access**: User type determines permissions
- **Resource Ownership**: Users can only access their own data
- **Context Validation**: Ensure users have permission for context
- **API Rate Limiting**: Prevent abuse and ensure fair usage

## Scalability Features

### Performance Optimization
- **Pagination Support**: Cursor-based pagination for large datasets
- **Aggregation Pipelines**: Efficient data aggregation for analytics
- **Caching Strategy**: Redis caching for frequently accessed data
- **Connection Pooling**: Optimized database connections

### Growth Accommodation
- **Horizontal Scaling**: Sharding strategy for user-based partitioning
- **Archive Strategy**: Automatic archiving of old completed records
- **Cleanup Jobs**: Scheduled cleanup of expired and unnecessary data
- **Monitoring**: Performance monitoring and alerting

## Usage Examples

### Creating a Donation Flow
```javascript
// 1. Donor creates donation
const donation = new DonationModel({
  donorId: userId,
  title: "Fresh vegetables from restaurant",
  foodDetails: { type: "vegetables", quantity: "50 servings" },
  // ... other fields
});

// 2. NGO claims donation
const claim = new ClaimModel({
  donationId: donation._id,
  ngoId: ngoUserId,
  distributionPlan: { targetBeneficiaries: 100 }
});

// 3. Volunteer task created
const task = new VolunteerTaskModel({
  claimId: claim._id,
  volunteerId: volunteerUserId,
  // ... task details
});

// 4. Real-time tracking
const pickupEvent = new PickupEventModel({
  taskId: task._id,
  // ... event details
});
```

### Querying Nearby Donations
```javascript
// Find donations within 10km of NGO location
const nearbyDonations = await DonationModel.find({
  status: 'available',
  'pickupLocation.coordinates': {
    $near: {
      $geometry: { type: 'Point', coordinates: [lng, lat] },
      $maxDistance: 10000 // 10km in meters
    }
  }
});
```

## Migration and Versioning

### Schema Evolution
- **Backward Compatibility**: New fields added as optional
- **Migration Scripts**: Automated migration for schema changes
- **Version Tracking**: Schema version tracking in database
- **Rollback Strategy**: Safe rollback procedures for failed migrations

### Data Migration
- **Legacy Support**: Compatibility with existing volunteer model
- **Gradual Migration**: Phased migration of existing data
- **Validation**: Post-migration data validation
- **Monitoring**: Migration progress and error tracking

## Monitoring and Analytics

### Key Metrics
- **User Engagement**: Active users by type and time period
- **Donation Flow**: Conversion rates through the donation pipeline
- **Task Performance**: Volunteer efficiency and success rates
- **Communication**: Message volume and response rates
- **System Health**: Database performance and error rates

### Reporting Queries
- **Dashboard Data**: Pre-aggregated data for real-time dashboards
- **Trend Analysis**: Time-based analysis of key metrics
- **Geographic Analysis**: Location-based usage patterns
- **User Behavior**: Interaction patterns and user journeys

This schema provides a robust foundation for the FoodLink application, supporting all stakeholder needs while maintaining performance, security, and scalability.
