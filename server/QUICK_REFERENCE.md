# 🏨 RoomLink Backend - Quick Reference Guide

## 📁 Complete File Structure

```
server/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection & setup
│   │   ├── redis.js              # Redis client configuration
│   │   ├── logger.js             # Winston logging setup
│   │   └── env.js                # Environment validation
│   │
│   ├── modules/                  # Feature-based modular architecture
│   │   ├── auth/
│   │   │   ├── auth.model.js     # User model
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.routes.js
│   │   │
│   │   ├── user/
│   │   │   └── user.model.js
│   │   │
│   │   ├── hostel/
│   │   │   ├── hostel.model.js
│   │   │   ├── hostel.controller.js
│   │   │   ├── hostel.service.js
│   │   │   └── hostel.routes.js
│   │   │
│   │   ├── booking/
│   │   │   ├── booking.model.js
│   │   │   ├── booking.controller.js
│   │   │   ├── booking.service.js
│   │   │   └── booking.routes.js
│   │   │
│   │   ├── review/
│   │   │   ├── review.model.js
│   │   │   ├── review.controller.js
│   │   │   └── review.routes.js
│   │   │
│   │   ├── complaint/
│   │   │   ├── complaint.model.js
│   │   │   ├── complaint.controller.js
│   │   │   └── complaint.routes.js
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.controller.js
│   │   │   └── dashboard.routes.js
│   │   │
│   │   ├── report/
│   │   │   ├── report.controller.js
│   │   │   └── report.routes.js
│   │   │
│   │   └── payment/
│   │       ├── payment.controller.js
│   │       └── payment.routes.js
│   │
│   ├── middlewares/              # Express middlewares
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── role.middleware.js    # RBAC authorization
│   │   ├── error.middleware.js   # Global error handler
│   │   ├── validate.middleware.js # Request validation
│   │   ├── rateLimit.middleware.js # Rate limiting
│   │   └── cache.middleware.js   # Redis caching
│   │
│   ├── utils/                    # Utility functions
│   │   ├── ApiError.js           # Custom error class
│   │   ├── ApiResponse.js        # Standard response format
│   │   ├── asyncHandler.js       # Async wrapper for routes
│   │   ├── pagination.js         # Pagination helper
│   │   └── constants.js          # App constants
│   │
│   ├── docs/
│   │   └── swagger.js            # Swagger/OpenAPI setup
│   │
│   ├── app.js                    # Express app configuration
│   └── routes.js                 # Centralized route management
│
├── tests/                        # Test files (Jest/Supertest)
│
├── server.js                     # Server entry point
├── package.json                  # Dependencies & scripts
├── .env.example                  # Environment template
├── .env                          # Environment variables (git ignored)
├── .gitignore
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                   # Code formatting
├── README.md                     # Project overview
├── IMPLEMENTATION_GUIDE.md       # Step-by-step implementation
├── QUICK_REFERENCE.md           # This file
└── setup.sh                      # Quick setup script
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd /workspaces/RoomLink-UG/server
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 4. View API Docs
Open browser: `http://localhost:5000/api-docs`

## 🏗 Architecture Patterns

### Module Structure
Each module follows this pattern:
```
module/
├── module.model.js      # Mongoose schema
├── module.controller.js # Route handlers
├── module.service.js    # Business logic
├── module.routes.js     # Route definitions
└── module.validation.js # Input validation (optional)
```

### Request Flow
```
Route → Controller → Service → Model → Database
  ↓
Response → ApiResponse wrapper
  ↓
Error → ApiError handler
```

## 🔑 Key Concepts

### Error Handling
```javascript
// Throw custom error
throw new ApiError(400, "Invalid email");

// Automatic error catching
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

### Standard Response Format
```javascript
// Success
res.json(new ApiResponse(200, data, "Success message"));

// Error (automatically handled)
throw new ApiError(400, "Error message");
```

### RBAC (Role-Based Access Control)
```javascript
// Protect route by role
router.post(
  "/create",
  authenticate,              // Must be logged in
  authorize("admin", "host"), // Must have one of these roles
  controller.create
);
```

### Pagination
```javascript
const { page, limit, skip } = getPaginationParams(
  req.query.page,
  req.query.limit
);

const data = await Model.find()
  .skip(skip)
  .limit(limit);

