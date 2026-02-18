# 📋 Missing Controllers & Email Integration Analysis

## 🔍 Audit Results

### ✅ Implementation Status by Module

---

## 1️⃣ AUTH MODULE - **CRITICAL GAPS**

### Existing Controllers
- ✅ register (placeholder)
- ✅ login (placeholder)
- ✅ logout (placeholder)
- ✅ refreshToken (placeholder)
- ✅ verifyEmail (placeholder)
- ✅ requestPasswordReset (placeholder)
- ✅ resetPassword (placeholder)

### ❌ Missing Controllers (Routes Missing Too)
1. **resendVerificationEmail** → Generate new token, resend verification email
2. **resendPasswordReset** → Resend reset email (after token expires)
3. **changePassword** → Change password when logged in (not recovery)
4. **validateResetToken** → Check if reset token is valid
5. **validateVerificationToken** → Check if verification token is valid

### Missing Routes in auth.routes.js
```
POST   /api/v1/auth/verify-email         ← resendVerificationEmail
POST   /api/v1/auth/forgot-password       ← requestPasswordReset  
POST   /api/v1/auth/reset-password        ← resetPassword
POST   /api/v1/auth/resend-verification   ← resendVerificationEmail
POST   /api/v1/auth/resend-reset-email    ← resendPasswordReset
POST   /api/v1/auth/change-password       ← changePassword (authenticated)
POST   /api/v1/auth/validate-reset-token  ← validateResetToken
POST   /api/v1/auth/validate-verification-token ← validateVerificationToken
```

### 📧 Email Triggers for Auth
| Controller | Email Function | When |
|---|---|---|
| register | sendWelcomeEmail | After user created |
| verifyEmail | sendEmailVerificationEmail | After email verified |
| resendVerificationEmail | sendWelcomeEmail | After new verification link sent |
| requestPasswordReset | sendPasswordResetEmail | After reset token generated |
| resendPasswordReset | sendPasswordResetEmail | After reset token regenerated |
| changePassword | None | (No email needed) |

---

## 2️⃣ USER MODULE - **NO CONTROLLER**

### Current Status
- ✅ user.model.js exists
- ❌ user.controller.js missing
- ❌ user.routes.js missing
- ❌ user.service.js missing

### Required Controllers
1. **getProfile** → GET user details
2. **updateProfile** → Update name, phone, address, etc.
3. **deleteAccount** → Soft delete user account
4. **getUserPhoneVerification** (optional) → Verify phone
5. **getNotificationPreferences** → User email/SMS preferences
6. **updateNotificationPreferences** → Toggle notifications

### Routes Needed
```
GET    /api/v1/users/profile                    ← getProfile
PATCH  /api/v1/users/profile                    ← updateProfile
DELETE /api/v1/users/profile                    ← deleteAccount
GET    /api/v1/users/notification-preferences   ← getNotificationPreferences
PATCH  /api/v1/users/notification-preferences   ← updateNotificationPreferences
```

### 📧 Email Triggers for User
| Controller | Email Function | When |
|---|---|---|
| deleteAccount | None | (Optional: send account deletion confirmation) |
| updateProfile | None | (No email trigger needed) |

---

## 3️⃣ HOSTEL MODULE - **MISSING ROOM MANAGEMENT**

### Existing Controllers
- ✅ createHostel
- ✅ getHostels
- ✅ getHostelById
- ✅ updateHostel
- ✅ deleteHostel
- ✅ searchHostels

### ❌ Missing Controllers
1. **Room Management** (critical for bookings)
   - createRoom → Add room to hostel
   - updateRoom → Update room details
   - deleteRoom → Remove room
   - getHostelRooms → Get all rooms in hostel
   - updateRoomAvailability → Set availability dates

2. **Hostel Amenities**
   - getAmenities → List available amenities
   - addAmenityToHostel
   - removeAmenityFromHostel

3. **Hostel Images**
   - uploadHostelImages → Cloudinary integration
   - deleteHostelImage

### Routes Needed
```
POST   /api/v1/hostels/:hostelId/rooms           ← createRoom
GET    /api/v1/hostels/:hostelId/rooms           ← getHostelRooms
PATCH  /api/v1/hostels/:hostelId/rooms/:roomId   ← updateRoom
DELETE /api/v1/hostels/:hostelId/rooms/:roomId   ← deleteRoom
PATCH  /api/v1/hostels/:hostelId/rooms/:roomId/availability ← updateRoomAvailability
```

### 📧 Email Triggers for Hostel
| Controller | Email Function | When |
|---|---|---|
| createHostel | None | (Could send verification for new hostel) |
| updateRoom (availability) | None | (No email trigger) |

---

## 4️⃣ BOOKING MODULE - **MOSTLY COMPLETE, MINOR GAPS**

