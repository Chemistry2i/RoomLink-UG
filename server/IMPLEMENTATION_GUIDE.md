# 🏨 RoomLink Backend Implementation Guide

This document outlines the complete backend structure and next steps for implementation.

## ✅ Completed Setup

- [x] Project folder structure (modular, feature-based)
- [x] Configuration files (DB, Redis, Logging, Environment)
- [x] Middleware setup (Auth, RBAC, Error handling, Rate limiting, Caching, Validation)
- [x] Database models with indexes (User, Hostel, Booking, Review, Complaint)
- [x] Module structure (Auth, Hostel, Booking, Review, Complaint, Dashboard, Report, Payment)
- [x] Routes structure
- [x] Main app.js with security middleware
- [x] Server entry point with graceful shutdown
- [x] Swagger documentation skeleton
- [x] Error handling system (ApiError, ApiResponse)
- [x] Utility functions (async handler, pagination, constants)
- [x] Package.json with all production dependencies
- [x] Environment template (.env.example)

## 🔥 Next Implementation Steps

### Phase 1: Authentication Module (Priority: CRITICAL)

**Files to implement:**
- `src/modules/auth/auth.service.js` - Core auth logic
- `src/modules/auth/auth.controller.js` - Auth endpoints
- `src/modules/auth/auth.validation.js` - Input validation

**Tasks:**
1. Implement `registerUser()` service
   - Hash password with bcrypt
   - Create user record
   - Return user data (no password)

2. Implement `loginUser()` service
   - Find user by email
   - Compare password
   - Generate JWT tokens
   - Return tokens

3. Implement JWT token generation
   - Access token (short-lived, 7d)
   - Refresh token (long-lived, 30d)

4. Add validation schemas using Joi
   - Register validation
   - Login validation

5. Create test cases for auth

