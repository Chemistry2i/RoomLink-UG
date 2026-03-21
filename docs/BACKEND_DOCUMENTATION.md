# RoomLink Backend Documentation

**Version:** 1.0.0  
**Last Updated:** February 21, 2026  
**Status:** Production Ready ✅

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Modules](#core-modules)
4. [Authentication & Security](#authentication--security)
5. [API Endpoints](#api-endpoints)
6. [Database Models](#database-models)
7. [Service Layer](#service-layer)
8. [Error Handling](#error-handling)
9. [Configuration](#configuration)
10. [Integration Guide](#integration-guide)
11. [Deployment](#deployment)

---

## Architecture Overview

### Technology Stack

```
Framework:        Express.js 4.x
Runtime:          Node.js
Database:         MongoDB 7.0
Caching:          Redis 7.0
Authentication:   JWT + bcryptjs
File Storage:     Cloudinary
Payment Gateway:  Stripe
Email Service:    Brevo (Sendinblue)
Job Queue:        Bull
Logging:          Winston
Documentation:    Swagger/OpenAPI
Testing:          Jest
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────────────────────┐
│          API Gateway (Express.js)                        │
│  ┌─────────────────────────────────────────────┐        │
│  │ Swagger Docs | Rate Limiting | CORS         │        │
│  │ Security Headers | Request Logging          │        │
│  └─────────────────────────────────────────────┘        │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼──┐  ┌──────▼────┐  ┌───▼───┐
│Redis │  │  MongoDB   │  │Stripe │
│Cache │  │ Database   │  │Payment│
└──────┘  └────────────┘  └───────┘

┌──────────────────────────────────────────────────────────┐
│              Application Layer                            │
│  ┌────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐    │
│  │Routes  │  │Controllers│  │Services │  │Models    │   │
│  └────────┘  └──────────┘  └─────────┘  └──────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
server/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── routes.js                 # Central routing
│   │
│   ├── config/                   # Configuration files
│   │   ├── db.js                # MongoDB connection
│   │   ├── redis.js             # Redis connection
│   │   ├── env.js               # Environment validation
│   │   └── logger.js            # Winston logger
│   │
│   ├── middlewares/              # Middleware functions
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── error.middleware.js   # Error handling
│   │   ├── role.middleware.js    # Role-based access
│   │   ├── rateLimit.middleware.js
│   │   ├── audit.middleware.js   # Request logging
│   │   ├── cache.middleware.js   # Caching logic
│   │   └── validate.middleware.js
│   │
│   ├── modules/                  # Feature modules
│   │   ├── auth/                 # Authentication
│   │   ├── user/                 # User management
│   │   ├── hostel/               # Hostel management
│   │   ├── room/                 # Room management
│   │   ├── booking/              # Booking system
│   │   ├── payment/              # Payment processing
│   │   ├── review/               # Reviews & ratings
│   │   ├── complaint/            # Complaint handling
│   │   ├── dashboard/            # Analytics
│   │   ├── report/               # Report generation
│   │   ├── audit/                # Audit trails
│   │   └── upload/               # File uploads
│   │
│   ├── services/                 # Utility services
│   │   ├── email.service.js
│   │   ├── emailHelper.js
│   │   ├── emailTemplates.js
│   │   ├── paymentReconciliationService.js
│   │   └── bookingScheduler.js
│   │
│   ├── utils/                    # Utility functions
│   │   ├── ApiError.js           # Error class
│   │   ├── ApiResponse.js        # Response wrapper
│   │   ├── asyncHandler.js       # Async middleware
│   │   └── constants.js
│   │
│   └── docs/
│       └── swagger.js            # Swagger config
│
├── .env                          # Environment variables
├── package.json
├── server.js                     # Entry point
└── jest.config.js                # Test configuration
```

---

## Core Modules

### 1. **Auth Module** 🔐

**Purpose:** User authentication, authorization, and security

**Key Features:**
- User registration with email verification
- Login with JWT tokens
- Password reset & change
- Token refresh mechanism
- Account suspension/locking
- Two-factor authentication (2FA) with TOTP
- Brute force protection

**Controllers:**
```javascript
auth.register()           // User signup
auth.login()             // User login
auth.logout()            // User logout
auth.refreshToken()      // Get new access token
auth.verifyEmail()       // Email verification
auth.resendVerificationEmail()
auth.requestPasswordReset()
auth.resetPassword()
auth.changePassword()
auth.setup2FA()          // Enable 2FA
auth.enable2FA()
auth.disable2FA()
auth.verify2FA()
```

**API Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/verify-email
POST   /api/auth/resend-verification
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/change-password
POST   /api/auth/2fa/setup
POST   /api/auth/2fa/enable
POST   /api/auth/2fa/disable
POST   /api/auth/2fa/verify
```

---

### 2. **User Module** 👤

**Purpose:** User profile management and account settings

**Key Features:**
- User profile CRUD
- Avatar uploads
- Account deletion (soft delete)
- Notification preferences
- User suspension/activation
- Admin user management

**Services (user.service.js):**
```javascript
getUserProfile()           // Get user details
updateUserProfile()        // Update name, bio, etc.
deleteUserAccount()        // Soft delete
updateUserAvatar()         // Profile picture
updateNotificationPreferences()
getUserByEmail()
emailExists()
getAllUsers()              // Admin function
suspendUserAccount()
unsuspendUserAccount()
```

**API Endpoints:**
```
GET    /api/users/profile
PATCH  /api/users/profile
DELETE /api/users/profile
PATCH  /api/users/avatar
GET    /api/users/preferences
PATCH  /api/users/preferences
GET    /api/users (admin)
PATCH  /api/users/:id/suspend (admin)
PATCH  /api/users/:id/unsuspend (admin)
```

---

### 3. **Hostel Module** 🏨

**Purpose:** Accommodation property management

**Key Features:**
- Create/update/delete hostels
- Hostel search & filtering
- Room management within hostels
- Amenities management
- Image uploads
- Hostel ratings & reviews

**Services (hostel.service.js):**
```javascript
createHostel()
getHostels()
getHostelById()
updateHostel()
deleteHostel()
searchHostels()
```

**API Endpoints:**
```
POST   /api/hostels                      # Create hostel
GET    /api/hostels                      # List all
GET    /api/hostels/:id                  # Get details
PATCH  /api/hostels/:id                  # Update
DELETE /api/hostels/:id                  # Delete
GET    /api/hostels/search               # Search
GET    /api/hostels/:hostelId/rooms      # Get rooms
POST   /api/hostels/:hostelId/rooms      # Add room
PATCH  /api/hostels/:hostelId/rooms/:roomId
DELETE /api/hostels/:hostelId/rooms/:roomId
```

---

### 4. **Room Module** 🛏️

**Purpose:** Individual room management within hostels

**Key Features:**
- Room availability checking
- Dynamic pricing with discounts
- Occupancy rate calculation
- Revenue tracking
- Room images & amenities
- Bed configuration management

**Services (room.service.js):**
```javascript
checkRoomAvailability()    // Check dates
calculateRoomPrice()       // With discounts
getAvailableRooms()        // For hostel
updateRoomAvailability()
getRoomOccupancyRate()
getLowAvailabilityRooms()
getRoomBookingHistory()
getRoomRevenue()           # Host earnings
```

**API Endpoints:**
```
POST   /api/rooms                        # Create room
GET    /api/rooms                        # List all
GET    /api/rooms/:id                    # Get details
PATCH  /api/rooms/:id                    # Update
DELETE /api/rooms/:id                    # Delete
GET    /api/rooms/:id/availability       # Check dates
GET    /api/rooms/:id/pricing            # Calculate price
GET    /api/rooms/:id/occupancy          # Occupancy rate
GET    /api/rooms/:id/revenue            # Host dashboard
```

---

### 5. **Booking Module** 📅

**Purpose:** Reservation management with transaction support

**Key Features:**
- Create bookings with conflict detection
- MongoDB transaction support (ACID)
- Check-in/check-out tracking
- Booking cancellation with rollback
- Status management
- Calendar blocking

**Services (booking.service.js):**
```javascript
checkBookingConflict()     # Prevent double-booking
createBooking()            # With transaction
getBookings()              # Filtered & paginated
getBookingById()
cancelBooking()            # Restore availability
updateBooking()
confirmCheckIn()
confirmCheckOut()
getUserBookings()
```

**API Endpoints:**
```
POST   /api/bookings                     # Create booking
GET    /api/bookings                     # List (admin/host)
GET    /api/bookings/:id                 # Get details
PATCH  /api/bookings/:id                 # Update dates
PATCH  /api/bookings/:id/check-in        # Guest arrives
PATCH  /api/bookings/:id/check-out       # Guest leaves
DELETE /api/bookings/:id                 # Cancel booking
GET    /api/bookings/user/:userId        # My bookings
GET    /api/hostels/:hostelId/bookings   # Host bookings
```

---

### 6. **Payment Module** 💳

**Purpose:** Payment processing with Stripe integration

**Key Features:**
- Stripe payment intents
- Webhook handling for payment events
- Refund processing
- Payment reconciliation
- Invoice generation
- Transaction history

**Services (payment.service.js):**
```javascript
createPaymentIntent()      # Stripe preparation
confirmPayment()           # Complete transaction
refundPayment()            # Process refund
getPaymentStatus()
getUserPaymentHistory()
handleStripeWebhook()      # Payment events
getPaymentReconciliationReport()
generateInvoice()
```

**API Endpoints:**
```
POST   /api/payments/intent              # Create payment
POST   /api/payments/confirm             # Confirm payment
POST   /api/payments/:id/refund          # Refund
GET    /api/payments/:id/status          # Check status
GET    /api/payments/history             # User history
POST   /api/payments/webhook             # Stripe webhook
GET    /api/payments/:id/invoice         # Download invoice
GET    /api/payments/reconciliation      # Admin report (admin)
```

---

### 7. **Review Module** ⭐

**Purpose:** Guest reviews and ratings

**Key Features:**
- Create & edit reviews
- Multi-category ratings (cleanliness, comfort, value)
- Rating aggregation
- Helpful vote tracking
- Review reporting
- Average rating calculation

**Services (review.service.js):**
```javascript
createReview()
getReviews()               # Filtered, paginated
getReviewsByRoom()
getReviewsByUser()
updateReview()
deleteReview()
getRoomRatingStats()       # Aggregation
markReviewHelpful()
reportReview()
```

**API Endpoints:**
```
POST   /api/reviews                      # Create review
GET    /api/reviews                      # List
GET    /api/reviews/:id                  # Get
PATCH  /api/reviews/:id                  # Update
DELETE /api/reviews/:id                  # Delete
GET    /api/hostels/:hostelId/rating     # Hostel rating
GET    /api/users/reviews                # My reviews
PATCH  /api/reviews/:id/helpful          # Mark helpful
POST   /api/reviews/:id/report           # Report review
```

---

### 8. **Complaint Module** 📞

**Purpose:** Guest complaint & issue management

**Key Features:**
- Create & track complaints
- Auto-assignment to staff
- Priority escalation system
- Status workflow management
- Internal note tracking
- Resolution tracking

**Services (complaint.service.js):**
```javascript
createComplaint()
getComplaints()            # Filtered, paginated
getComplaintById()
updateComplaintStatus()
resolveComplaint()
closeComplaint()
assignComplaint()          # To staff
reassignComplaint()        # Transfer to another staff
escalateComplaint()        # Increase priority
addComplaintNote()         # Internal notes
getComplaintStats()
```

**API Endpoints:**
```
POST   /api/complaints                   # File complaint
GET    /api/complaints                   # List
GET    /api/complaints/:id               # Get
PATCH  /api/complaints/:id/status        # Update status
PATCH  /api/complaints/:id/assign        # Assign to staff
PATCH  /api/complaints/:id/reassign      # Reassign
PATCH  /api/complaints/:id/escalate      # Change priority
POST   /api/complaints/:id/notes         # Add note
PATCH  /api/complaints/:id/resolve       # Mark resolved
PATCH  /api/complaints/:id/close         # Close
GET    /api/complaints/stats             # Statistics (admin)
```

---

### 9. **Dashboard Module** 📊

**Purpose:** Analytics and business intelligence

**Key Features:**
- Role-based dashboards (Admin, Host, Staff)
- Key metrics & KPIs
- Booking trends (30-day)
- Revenue trends
- User growth analysis
- System health monitoring

**Services (dashboard.service.js):**
```javascript
getAdminDashboard()        # All platform stats
getHostDashboard()         # Hostel owner stats
getStaffDashboard()        # Staff performance
getTopHostels()            # Best performing
getBookingTrends()         # 30-day trend
getRevenueTrends()
getUserGrowthTrends()
getSystemHealthMetrics()
```

**API Endpoints:**
```
GET    /api/dashboard/admin              # Admin stats (admin)
GET    /api/dashboard/host               # Host stats (host)
GET    /api/dashboard/staff              # Staff stats (staff)
GET    /api/dashboard/hostels            # Top hostels (admin)
GET    /api/dashboard/bookings/trend     # Booking trends
GET    /api/dashboard/revenue/trend      # Revenue trends
GET    /api/dashboard/users/growth       # User growth
GET    /api/dashboard/health             # System health (admin)
```

---

### 10. **Report Module** 📋

**Purpose:** Export and PDF report generation

**Key Features:**
- PDF report generation
- CSV data export
- Booking reports
- Revenue reports
- Complaint reports
- Performance reports
- Custom filtering

**Services (report.service.js):**
```javascript
generateBookingReportPDF()      # PDF format
generateRevenueReportPDF()
generateComplaintReportPDF()
generateBookingsCSV()           # CSV format
generatePaymentsCSV()
generateComplaintsCSV()
generateReviewsCSV()
generateUsersCSV()
generateHostelPerformanceCSV()
generateDashboardReportPDF()
```

**API Endpoints:**
```
POST   /api/reports/bookings              # Download PDF
POST   /api/reports/bookings.csv          # Download CSV
POST   /api/reports/revenue               # PDF
POST   /api/reports/payments.csv          # CSV
POST   /api/reports/complaints            # PDF
POST   /api/reports/complaints.csv        # CSV
POST   /api/reports/reviews.csv
POST   /api/reports/users.csv
POST   /api/reports/hostels.csv
POST   /api/reports/dashboard             # PDF
```

---

### 11. **Audit Module** 🔍

**Purpose:** Logging and monitoring all system activities

**Key Features:**
- Request/response logging
- User activity timeline
- Suspicious activity detection
- Audit log export
- System health monitoring
- Performance tracking

**Services (audit.service.js):**
```javascript
logAuditEvent()            # Log every request
getAuditLogs()             # View logs
getAuditLogById()
getUserAuditLogs()         # User activity
getAuditStats()            # Statistics
getSuspiciousActivities()  # Brute force detection
getMostAccessedEndpoints()
getUserActivityTimeline()
exportAuditLogsToCSV()
clearOldAuditLogs()        # Auto cleanup
```

**API Endpoints:**
```
GET    /api/audit                        # View logs (admin)
GET    /api/audit/:id                    # Get log details
GET    /api/audit/user/:userId           # User activity
GET    /api/audit/stats                  # Statistics
GET    /api/audit/suspicious             # Security alerts
GET    /api/audit/endpoints              # Popular endpoints
POST   /api/audit/export                 # CSV export
```

---

### 12. **Upload Module** 📤

**Purpose:** File upload management with Cloudinary

**Key Features:**
- Image upload to Cloudinary
- Automatic optimization
- Thumbnail generation
- Batch operations
- File metadata management
- File deletion

**Services (upload.service.js):**
```javascript
uploadFile()               # Single file
uploadMultipleFiles()      # Batch upload
uploadRoomImages()         # Room photos
uploadHostelImages()       # Property photos
uploadUserAvatar()         # Profile picture
uploadReviewImages()       # Review photos
deleteFile()               # Remove from cloud
deleteMultipleFiles()
getFileMetadata()
optimizeImage()            # Resize/compress
generateThumbnail()
isValidImageFile()         # Validation
```

**API Endpoints:**
```
POST   /api/upload/room                  # Upload room photos
POST   /api/upload/hostel                # Upload hostel photos
POST   /api/upload/avatar                # Upload profile pic
POST   /api/upload/review                # Upload review photos
DELETE /api/upload/:publicId             # Delete file
GET    /api/upload/:publicId/metadata    # Get file info
```

---

## Authentication & Security

### JWT Authentication

**Token Structure:**
```javascript
{
  id: "user_id",
  email: "user@example.com",
  role: "user|host|staff|admin",
  staffType: "MANAGER|RECEPTIONIST|CLEANER",
  expiresIn: "7d"
}
```

**Token Locations:**
```javascript
Authorization: Bearer <token>    // Request header
// OR
Cookies: authToken=<token>       // Secure cookie
```

### Password Security

```javascript
// Hashing Algorithm: bcryptjs with salt rounds = 10
// Password validation on login
// Password reset with expiring tokens (24 hours)
// Change password requires old password verification
```

### Role-Based Access Control (RBAC)

```javascript
ROLES = {
  USER: "user",           // Guest/traveler
  HOST: "host",           // Hostel owner
  STAFF: "staff",         // Support/maintenance
  ADMIN: "admin"          // Platform admin
}

STAFF_TYPES = {
  MANAGER: "MANAGER",           // Oversee hostel
  RECEPTIONIST: "RECEPTIONIST", // Check-in/out
  CLEANER: "CLEANER"            // Maintenance
}
```

**Access Control Middleware:**
```javascript
authenticate()      // Require login
authorize(roles)    // Check role
staffOnly()         // Staff+ only
adminOnly()         // Admin only
hostOnly()          // Host only
```

### Security Features

✅ **Rate Limiting**
```javascript
General API:        100 requests/15 minutes
Login Endpoint:     5 requests/15 minutes
Password Reset:     3 requests/hour
```

✅ **Input Validation**
```javascript
// Joi schemas for all endpoints
// Email format validation
// Password strength enforcement (min 8 chars)
// SQL injection prevention (mongoose sanitization)
```

✅ **Headers Security**
```javascript
Helmet.js          // HTTPS, CSP, X-Frame-Options
CORS               // Frontend origin whitelist
```

✅ **Brute Force Protection**
```javascript
Failed login tracking
Account lock after 5 failures
30-minute lockout period
```

---

## API Endpoints

### Summary by Module

| Module | Count | Status |
|--------|-------|--------|
| Auth | 14 | ✅ Complete |
| User | 8 | ✅ Complete |
| Hostel | 10 | ✅ Complete |
| Room | 8 | ✅ Complete |
| Booking | 8 | ✅ Complete |
| Payment | 8 | ✅ Complete |
| Review | 8 | ✅ Complete |
| Complaint | 11 | ✅ Complete |
| Dashboard | 8 | ✅ Complete |
| Report | 10 | ✅ Complete |
| Audit | 8 | ✅ Complete |
| Upload | 6 | ✅ Complete |
| **TOTAL** | **127** | **✅** |

### Base URL

```
Development:  http://localhost:5000
Production:   https://api.roomlink.com
API Version:  v1 (optional prefix)
```

### Common Response Format

**Success Response:**
```javascript
{
  "success": true,
  "statusCode": 200,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

**Error Response:**
```javascript
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": [ /* validation errors */ ]
}
```

### Pagination

```javascript
// Query parameters
?page=1&limit=10&sort=-createdAt

// Response
{
  "data": [ /* items */ ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

---

## Database Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  avatar: String (Cloudinary URL),
  role: String (user|host|staff|admin),
  staffType: String (MANAGER|RECEPTIONIST|CLEANER),
  bio: String,
  
  // Email Verification
  isEmailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Phone Verification
  isPhoneVerified: Boolean,
  
  // Account Status
  accountStatus: String (active|suspended|locked|deleted),
  loginAttempts: Number,
  lockoutUntil: Date,
  
  // Suspension
  suspendedBy: ObjectId (Admin),
  suspendedAt: Date,
  suspendReason: String,
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Two-Factor Auth
  twoFactorEnabled: Boolean,
  twoFactorSecret: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### Hostel Model
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  address: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  
  // Contact
  phone: String,
  email: String,
  
  // Owner
  owner: ObjectId (User),
  manager: ObjectId (User),
  
  // Facilities
  amenities: [String],
  images: [{ url, publicId, uploadedAt }],
  
  // Ratings
  averageRating: Number,
  totalReviews: Number,
  
  // Status
  isActive: Boolean,
  isVerified: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Room Model
```javascript
{
  _id: ObjectId,
  hostel: ObjectId,
  roomNumber: String,
  roomType: String (Single|Double|Twin|Dorm|Family|Suite),
  capacity: Number,
  bedConfiguration: String,
  totalBeds: Number,
  
  // Pricing
  pricePerNight: Number,
  weeklyDiscount: Number (0-100),
  monthlyDiscount: Number (0-100),
  
  // Amenities
  amenities: [String],
  images: [{ url, publicId, uploadedAt }],
  description: String,
  
  // Availability
  totalRooms: Number,
  availableRooms: Number,
  
  // Status
  isActive: Boolean,
  
  // Ratings
  averageRating: Number,
  totalReviews: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Model
```javascript
{
  _id: ObjectId,
  bookingNumber: String (unique),
  
  // References
  hostel: ObjectId,
  room: ObjectId,
  guest: ObjectId (User),
  
  // Dates
  checkInDate: Date,
  checkOutDate: Date,
  checkInTime: Date,
  checkOutTime: Date,
  
  // Pricing
  totalPrice: Number,
  pricePerNight: Number,
  guestCount: Number,
  
  // Status
  status: String (pending|confirmed|checked-in|checked-out|cancelled),
  paymentStatus: String (pending|completed|failed|refunded),
  
  // Additional Info
  specialRequests: String,
  notes: String,
  
  // Cancellation
  cancellationReason: String,
  cancelledAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Model
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  booking: ObjectId,
  amount: Number,
  amountReceived: Number,
  
  // Payment Method
  provider: String (stripe|mpesa|bank_transfer),
  transactionId: String,
  mpesaReceiptNumber: String,
  
  // Status
  status: String (pending|completed|failed|refunded),
  currency: String (USD|KES),
  
  // Metadata
  metadata: Object,
  
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Review Model
```javascript
{
  _id: ObjectId,
  
  // References
  room: ObjectId,
  hostel: ObjectId,
  booking: ObjectId,
  guest: ObjectId (User),
  
  // Rating
  rating: Number (1-5),
  cleanliness: Number (1-5),
  comfort: Number (1-5),
  valueForMoney: Number (1-5),
  
  // Content
  title: String,
  comment: String,
  
  // Images
  photos: [{ url, publicId }],
  
  // Engagement
  helpfulVotes: [ObjectId (User)],
  
  // Reporting
  reports: [{
    reportedByUser: ObjectId,
    reason: String,
    description: String,
    reportedAt: Date
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### Complaint Model
```javascript
{
  _id: ObjectId,
  
  // References
  filedBy: ObjectId (User),
  hostel: ObjectId,
  booking: ObjectId,
  
  // Details
  title: String,
  description: String,
  category: String,
  
  // Status
  status: String (open|in-progress|pending|resolved|closed),
  priority: String (low|medium|high|critical),
  
  // Assignment
  assignedTo: ObjectId (Staff),
  
  // Resolution
  resolvedBy: ObjectId (Staff),
  resolvedAt: Date,
  resolutionNotes: String,
  
  // Notes
  notes: [{
    addedBy: ObjectId,
    content: String,
    timestamp: Date
  }],
  
  // Reassignment History
  reassignmentHistory: [{
    fromStaff: ObjectId,
    toStaff: ObjectId,
    reassignedAt: Date
  }],
  
  // Escalation History
  escalationHistory: [{
    escalatedAt: Date,
    fromPriority: String,
    toPriority: String,
    reason: String
  }],
  
  createdAt: Date,
  updatedAt: Date,
  closedAt: Date
}
```

### Audit Model
```javascript
{
  _id: ObjectId,
  
  // User
  userId: ObjectId,
  
  // Request Info
  action: String,
  module: String,
  method: String (GET|POST|PUT|PATCH|DELETE),
  endpoint: String,
  
  // Data
  requestData: Object,
  responseData: Object,
  
  // Response
  statusCode: Number,
  errorMessage: String,
  
  // System Info
  ipAddress: String,
  userAgent: String,
  
  timestamp: Date
}
```

---

## Service Layer

### What is a Service?

Services contain business logic - the core functionality that's independent of HTTP requests. They're reusable, testable, and separate from controllers.

### Service Pattern

```javascript
// Example: room.service.js
const checkRoomAvailability = async (roomId, checkInDate, checkOutDate) => {
  // 1. Validate inputs
  // 2. Query database
  // 3. Apply business logic
  // 4. Return results
  // 5. Handle errors
};

module.exports = {
  checkRoomAvailability,
  calculateRoomPrice,
  // ... more functions
};
```

### Service vs Controller

```javascript
// ❌ BAD: Logic in controller
const getRoomPrice = (req, res) => {
  const room = Room.findById(req.params.roomId);
  const nights = (req.body.checkOut - req.body.checkIn) / (1000*60*60*24);
  const price = room.pricePerNight * nights;
  res.json(price);
};

// ✅ GOOD: Logic in service
// room.service.js
const calculateRoomPrice = async (roomId, checkIn, checkOut) => {
  const room = await Room.findById(roomId);
  const nights = Math.ceil((checkOut - checkIn) / (1000*60*60*24));
  return room.pricePerNight * nights;
};

// room.controller.js
const getRoomPrice = asyncHandler(async (req, res) => {
  const price = await roomService.calculateRoomPrice(...);
  res.json(new ApiResponse(200, { price }));
});
```

### All Services

```
1. user.service.js           (9 functions)
2. room.service.js           (8 functions)
3. booking.service.js        (9 functions)
4. payment.service.js        (8 functions)
5. review.service.js         (10 functions)
6. complaint.service.js      (11 functions)
7. upload.service.js         (12 functions)
8. audit.service.js          (10 functions)
9. dashboard.service.js      (8 functions)
10. report.service.js        (10 functions)
11. hostel.service.js        (built-in)
12. auth.service.js          (built-in)
```

---

## Error Handling

### ApiError Class

```javascript
// Custom error handling
throw new ApiError(statusCode, message, errors);

// Examples
throw new ApiError(404, "Room not found");
throw new ApiError(400, "Invalid email format", ["email"]);
throw new ApiError(401, "Invalid credentials");
throw new ApiError(500, "Internal server error");
```

### HTTP Status Codes

```
200 OK                 - Successful request
201 Created            - Resource created
400 Bad Request        - Invalid input
401 Unauthorized       - Missing authentication
403 Forbidden          - Insufficient permissions
404 Not Found          - Resource doesn't exist
409 Conflict           - Email already exists
422 Unprocessable      - Validation failed
429 Too Many Requests  - Rate limit exceeded
500 Server Error       - Internal error
503 Service Unavailable - Database down, etc.
```

### Error Middleware

```javascript
// Automatically catches all errors and sends formatted response
app.use(errorHandler);

// Handler logs error and sends:
{
  "success": false,
  "statusCode": 400,
  "message": "Error description"
}
```

---

## Configuration

### Environment Variables (.env)

```dotenv
# Node
NODE_ENV=development
PORT=5000
APP_NAME=RoomLink

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/roomlink

# Redis
REDIS_HOST=redis-host.redislabs.com
REDIS_PORT=12351
REDIS_PASSWORD=your-password
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# Email Service (Brevo/Sendinblue)
BREVO_API_KEY=your-api-key
FROM_EMAIL=noreply@roomlink.com

# Cloudinary (File Upload)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Frontend
FRONTEND_URL=http://localhost:5173

# M-Pesa (Optional for Kenyan users)
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret
```

### Server Configuration

```javascript
// app.js configuration
Trust proxy              ENABLED
CORS                     Enabled (whitelist FRONTEND_URL)
Body parser limit        10kb JSON, 10kb URL-encoded
Rate limiting            100 req/15min (general), 5 req/15min (login)
Helmet                   ENABLED (security headers)
Morgan                   ENABLED (request logging)
Swagger                  Available at /api-docs
```

---

## Integration Guide

### For Frontend Developers

**1. Initialize API Client**

```javascript
// axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

**2. Authentication Flow**

```javascript
// Register
const register = (userData) => api.post('/auth/register', userData);

// Login
const login = (email, password) => 
  api.post('/auth/login', { email, password });

// Save token
const response = await api.post('/auth/login', credentials);
localStorage.setItem('authToken', response.data.data.token);

// Logout
const logout = () => {
  localStorage.removeItem('authToken');
  api.post('/auth/logout');
};
```

**3. Fetch Data**

```javascript
// Get hostels
const hostels = await api.get('/hostels?city=Nairobi&page=1&limit=10');

// Get available rooms
const rooms = await api.post('/rooms/availability', {
  hostelId: 'xxx',
  checkInDate: '2026-03-01',
  checkOutDate: '2026-03-05'
});

// Create booking
const booking = await api.post('/bookings', {
  roomId: 'xxx',
  checkInDate: '2026-03-01',
  checkOutDate: '2026-03-05'
});
```

**4. Handle Responses**

```javascript
try {
  const { data } = await api.post('/bookings', bookingData);
  console.log(data.message); // "Booking created successfully"
  console.log(data.data);    // Booking details
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    console.error(error.response.data.message);
  } else if (error.response?.status === 401) {
    // Need to login
    window.location.href = '/login';
  }
}
```

---

## Deployment

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on http://localhost:5000
# Swagger docs at http://localhost:5000/api-docs
```

### Production

```bash
# Set environment to production
export NODE_ENV=production

# Start server
npm start

# Use process manager (PM2)
pm2 start server.js --name roomlink
pm2 save
pm2 startup
```

### Docker Deployment

```bash
# Build image
docker build -t roomlink-backend .

# Run container
docker run -p 5000:5000 --env-file .env roomlink-backend

# Or use docker-compose
docker-compose up -d
```

### Database Backup

```bash
# MongoDB backup
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/roomlink" \
          --out ./backups

# MongoDB restore
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/roomlink" \
             ./backups/roomlink
```

---

## Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

### Test Files Structure

```
__tests__/
├── auth.role.test.js       # Auth tests
├── payment.test.js         # Payment tests
├── upload.test.js          # Upload tests
└── setup.js                # Test configuration
```

---

## Monitoring & Logging

### Logs Location

```
Winston Logs:    ./logs/
  - error.log    (errors only)
  - combined.log (all logs)

Morgan Logs:     Streamed to Winston
Audit Logs:      MongoDB (audit collection)
```

### View Logs

```bash
# Real-time logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# Check recent activity
curl http://localhost:5000/api/audit?limit=20
```

---

## Troubleshooting

### Server Won't Start

```bash
# Check if port is in use
lsof -i :5000

# Check environment variables
echo $MONGO_URI
echo $REDIS_HOST

# Verify MongoDB connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net"

# Verify Redis connection
redis-cli -u redis://user:pass@host:port ping
```

### Database Connection Issues

```javascript
// MongoDB error: "MongoNetworkError"
// Solution: Check connection string, whitelist IP

// Redis error: "ECONNREFUSED"
// Solution: Verify Redis host, port, password
```

### Payment Failures

```javascript
// Stripe error: "No API key provided"
// Solution: Set STRIPE_SECRET_KEY in .env

// Webhook not working
// Solution: Ensure public URL is accessible, webhook endpoint registered
```

---

## Performance Optimization

### Caching Strategy

```javascript
// Redis caching middleware
app.get('/api/hostels', cacheMiddleware(3600), getHostels);
// Caches response for 1 hour
```

### Database Indexing

```javascript
// Indexes for fast queries
User.index({ email: 1 })
Booking.index({ hostel: 1, checkInDate: 1 })
Review.index({ room: 1 })
Payment.index({ status: 1 })
```

### Response Pagination

```javascript
// Always paginate large result sets
GET /api/bookings?page=1&limit=20
// Reduces payload, improves response time
```

---

## Support & Resources

- **API Documentation**: http://localhost:5000/api-docs (Swagger)
- **MongoDB Docs**: https://docs.mongodb.com
- **Stripe Docs**: https://stripe.com/docs/api
- **Redis Docs**: https://redis.io/docs
- **Express Docs**: https://expressjs.com

---

**Backend Last Updated:** February 21, 2026  
**Status:** Production Ready ✅  
**Version:** 1.0.0