### Existing Controllers
- ✅ createBooking
- ✅ getBookings
- ✅ getBookingById
- ✅ cancelBooking
- ✅ getUserBookings

### ❌ Missing Controllers
1. **updateBooking** → Extend/modify checkout/check-in dates
2. **getHostelBookings** → Get bookings for hostel (host view)
3. **confirmCheckIn** → Mark guest as checked in with verification
4. **confirmCheckOut** → Mark guest as checked out
5. **getBookingStats** → Occupancy, revenue, etc.

### Missing Routes
```
PATCH  /api/v1/bookings/:id              ← updateBooking
GET    /api/v1/hostels/:hostelId/bookings ← getHostelBookings (host)
PATCH  /api/v1/bookings/:id/check-in     ← confirmCheckIn
PATCH  /api/v1/bookings/:id/check-out    ← confirmCheckOut
GET    /api/v1/bookings/:id/stats        ← getBookingStats
```

### 📧 Email Triggers for Booking
| Controller | Email Function | When |
|---|---|---|
| createBooking | sendBookingConfirmationEmail | After booking created |
| cancelBooking | sendBookingCancellationEmail | After booking cancelled |
| updateBooking | None | (Could send modification confirmation) |
| confirmCheckOut | sendReviewInvitationEmail | After guest checks out |

---

## 5️⃣ COMPLAINT MODULE - **MISSING OPERATIONS**

### Existing Controllers
- ✅ createComplaint
- ✅ getComplaints
- ✅ getComplaintById
- ✅ updateComplaintStatus
- ✅ resolveComplaint

### ❌ Missing Controllers
1. **reassignComplaint** → Assign complaint to different staff
2. **addComplaintNote** → Staff adds internal notes
3. **escalateComplaint** → Escalate priority
4. **getComplaintStats** → Stats by category, priority, resolution time
5. **closeComplaint** → Mark complaint as closed (different from resolved)

### Missing Routes
```
PATCH  /api/v1/complaints/:id/reassign    ← reassignComplaint
POST   /api/v1/complaints/:id/notes       ← addComplaintNote
PATCH  /api/v1/complaints/:id/escalate    ← escalateComplaint
PATCH  /api/v1/complaints/:id/close       ← closeComplaint
GET    /api/v1/complaints/stats           ← getComplaintStats
```

### 📧 Email Triggers for Complaint
| Controller | Email Function | When |
|---|---|---|
| createComplaint | sendComplaintAcknowledgmentEmail | After complaint filed |
| updateComplaintStatus | None | (Could notify on status change) |
| resolveComplaint | sendComplaintResolutionEmail | After complaint resolved |
| closeComplaint | None | (Optional notification) |
| escalateComplaint | None | (Could notify staff) |

---

## 6️⃣ REVIEW MODULE - **BASIC IMPLEMENTATION OK**

### Existing Controllers
- ✅ createReview
- ✅ getReviews
- ✅ updateReview
- ✅ deleteReview

### ❌ Missing Controllers (Optional)
1. **getReviewsByHostel** → More specific endpoint
2. **getHostelRating** → Calculate average rating
3. **getUserReviews** → Get reviews written by user
4. **getHelpfulReviews** → Filter by helpfulness
5. **reportReview** → Report inappropriate review

### Missing Routes (Optional)
```
GET    /api/v1/hostels/:hostelId/rating  ← getHostelRating
GET    /api/v1/users/reviews             ← getUserReviews
PATCH  /api/v1/reviews/:id/helpful       ← markReviewHelpful
POST   /api/v1/reviews/:id/report        ← reportReview
```

### 📧 Email Triggers for Review
| Controller | Email Function | When |
|---|---|---|
| createReview | None | (No direct trigger) |
| (After checkout) | sendReviewInvitationEmail | Schedule email 1 day after checkout |

---

## 7️⃣ PAYMENT MODULE - **BASIC STRUCTURE OK**

### Existing Controllers
- ✅ createPaymentIntent
- ✅ confirmPayment
- ✅ refundPayment

### ❌ Missing Controllers
1. **getPaymentStatus** → Check payment status
2. **getPaymentHistory** → Payment transaction history
3. **handlePaymentWebhook** → Stripe webhook handler (critical!)
4. **downloadInvoice** → Generate/download invoice

### Missing Routes
```
GET    /api/v1/payments/:id/status       ← getPaymentStatus
GET    /api/v1/payments/history          ← getPaymentHistory
POST   /api/v1/payments/webhook          ← handlePaymentWebhook (no auth)
GET    /api/v1/payments/:id/invoice      ← downloadInvoice
```

### 📧 Email Triggers for Payment
| Controller | Email Function | When |
|---|---|---|
| confirmPayment | None | (Could send receipt/confirmation) |
| refundPayment | None | (Could send refund notification) |
| handlePaymentWebhook | None | (Log payment events) |