const metadata = getPaginationMetadata(page, limit, total);
```

### Caching
```javascript
// Cache GET requests for 5 minutes
router.get("/data", cache(300), controller.getData);
```

### Rate Limiting
```javascript
// Apply specific rate limiter
router.post("/book", bookingLimiter, controller.createBooking);
```

## 📊 Database Models

### User
- name, email, password (hashed), phone, avatar
- role: user | host | staff | admin
- isEmailVerified, isPhoneVerified
- isDeleted (soft delete)

### Hostel
- title, description, location, city
- price, totalRooms, availableRooms
- owner (ref User)
- amenities, images
- rating, totalReviews
- isActive, isDeleted

### Booking
- user (ref User), hostel (ref Hostel)
- checkIn, checkOut, numberOfNights, numberOfGuests
- subtotal, taxAmount, totalPrice
- status, paymentStatus
- cancellationReason

### Review
- user (ref User), hostel (ref Hostel)
- booking (ref Booking)
- rating (1-5)
- Detailed ratings: cleanliness, comfort, staff, value, location

### Complaint
- user, hostel, booking (optional)
- title, description, category
- priority, status
- handledBy (ref User)
- resolutionNote

## 🔐 Authentication Flow

1. User registers → Password hashed → JWT tokens generated
2. User login → Verify credentials → Tokens issued
3. Each request → JWT verified → User attached to req
4. Protected routes → Check authentication → Check role

## 🧪 Important Testing Scenarios

- [ ] Double booking prevention
- [ ] Soft delete functionality
- [ ] RBAC enforcement
- [ ] Cache invalidation
- [ ] Transaction rollback on error
- [ ] Rate limiting
- [ ] JWT expiration & refresh

## 📋 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment | development/production |
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB URI | mongodb+srv://... |
| JWT_SECRET | JWT signing secret | your_secret_key |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| STRIPE_SECRET_KEY | Stripe secret | sk_test_... |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud | your_cloud |

## 🔗 API Endpoints Overview

```
AUTH
├── POST   /api/v1/auth/register
├── POST   /api/v1/auth/login
├── POST   /api/v1/auth/logout
└── POST   /api/v1/auth/refresh-token

HOSTELS
├── GET    /api/v1/hostels
├── GET    /api/v1/hostels/:id
├── POST   /api/v1/hostels
├── PATCH  /api/v1/hostels/:id
└── DELETE /api/v1/hostels/:id

BOOKINGS
├── GET    /api/v1/bookings
├── POST   /api/v1/bookings
├── GET    /api/v1/bookings/:id
└── PATCH  /api/v1/bookings/:id/cancel

REVIEWS
├── GET    /api/v1/reviews/hostel/:id
├── POST   /api/v1/reviews
├── PATCH  /api/v1/reviews/:id
└── DELETE /api/v1/reviews/:id

COMPLAINTS
├── GET    /api/v1/complaints
├── POST   /api/v1/complaints
├── GET    /api/v1/complaints/:id
├── PATCH  /api/v1/complaints/:id/status
└── PATCH  /api/v1/complaints/:id/resolve

DASHBOARD
├── GET    /api/v1/dashboard/admin
├── GET    /api/v1/dashboard/host
└── GET    /api/v1/dashboard/staff

REPORTS
├── GET    /api/v1/reports/bookings
├── GET    /api/v1/reports/complaints
├── GET    /api/v1/reports/revenue
└── GET    /api/v1/reports/users

PAYMENTS
├── POST   /api/v1/payments/intent
├── POST   /api/v1/payments/confirm
└── POST   /api/v1/payments/refund
```

## 📚 Implementation Strategy

**Start with Phase 1 & 2:**
1. Implement Auth (foundation for all other modules)
2. Implement Hostel (basic CRUD)
3. Implement Booking (core business logic with conflict prevention)

**Then move to Phase 3:**
4. Implement Complaints
5. Implement Reviews
6. Implement Dashboard/Reports

## 🛠 Development Commands

```bash
npm start              # Start production server
npm run dev           # Start with nodemon (auto-reload)
npm test              # Run tests
npm test:watch        # Run tests in watch mode
npm run lint          # Check code quality
npm run lint:fix      # Fix linting issues
```

## 📖 Useful Resources

- **Mongoose Documentation**: https://mongoosejs.com
- **Express.js**: https://expressjs.com
- **JWT**: https://jwt.io
- **Redis**: https://redis.io
- **Stripe API**: https://stripe.com/docs
- **Swagger/OpenAPI**: https://swagger.io

---

**Status**: ✅ Infrastructure Ready | Ready for Implementation
