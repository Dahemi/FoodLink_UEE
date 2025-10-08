# FoodLink Stakeholder Models

## Overview

This document describes the separate database models for each stakeholder type in the FoodLink application. Each stakeholder has their own dedicated model with specific fields and CASCADE delete operations.

## Stakeholder Models

### 1. Donor Model (`donors`)
**File**: `backend/src/models/Donor.ts`

**Purpose**: Individuals or businesses who donate food

**Key Fields**:
- Basic info: email, password, name, phone, address (with coordinates)
- Donor-specific: donorType, businessName, businessLicense, averageDonationFrequency
- Statistics: totalDonations, totalMealsProvided, averageRating
- Preferences: preferredPickupTimes, specialInstructions

**CASCADE Deletes**:
- All donations by this donor
- Related claims, volunteer tasks, pickup events
- Messages, feedback, and notifications

### 2. NGO Model (`ngos`)
**File**: `backend/src/models/NGO.ts`

**Purpose**: Non-governmental organizations that claim and distribute food

**Key Fields**:
- Basic info: email, password, name, phone, address (with coordinates)
- NGO-specific: registrationNumber, organizationType, servingAreas, capacity
- Operations: operatingHours, certifications, website, description
- Statistics: totalClaims, totalMealsDistributed, totalVolunteersManaged

**CASCADE Deletes**:
- All claims by this NGO
- Related volunteer tasks and pickup events
- Messages, feedback, and notifications

### 3. Volunteer Model (`volunteers`)
**File**: `backend/src/models/Volunteer.ts`

**Purpose**: Individuals who pick up and deliver food donations

**Key Fields**:
- Basic info: email, password, name, phone, address (with coordinates)
- Volunteer-specific: vehicleType, availability, preferredTimeSlots, maxDistance
- Emergency contact information
- Statistics: completedTasks, totalDeliveries, mealsDelivered, totalHours

**CASCADE Deletes**:
- All volunteer tasks assigned to this volunteer
- Related pickup events
- Messages, feedback, and notifications

### 4. Beneficiary Model (`beneficiaries`)
**File**: `backend/src/models/Beneficiary.ts`

**Purpose**: Individuals or families who receive food distributions

**Key Fields**:
- Basic info: email, password, name, phone, address (with coordinates)
- Beneficiary-specific: householdSize, dietaryRestrictions, preferredNGOs
- Verification: verificationStatus, emergencyContact
- Statistics: totalMealsReceived, totalPickups

**CASCADE Deletes**:
- Messages, feedback, and notifications
- (No donations/tasks to delete as beneficiaries don't create them)

## Model Relationships

### Reference Structure
```
Donation.donorId → Donor._id
Claim.ngoId → NGO._id
VolunteerTask.volunteerId → Volunteer._id
VolunteerTask.donorId → Donor._id
VolunteerTask.ngoId → NGO._id
PickupEvent.volunteerId → Volunteer._id
PickupEvent.donorId → Donor._id
PickupEvent.ngoId → NGO._id
```

### Cross-Model References
- **Messages**: senderId can reference any stakeholder type
- **Feedback**: reviewerId and revieweeId can reference any stakeholder type
- **Notifications**: recipientId can reference any stakeholder type (with recipientType field)

## Common Features

All stakeholder models include:

### Authentication & Security
- Password hashing with bcrypt (12 salt rounds)
- JWT refresh token management
- Email verification tokens
- Password reset tokens

### Location Support
- Structured address with coordinates
- 2dsphere indexes for location-based queries
- Virtual `fullAddress` field

### Statistics Tracking
- Role-specific metrics and counters
- Average ratings and total interactions
- Performance indicators

### Notification Preferences
- Email, push, SMS preferences
- Role-specific notification types
- Quiet hours and frequency capping support

### Data Integrity
- CASCADE delete operations
- Proper indexing for performance
- Validation and constraints
- JSON transformation (excludes sensitive data)

## CASCADE Delete Operations

When a stakeholder is deleted, the system automatically removes:

### Donor Deletion
1. All donations created by the donor
2. All claims on those donations
3. All volunteer tasks related to those donations
4. All pickup events for those tasks
5. All messages sent by the donor
6. All feedback given by or about the donor
7. All notifications for the donor

### NGO Deletion
1. All claims made by the NGO
2. All volunteer tasks assigned by the NGO
3. All pickup events managed by the NGO
4. All messages sent by the NGO
5. All feedback given by or about the NGO
6. All notifications for the NGO

### Volunteer Deletion
1. All volunteer tasks assigned to the volunteer
2. All pickup events performed by the volunteer
3. All messages sent by the volunteer
4. All feedback given by or about the volunteer
5. All notifications for the volunteer

### Beneficiary Deletion
1. All messages sent by the beneficiary
2. All feedback given by or about the beneficiary
3. All notifications for the beneficiary

## Usage Examples

### Creating Stakeholders
```javascript
// Create a donor
const donor = new DonorModel({
  email: 'restaurant@example.com',
  password: 'securepassword',
  name: 'Green Restaurant',
  donorType: 'restaurant',
  address: {
    street: '123 Main St',
    city: 'Colombo',
    state: 'Western',
    zipCode: '00100',
    coordinates: { latitude: 6.9271, longitude: 79.8612 }
  }
});

// Create an NGO
const ngo = new NGOModel({
  email: 'help@ngo.org',
  password: 'securepassword',
  name: 'Food for All NGO',
  registrationNumber: 'NGO-2023-001',
  organizationType: 'charity',
  address: { /* address object */ }
});

// Create a volunteer
const volunteer = new VolunteerModel({
  email: 'volunteer@example.com',
  password: 'securepassword',
  name: 'John Doe',
  vehicleType: 'car',
  address: { /* address object */ }
});
```

### Querying with Relationships
```javascript
// Find donations with donor information
const donations = await DonationModel.find()
  .populate('donorId', 'name donorType address')
  .exec();

// Find volunteer tasks with all related information
const tasks = await VolunteerTaskModel.find()
  .populate('volunteerId', 'name phone vehicleType')
  .populate('donorId', 'name address')
  .populate('ngoId', 'name organizationType')
  .exec();
```

### Location-Based Queries
```javascript
// Find NGOs within 10km of a location
const nearbyNGOs = await NGOModel.find({
  'address.coordinates': {
    $near: {
      $geometry: { type: 'Point', coordinates: [lng, lat] },
      $maxDistance: 10000 // 10km in meters
    }
  }
});
```

## Migration from Unified User Model

If migrating from a unified User model:

1. **Data Migration**: Extract users by type and migrate to appropriate models
2. **Reference Updates**: Update all foreign key references
3. **Index Recreation**: Rebuild indexes for new model structure
4. **Validation**: Ensure all relationships are properly maintained

## Performance Considerations

### Indexing Strategy
- Email indexes on all models for login
- Location indexes for proximity queries
- Compound indexes for status + timestamp queries
- Foreign key indexes for relationship queries

### Query Optimization
- Use populate() selectively to avoid over-fetching
- Implement pagination for large result sets
- Use aggregation pipelines for complex analytics
- Cache frequently accessed data

This separate model approach provides better type safety, clearer business logic, and more efficient queries while maintaining data integrity through CASCADE operations.
