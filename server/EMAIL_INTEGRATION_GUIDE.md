# 📧 Professional Email Configuration with Brevo

Complete email integration for RoomLink using Brevo (formerly Sendinblue) with professional HTML templates.

## 🔧 Setup & Configuration

### 1. Install Dependencies

```bash
npm install
```

The following email packages are included:
- `sib-api-v3-sdk` - Brevo (Sendinblue) API
- `nodemailer` - Email support

### 2. Configure Environment Variables

Edit `.env` file:

```env
# Brevo Email Configuration
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@roomlink.com
BREVO_SENDER_NAME=RoomLink

# Enable/disable email notifications
EMAIL_NOTIFICATIONS_ENABLED=true
```

### 3. Get Brevo API Key

1. Sign up at [brevo.com](https://www.brevo.com/)
2. Go to SMTP & API settings
3. Create API key (v3)
4. Copy and paste into `.env`

## 📁 Email Service Files

### Core Service Files

```
src/
├── services/
│   ├── email.service.js          # Brevo API integration
│   ├── emailTemplates.js         # HTML email templates
│   └── emailHelper.js            # Helper functions for sending emails
```

## 📧 Available Email Templates

### 1. Registration & Welcome

**Function:** `sendWelcomeEmail(userEmail, userName, verificationLink)`

**Triggers:** User registration

**Content:**
- Welcome message
- Email verification link
- Information about platform

```javascript
// Usage in auth.controller.js
await sendWelcomeEmail(user.email, user.name, verificationLink);
```

---

### 2. Email Verification

**Function:** `sendEmailVerificationEmail(userEmail, userName)`

**Triggers:** After email is verified

**Content:**
- Verification confirmation
- Account activation confirmation
- Call to action to start using platform

```javascript
// Usage in auth.controller.js
await sendEmailVerificationEmail(user.email, user.name);
```

---

### 3. Booking Confirmation

**Function:** `sendBookingConfirmationEmail(userEmail, userName, bookingDetails)`

**Triggers:** After successful booking creation

**Email Details:**
```javascript
{
  hostelName: "Hostel Name",
  bookingId: "BOOKING_ID",
  checkIn: "2026-02-25",
  checkOut: "2026-02-28",
  totalPrice: 150.00,
  hostelLocation: "Location"
}
```

**Content:**
- Booking confirmation
- Booking details
- Check-in/out times
- Total price
- Link to booking details

```javascript
// Usage in booking.controller.js
const bookingDetails = {
  hostelName: hostel.title,
  bookingId: booking._id,
  checkIn: booking.checkIn,
  checkOut: booking.checkOut,
  totalPrice: booking.totalPrice,
  hostelLocation: hostel.location,
};
await sendBookingConfirmationEmail(user.email, user.name, bookingDetails);
```

---

### 4. Booking Cancellation

**Function:** `sendBookingCancellationEmail(userEmail, userName, cancellationDetails)`

**Triggers:** After booking cancellation

**Email Details:**
```javascript
{
  hostelName: "Hostel Name",
  bookingId: "BOOKING_ID",
  refundAmount: 150.00,
  reason: "User requested cancellation"
}
```

**Content:**
- Cancellation confirmation
- Booking details
- Refund amount
- Processing timeline

```javascript
// Usage in booking.controller.js
const cancellationDetails = {
  hostelName: hostel.title,
  bookingId: booking._id,
  refundAmount: booking.totalPrice,
  reason: req.body.reason,
};
await sendBookingCancellationEmail(user.email, user.name, cancellationDetails);
```

---

### 5. Complaint Acknowledgment

**Function:** `sendComplaintAcknowledgmentEmail(userEmail, userName, complaintDetails)`

**Triggers:** After complaint is created

**Email Details:**
```javascript
{
  complaintId: "COMPLAINT_ID",
  hostelName: "Hostel Name",
  category: "maintenance",
  priority: "high"
}
```

**Content:**
- Complaint received confirmation
- Ticket ID
- Category and priority
- Expected resolution timeline

```javascript
// Usage in complaint.controller.js
const complaintDetails = {
  complaintId: complaint._id,
  hostelName: hostel.title,
  category: complaint.category,
  priority: complaint.priority,
};
await sendComplaintAcknowledgmentEmail(user.email, user.name, complaintDetails);
```

---

### 6. Complaint Resolution

**Function:** `sendComplaintResolutionEmail(userEmail, userName, complaintDetails)`

**Triggers:** When complaint is resolved

**Email Details:**
```javascript
{
  complaintId: "COMPLAINT_ID",
  resolutionNote: "Issue has been fixed by the hostel management"
}
```

**Content:**
- Resolution confirmation
- Resolution details
- Link to complaint details
- Feedback request

```javascript
// Usage in complaint.controller.js
const complaintDetails = {
  complaintId: complaint._id,
  resolutionNote: req.body.resolutionNote,
};
await sendComplaintResolutionEmail(user.email, user.name, complaintDetails);
```

---

### 7. Review Invitation

**Function:** `sendReviewInvitationEmail(userEmail, userName, reviewDetails)`

**Triggers:** After booking completion (checkout date passed)

**Email Details:**
```javascript
{
  hostelName: "Hostel Name",
  bookingId: "BOOKING_ID"
}
```

**Content:**
- Encouragement to leave review
- Link to review form
- Benefits of reviews

```javascript
// Usage: Send automatically after checkout date
const reviewDetails = {
  hostelName: hostel.title,
  bookingId: booking._id,
};
await sendReviewInvitationEmail(user.email, user.name, reviewDetails);
```

---

### 8. Password Reset

**Function:** `sendPasswordResetEmail(userEmail, userName, resetLink)`

**Triggers:** User requests password reset

**Content:**
- Password reset link
- Expiration time (24 hours)
- Security warning
- Instructions

```javascript
// Usage in auth.controller.js
const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
await sendPasswordResetEmail(user.email, user.name, resetLink);
```

---

### 9. Host Welcome

**Function:** `sendHostWelcomeEmail(hostEmail, hostName)`

**Triggers:** When user registers as host

**Content:**
- Welcome to host program
- Getting started steps
- Creating listing instructions
- Link to host dashboard

```javascript
// Usage in auth.controller.js - when role is set to "host"
await sendHostWelcomeEmail(user.email, user.name);
```

---

## 🔌 Integration Points in Controllers

### Auth Module (`src/modules/auth/auth.controller.js`)

```javascript
// Register endpoint
const register = asyncHandler(async (req, res) => {
  // Create user
  const user = await User.create(userData);
  
  // Generate verification token
  const verificationToken = generateVerificationToken(user._id);
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  // Send welcome email
  await sendWelcomeEmail(user.email, user.name, verificationLink);
  
  // Continue with response
});

// Verify email endpoint
const verifyEmail = asyncHandler(async (req, res) => {
  // Verify token and mark email as verified
  user.isEmailVerified = true;
  await user.save();
  
  // Send verification confirmation
  await sendEmailVerificationEmail(user.email, user.name);
});

// Request password reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  // Generate reset token
  const resetToken = generateResetToken(user._id);
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  // Send password reset email
  await sendPasswordResetEmail(user.email, user.name, resetLink);
});

// When host account created - send host welcome
const registerHost = asyncHandler(async (req, res) => {
  const user = await User.create({ ...req.body, role: "host" });
  
  // Send host welcome email
  await sendHostWelcomeEmail(user.email, user.name);
});
```

### Booking Module (`src/modules/booking/booking.controller.js`)

```javascript
// Create booking
const createBooking = asyncHandler(async (req, res) => {
  // Create booking (with transaction)
  const booking = await Booking.create(bookingData);
  const hostel = await Hostel.findById(booking.hostel);
  
  // Send confirmation email
  const bookingDetails = {
    hostelName: hostel.title,
    bookingId: booking._id,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    totalPrice: booking.totalPrice,
    hostelLocation: hostel.location,
  };
  await sendBookingConfirmationEmail(user.email, user.name, bookingDetails);
  
  res.status(201).json(new ApiResponse(201, booking));
});

// Cancel booking
const cancelBooking = asyncHandler(async (req, res) => {
  // Cancel booking (with transaction)
  booking.status = "cancelled";
  await booking.save();
  
  // Send cancellation email
  const cancellationDetails = {
    hostelName: hostel.title,
    bookingId: booking._id,
    refundAmount: booking.totalPrice,
    reason: req.body.reason,
  };
  await sendBookingCancellationEmail(user.email, user.name, cancellationDetails);
  
  res.status(200).json(new ApiResponse(200, null, "Booking cancelled"));
});
```

### Complaint Module (`src/modules/complaint/complaint.controller.js`)

```javascript
// Create complaint
const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.create(complaintData);
  const hostel = await Hostel.findById(complaint.hostel);
  
  // Send acknowledgment email
  const complaintDetails = {
    complaintId: complaint._id,
    hostelName: hostel.title,
    category: complaint.category,
    priority: complaint.priority,
  };
  await sendComplaintAcknowledgmentEmail(
    user.email,
    user.name,
    complaintDetails
  );
  
  res.status(201).json(new ApiResponse(201, complaint));
});

// Resolve complaint
const resolveComplaint = asyncHandler(async (req, res) => {
  complaint.status = "resolved";
  complaint.resolutionNote = req.body.resolutionNote;
  complaint.resolutionDate = new Date();
  await complaint.save();
  
  // Send resolution email
  const complaintDetails = {
    complaintId: complaint._id,
    resolutionNote: req.body.resolutionNote,
  };
  const user = await User.findById(complaint.user);
  await sendComplaintResolutionEmail(user.email, user.name, complaintDetails);
  
  res.status(200).json(new ApiResponse(200, null, "Complaint resolved"));
});
```

### Review Module (`src/modules/review/review.controller.js`)

```javascript
// Create review
const createReview = asyncHandler(async (req, res) => {
  // Create review only if booking is completed
  const booking = await Booking.findById(req.body.bookingId);
  if (!isCheckoutPassed(booking.checkOut)) {
    throw new ApiError(400, "Cannot review before checkout date");
  }
  
  const review = await Review.create(reviewData);
  
  // Update hostel rating
  await updateHostelRating(review.hostel);
  
  res.status(201).json(new ApiResponse(201, review));
});

// Send review invitation (triggered by cron job or booking checkout)
// This should be in a scheduled job or triggered after checkout
const sendReviewInvitations = asyncHandler(async () => {
  // Find bookings with checkout date = today
  const completedBookings = await Booking.find({
    checkOut: { $eq: new Date().toDateString() },
    status: "completed",
  }).populate("user hostel");
  
  for (const booking of completedBookings) {
    await sendReviewInvitationEmail(
      booking.user.email,
      booking.user.name,
      {
        hostelName: booking.hostel.title,
        bookingId: booking._id,
      }
    );
  }
});
```

---

## 🎯 When Emails Are Sent

| Event | Email | Template |
|-------|-------|----------|
| User registers | Welcome + verification link | `registrationWelcome` |
| Email verified | Confirmation | `emailVerified` |
| Booking created | Confirmation with details | `bookingConfirmation` |
| Booking cancelled | Cancellation + refund info | `bookingCancellation` |
| Complaint filed | Acknowledgment + ticket ID | `complaintAcknowledgment` |
| Complaint resolved | Resolution details | `complaintResolution` |
| Booking completed | Invitation to review | `reviewInvitation` |
| Password reset requested | Reset link | `passwordReset` |
| Host registers | Welcome to host program | `hostWelcome` |

---

## 🧪 Testing Email Configuration

### Test Email Sending

Create a test endpoint (remove before production):

```javascript
// src/modules/test/test.routes.js
const router = require("express").Router();
const { sendWelcomeEmail } = require("../../services/emailHelper");

router.get("/send-test-email", async (req, res) => {
  const result = await sendWelcomeEmail(
    "test@example.com",
    "Test User",
    "https://roomlink.com/verify-email/test-token"
  );
  res.json(result);
});

module.exports = router;
```

### Check Email Status

Navigate to your Brevo Dashboard:
1. Open [brevo.com](https://brevo.com/)
2. Go to Campaigns > Transactional
3. View email sending history
4. Check for bounces, failures, and open rates

---

## 🔒 Best Practices

✅ **DO:**
- Always check `EMAIL_NOTIFICATIONS_ENABLED` before sending
- Use template helpers for consistency
- Log all email sends (for debugging)
- Include unsubscribe link in bulk emails
- Test templates before deploying
- Keep sensitive data out of emails

❌ **DON'T:**
- Hardcode email addresses
- Send sensitive data in email body
- Make users wait for email to send (use queues)
- Forget to handle failed emails
- Ignore email bounce notifications

---

## 📝 Implementation Checklist

- [ ] Get Brevo API key
- [ ] Update `.env` with Brevo credentials
- [ ] Run `npm install` to install email packages
- [ ] Implement auth endpoints with email sending
- [ ] Implement booking endpoints with email sending
- [ ] Implement complaint endpoints with email sending
- [ ] Implement review invitation logic
- [ ] Test all email templates
- [ ] Setup email logging/monitoring
- [ ] Deploy and monitor emails in production

---

## 🆘 Troubleshooting

### Emails not sending?

1. Check `.env` has correct `BREVO_API_KEY`
2. Verify `EMAIL_NOTIFICATIONS_ENABLED=true`
3. Check server logs for errors
4. Verify sender email in Brevo account
5. Check Brevo dashboard for bounce/failure reasons

### Email templates look wrong?

1. View email in browser inspector
2. Check CSS in template file
3. Test different email clients
4. Use inline CSS for better compatibility

### High bounce rate?

1. Verify email addresses in database
2. Check sender reputation in Brevo
3. Review bounced email list
4. Update undeliverable addresses

---

**Status**: ✅ Email Integration Complete | Ready for Implementation