---

## 8️⃣ DASHBOARD & REPORT MODULES - **OK FOR NOW**

### Dashboard Endpoints (Placeholder)
- ✅ getAdminDashboard
- ✅ getHostDashboard
- ✅ getStaffDashboard

### Report Endpoints (Placeholder)
- ✅ getBookingReport
- ✅ getComplaintReport
- ✅ getUserReport
- ✅ getRevenueReport

### 📧 Email Triggers
- None needed (informational only)

---

## 📊 Summary Table

| Module | Total Controllers | Implemented | Missing | Priority |
|--------|---|---|---|---|
| Auth | 10 | 7 | 3 | 🔴 CRITICAL |
| User | 6 | 0 | 6 | 🔴 CRITICAL |
| Hostel | 9 | 6 | 3 | 🔴 CRITICAL |
| Booking | 8 | 5 | 3 | 🟠 HIGH |
| Complaint | 6 | 5 | 1 | 🟡 MEDIUM |
| Review | 8 | 4 | 4 | 🟢 LOW |
| Payment | 6 | 3 | 3 | 🟠 HIGH |
| Dashboard | 3 | 3 | 0 | 🟢 LOW |
| Report | 4 | 4 | 0 | 🟢 LOW |

---

## 🎯 Implementation Priority

### Phase 1: Critical (Must Have) - Auth & User
1. ✅ resendVerificationEmail (Auth)
2. ✅ resendPasswordReset (Auth)
3. ✅ changePassword (Auth)
4. ✅ User Controller (All endpoints)
5. ✅ updatePasswordReset routes to .routes.js

### Phase 2: Critical (Must Have) - Booking Support
6. ✅ Room Management (Hostel)
7. ✅ updateBooking (Booking)
8. ✅ confirmCheckOut (Booking) + email

### Phase 3: Important (Should Have)
9. ✅ Complaint advanced operations
10. ✅ Payment webhook handler
11. ✅ Booking verification

### Phase 4: Nice to Have
12. Review enhancements
13. Advanced reporting

---

## 🚀 Implementation Checklist

### Auth Module
- [ ] Add resendVerificationEmail controller
- [ ] Add resendPasswordReset controller
- [ ] Add changePassword controller
- [ ] Add validateResetToken controller
- [ ] Add Email imports and calls
- [ ] Update auth.routes.js with missing routes

### User Module
- [ ] Create user.controller.js
- [ ] Create user.routes.js
- [ ] Create user.service.js
- [ ] Implement getProfile
- [ ] Implement updateProfile
- [ ] Implement deleteAccount
- [ ] Implement notification preferences

### Hostel Module
- [ ] Create room.controller.js or add to hostel.controller.js
- [ ] Implement room CRUD operations
- [ ] Add room routes

### Booking Module
- [ ] Add updateBooking controller
- [ ] Add getHostelBookings controller
- [ ] Add confirmCheckOut controller (with review invitation email)
- [ ] Update booking.routes.js

### Complaint Module
- [ ] Add emailNotification when status changes

### Payment Module
- [ ] Add handlePaymentWebhook controller
- [ ] Create webhook signature verification
- [ ] Update payment.routes.js

---

## 📧 Email Integration Checklist

### Auth Emails
- [ ] sendWelcomeEmail → register
- [ ] sendEmailVerificationEmail → verifyEmail
- [ ] sendWelcomeEmail → resendVerificationEmail
- [ ] sendPasswordResetEmail → requestPasswordReset
- [ ] sendPasswordResetEmail → resendPasswordReset

### Booking Emails
- [ ] sendBookingConfirmationEmail → createBooking
- [ ] sendBookingCancellationEmail → cancelBooking
- [ ] sendReviewInvitationEmail → confirmCheckOut

### Complaint Emails
- [ ] sendComplaintAcknowledgmentEmail → createComplaint
- [ ] sendComplaintResolutionEmail → resolveComplaint

### Payment Emails (Optional)
- [ ] sendPaymentConfirmationEmail → confirmPayment (new function)
- [ ] sendRefundEmail → refundPayment (new function)

---

## 💡 Recommendations

1. **Auth is CRITICAL** - Without proper auth, nothing works
2. **User profile is CRITICAL** - Users need to manage accounts
3. **Room management is CRITICAL** - Bookings need available rooms
4. **Email integration is HIGH** - Users expect transactional emails
5. **Payment webhook is HIGH** - Payment processing won't work without it
6. **Complaint operations are MEDIUM** - Nice to have but not blocking
7. **Review enhancements are LOW** - Basic CRUD is enough initially

---

**Generated**: Today  
**Status**: Ready for implementation