**Endpoints:**
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
```

---

### Phase 2: Hostel Module (Priority: HIGH)

**Files to implement:**
- `src/modules/hostel/hostel.service.js` - Hostel business logic
- `src/modules/hostel/hostel.controller.js` - Hostel endpoints
- `src/modules/hostel/hostel.validation.js` - Validation schemas

**Tasks:**
1. Implement `createHostel()` service
   - Validate owner is host/admin
   - Create hostel record
   - Set initial availability

2. Implement `getHostels()` service with:
   - Pagination
   - Filtering by location, price range, rating
   - Sorting
   - Lean queries

3. Implement `searchHostels()` service
   - Text search by location/title
   - Price range filter
   - Rating filter
   - Cache results in Redis

4. Implement `updateHostel()` service
   - Only owner/admin can update
   - Invalidate cache

5. Implement soft delete
   - Mark isDeleted = true
   - Don't return deleted hostels

**Endpoints:**
```
GET    /api/v1/hostels
GET    /api/v1/hostels/search
GET    /api/v1/hostels/:id
POST   /api/v1/hostels              (host/admin)
PATCH  /api/v1/hostels/:id          (owner/admin)
DELETE /api/v1/hostels/:id          (admin)
```

---

### Phase 3: Booking Module (Priority: CRITICAL)

**Files to implement:**
- `src/modules/booking/booking.service.js` - Core booking logic
- `src/modules/booking/booking.controller.js` - Booking endpoints
- `src/modules/booking/booking.validation.js` - Validation

**Tasks:**
1. Implement `checkBookingConflict()` service
   - Query overlapping dates
   - Check formula: checkIn < existing.checkOut AND checkOut > existing.checkIn
   - Return conflict if found

2. Implement `createBooking()` service with transaction
   ```
   - Start MongoDB transaction
   - Check conflict
   - Check availability
   - Create booking
   - Decrease availableRooms
   - Commit transaction
   - On error: rollback
   ```

3. Implement `cancelBooking()` service with transaction
   - Update booking status
   - Refund payment
   - Increase availableRooms

4. Implement `getUserBookings()` service
   - Return user's bookings with pagination
   - Include hostel details

**Key Logic:**
```javascript
// Booking conflict check
db.bookings.find({
  hostel: hostelId,
  checkIn: { $lt: newCheckOut },
  checkOut: { $gt: newCheckIn },
  status: { $ne: "cancelled" }
})
```

**Endpoints:**
```
GET    /api/v1/bookings              (admin/staff)
GET    /api/v1/bookings/user/me      (user's bookings)
GET    /api/v1/bookings/:id
POST   /api/v1/bookings              (create with rate limit)
PATCH  /api/v1/bookings/:id/cancel
```

---

### Phase 4: Review Module (Priority: MEDIUM)

**Files to implement:**
- `src/modules/review/review.controller.js`
- `src/modules/review/review.routes.js`

**Tasks:**
1. Only users with completed bookings can review
2. One review per booking
3. Update hostel rating average when review created/updated
4. Cache review results

**Endpoints:**
```
POST   /api/v1/reviews                 (authenticated user)
GET    /api/v1/reviews/hostel/:id      (get hostel reviews)
PATCH  /api/v1/reviews/:id             (own review)
DELETE /api/v1/reviews/:id             (own review)
```

---

### Phase 5: Complaint Module (Priority: HIGH)

**Files to implement:**
- `src/modules/complaint/complaint.controller.js`
- `src/modules/complaint/complaint.service.js` (optional)

**Tasks:**
1. User files complaint
2. Staff views and updates status
3. Staff resolves with resolution note
4. Track priority and category

**Logic:**
- Open → In-progress → Resolved/Rejected
- Only assigned staff can update
- Admin can escalate priority

**Endpoints:**
```
POST   /api/v1/complaints             (create)
GET    /api/v1/complaints             (filter by user/admin)
GET    /api/v1/complaints/:id
PATCH  /api/v1/complaints/:id/status  (staff)
PATCH  /api/v1/complaints/:id/resolve (staff)
```

---

### Phase 6: Dashboard Module (Priority: MEDIUM)

**Tasks:**
1. Admin dashboard
   - Total users, hostels, revenue
   - Open complaints count
   - Recent bookings (last 10)
   - Monthly revenue graph data

2. Host dashboard
   - My hostels list
   - Total bookings this month
   - Revenue this month
   - Occupancy rate
   - Complaints for my hostels

3. Staff dashboard
   - Assigned complaints (open + in-progress)
   - Pending complaints
   - Average resolution time

**Endpoints:**
```
GET /api/v1/dashboard/admin   (admin)
GET /api/v1/dashboard/host    (host)
GET /api/v1/dashboard/staff   (staff)
```

---

### Phase 7: Reports Module (Priority: MEDIUM)

**Tasks - Use MongoDB Aggregation Pipeline:**

1. Booking Report
   - Total bookings (all time)
   - Bookings this month
   - Cancellation rate
   - Revenue per hostel

2. Complaint Report
   - Total complaints
   - Complaints by category
   - Average resolution time
   - High priority count

3. Revenue Report
   - Total revenue
   - Revenue by hostel
   - Monthly revenue trend
   - Top earning hostels

4. User Report
   - Total active users
   - Top booking users
   - Repeat customers

**Endpoints:**
```
GET /api/v1/reports/bookings   (admin)
GET /api/v1/reports/complaints (admin/staff)
GET /api/v1/reports/revenue    (admin)
GET /api/v1/reports/users      (admin)
```

---

### Phase 8: Payment Module (Optional - Advanced)

**Tasks:**
1. Create Stripe payment intent
2. Confirm payment after checkout
3. Refund payment logic

**Endpoints:**
```
POST /api/v1/payments/intent
POST /api/v1/payments/confirm
POST /api/v1/payments/refund
```

---

## 🧪 Testing Checklist

- [ ] Auth flow (register, login, token refresh)
- [ ] Booking conflict prevention
- [ ] Transaction rollback on error
- [ ] RBAC enforcement
- [ ] Soft delete functionality
- [ ] Cache invalidation
- [ ] Rate limiting
- [ ] Error handling

## 📋 Database Queries to Test

```javascript
// Booking conflict check
db.bookings.find({
  hostel: ObjectId(...),
  $or: [
    { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
  ],
  status: { $ne: "cancelled" }
})

// Get hostel with reviews
db.hostels.findOne({ _id: ObjectId(...) })
  .populate("owner", "name email")
  .select("title price location rating reviews")
  .lean()

// User's bookings with hostel info
db.bookings.find({ user: ObjectId(...) })
  .populate("hostel", "title location price")
  .sort({ createdAt: -1 })
  .limit(10)
```

## 🚀 Deployment Checklist

Before deploying to production:
- [ ] All environment variables set
- [ ] MongoDB Atlas cluster created
- [ ] Redis instance ready
- [ ] Stripe keys configured
- [ ] Cloudinary keys configured
- [ ] Email service configured
- [ ] CORS origin set correctly
- [ ] Error logging setup
- [ ] Graceful shutdown implemented
- [ ] Rate limits configured
- [ ] Database backups configured

## 📚 Important Notes

1. **Always use transactions** for operations affecting multiple collections
2. **Index frequently queried fields** to improve performance
3. **Use lean() queries** for read-only operations
4. **Cache search results** to reduce DB load
5. **Implement soft delete** instead of hard delete
6. **Log all significant operations** for audit trail
7. **Use rate limiting** on sensitive endpoints
8. **Validate all inputs** with Joi schemas

## 📞 Need Help?

Refer to:
- Individual module files (TODOs marked with `//TODO:`)
- swagger.js for API documentation structure
- Utils folder for helper functions
- Middleware folder for reusable middleware

---

**Status**: ✅ Infrastructure Ready | 🔄 Implementation Start
