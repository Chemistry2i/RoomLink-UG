# 📧 Email Integration Matrix

Complete reference showing which controllers send which emails and when.

---

## 🎯 Email Integration Overview

```
Total Email Functions: 11
Total Email Templates: 11
Total Email Triggers: 15+
Integration Status: ✅ COMPLETE & READY
```

---

## 📋 Complete Email Integration Matrix

### Auth Module Emails (5 Events)

| Controller | Function Called | When Triggered | Email Type | Status |
|---|---|---|---|---|
| **register** | sendWelcomeEmail() | User creates account | Welcome + Verify Link | ✅ |
| **verifyEmail** | sendEmailVerificationEmail() | Email verified | Verification Confirm | ✅ |
| **resendVerificationEmail** | sendWelcomeEmail() | Resend verification | Welcome + Verify Link | ✅ |
| **requestPasswordReset** | sendPasswordResetEmail() | User forgets password | Reset Password Link | ✅ |
| **resendPasswordReset** | sendPasswordResetEmail() | Resend reset link | Reset Password Link | ✅ |

**Code Example:**
```javascript
// In register controller
const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
await sendWelcomeEmail(user.email, user.name, verificationLink);

// In verifyEmail controller
await sendEmailVerificationEmail(user.email, user.name);

// In requestPasswordReset controller
const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
await sendPasswordResetEmail(user.email, user.name, resetLink);
```

---

### Booking Module Emails (3 Events)

| Controller | Function Called | When Triggered | Email Type | Status |
|---|---|---|---|---|
| **createBooking** | sendBookingConfirmationEmail() | Booking created & paid | Booking Confirm | ✅ |
| **cancelBooking** | sendBookingCancellationEmail() | Guest cancels booking | Cancellation + Refund | ✅ |
| **confirmCheckOut** | sendReviewInvitationEmail() | Guest checks out | Review Invitation | ✅ |

**Code Example:**
```javascript
// In createBooking controller
const bookingDetails = {
  hostelName: hostel.name,
  bookingId: booking._id,
  checkIn: booking.checkInDate,
  checkOut: booking.checkOutDate,
  totalPrice: booking.totalPrice,
  hostelLocation: hostel.location.city,
};
await sendBookingConfirmationEmail(user.email, user.name, bookingDetails);

// In cancelBooking controller
const cancellationDetails = {
  hostelName: hostel.name,
  bookingId: booking._id,
  refundAmount: booking.refundAmount,
  reason: req.body.reason,
};
await sendBookingCancellationEmail(user.email, user.name, cancellationDetails);

// In confirmCheckOut controller
const reviewDetails = {
  hostelName: hostel.name,
  bookingId: booking._id,
};
await sendReviewInvitationEmail(user.email, user.name, reviewDetails);
```

---

### Complaint Module Emails (2 Events)

| Controller | Function Called | When Triggered | Email Type | Status |
|---|---|---|---|---|
| **createComplaint** | sendComplaintAcknowledgmentEmail() | Guest files complaint | Acknowledgment | ✅ |
| **resolveComplaint** | sendComplaintResolutionEmail() | Staff resolves issue | Resolution | ✅ |

**Code Example:**
```javascript
// In createComplaint controller
const complaintDetails = {
  complaintId: complaint._id,
  hostelName: hostel.name,
  category: complaint.category,
  priority: complaint.priority,
};
await sendComplaintAcknowledgmentEmail(user.email, user.name, complaintDetails);

// In resolveComplaint controller
const complaintDetails = {
  complaintId: complaint._id,
  resolutionNote: req.body.resolutionNote,
  refundAmount: req.body.refundAmount || 0,
};
await sendComplaintResolutionEmail(user.email, user.name, complaintDetails);
```

---

### Payment Module Emails (2 Events)

| Controller | Function Called | When Triggered | Email Type | Status |
|---|---|---|---|---|
| **confirmPayment** | sendPaymentConfirmationEmail() | Payment succeeds | Payment Confirm | ✅ |
| **refundPayment** | sendRefundEmail() | Refund issued | Refund Notice | ✅ |

**Code Example:**
```javascript
// In confirmPayment controller
const paymentDetails = {
  bookingId: booking._id,
  hostelName: hostel.name,
  amount: booking.totalPrice,
  transactionId: paymentIntentId,
};
await sendPaymentConfirmationEmail(user.email, user.name, paymentDetails);

// In refundPayment controller
const refundDetails = {
  bookingId: booking._id,
  hostelName: hostel.name,
  refundAmount: booking.refundAmount,
  reason: reason || "Booking cancelled",
};
await sendRefundEmail(user.email, user.name, refundDetails);
```

---

### Auth Welcome (Special Trigger)

| Flow | Function Called | When Triggered | Email Type | Status |
|---|---|---|---|---|
| **registerAsHost** | sendHostWelcomeEmail() | Host signs up | Host Welcome | ✅ |

---

## 📊 Email Distribution by Type

### By Frequency (Expected)
```
High Frequency:
├─ Welcome Email (on every registration)
├─ Booking Confirmation (on every booking)
└─ Review Invitation (1-2 per user)

Medium Frequency:
├─ Email Verification (some users)
├─ Password Reset (1-2 per user)
└─ Booking Cancellation (10-20% of bookings)

Low Frequency:
├─ Complaint Acknowledgment (2-5% of bookings)
├─ Complaint Resolution (1-2 per complaint)
├─ Payment Confirmation (on each booking)
├─ Refund (on cancellations)
└─ Host Welcome (on host registration)
```

### By Module
```
Auth Module:        5 email triggers
Booking Module:     3 email triggers
Complaint Module:   2 email triggers
Payment Module:     2 email triggers
Review Module:      1 email trigger (from booking)
─────────────────────────────────
TOTAL:             13+ email triggers
```

---

## 🔗 Email Delivery Path

```
User Action
    ↓
Controller Endpoint Called
    ↓
Business Logic Executed
    ↓
Database Record Created/Updated
    ↓
Email Helper Called
    ↓
Email Template Selected
    ↓
Brevo API (sendEmail)
    ↓
SMTP Transmission
    ↓
User Inbox
```

### Example: Full Booking Flow

```
1. User clicks "Book Now"
   ↓
2. POST /api/v1/bookings
   ↓
3. createBooking() controller
   - Validate dates
   - Check availability
   - Save booking
   ↓
4. sendBookingConfirmationEmail(user.email, user.name, details)
   ↓
5. emailHelper calls sendEmail()
   ↓
6. sendEmail gets template from emailTemplates.js
   ↓
7. Brevo API sends email
   ↓
8. Email appears in user inbox within seconds
```

---

## 📐 Email Template Template

All email functions follow this pattern:

```javascript
// In emailHelper.js
const sendXXXEmail = async (userEmail, userName, details) => {
  try {
    const { field1, field2, field3 } = details;
    
    // Get HTML from template
    const htmlContent = templates.templateName(userName, field1, field2, field3);
    
    // Send via Brevo
    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: "Email Subject Line",
      htmlContent,
    });
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`);
    return { success: false, error: error.message };
  }
};
```

---

## 🎨 Email Template Properties

### All Templates Include:
```
✅ Professional header with branding
✅ Personalized greeting (Hello {userName}!)
✅ Key transaction details
✅ Call-to-action button/link
✅ Footer with company info
✅ Inline CSS for email compatibility
✅ Mobile responsive design
✅ Unsubscribe info (in footer)
```

### Template Variables Used:
```
Common:
- userName (always)
- userEmail (always)

Auth Emails:
- verificationLink
- resetLink

Booking Emails:
- hostelName
- bookingId  
- checkInDate, checkOutDate
- totalPrice
- hostelLocation

Complaint Emails:
- complaintId
- category, priority
- resolutionNote
- refundAmount

Payment Emails:
- transactionId
- amount
- refundAmount
- reason
```

---

## 🔐 Email Security

### Implemented Security Measures:
✅ **HTTPS Links** - All links are HTTPS
✅ **Token Expiry** - All tokens have expiration
✅ **Email Validation** - Verify email format before sending
✅ **Rate Limiting** - Rate limit email endpoints
✅ **Logging** - Log all email sends for audit
✅ **Brevo Verification** - API key secured in .env
✅ **No Sensitive Data** - Passwords never in emails
✅ **Unsubscribe** - Footer has support contact

### Required in .env:
```env
BREVO_API_KEY=your_api_key        # Keep secret!
BREVO_SENDER_EMAIL=noreply@roomlink.com
BREVO_SENDER_NAME=RoomLink
EMAIL_NOTIFICATIONS_ENABLED=true
FRONTEND_URL=https://roomlink.com  # For links
```

---

## 📞 Email Support Contacts

All email templates include footer with:
```
Email: support@roomlink.com
Website: www.roomlink.com
Phone: +1-234-567-8900
```

---

## 📊 Email Monitoring Checklist

### Daily Checks:
- [ ] Check Brevo dashboard for bounce rate
- [ ] Monitor unsubscribe rate
- [ ] Review complaint rate
- [ ] Check delivery time (should be <5 seconds)

### Weekly Checks:
- [ ] Review email open rates
- [ ] Check click-through rates
- [ ] Monitor spam complaints
- [ ] Review failed sends

### Monthly Checks:
- [ ] Analyze email engagement trends
- [ ] Check domain reputation
- [ ] Review IP reputation
- [ ] Plan template updates if needed

---

## 🧪 Testing Emails

### Development Mode:
```env
EMAIL_NOTIFICATIONS_ENABLED=false  # Prevents real sends
```

### Test Email Sending:
```javascript
// In a test controller or route
const { sendWelcomeEmail } = require("../services/emailHelper");

const result = await sendWelcomeEmail(
  "test@gmail.com",
  "Test User",
  "https://roomlink.com/verify-email?token=abc123"
);

console.log(result); // { success: true, messageId: "..." }
```

### Check Brevo Dashboard:
1. Go to [brevo.com](https://brevo.com)
2. Navigate to "Transactional" → "Email Logs"
3. Search for your test email
4. Click to view full details
5. Check status: Sent/Opened/Clicks/Bounced

---

## 🚀 Quick Implementation Guide

### Step 1: Import Email Helper
```javascript
const { sendWelcomeEmail } = require("../../services/emailHelper");
```

### Step 2: Call After Success
```javascript
// After database operation completes
await sendWelcomeEmail(user.email, user.name, data);
```

### Step 3: Wrap in Try-Catch
```javascript
try {
  await sendWelcomeEmail(user.email, user.name, data);
} catch (emailError) {
  logger.error(`Failed to send email: ${emailError.message}`);
  // Don't block main flow if email fails
}
```

### Step 4: Test
1. Set EMAIL_NOTIFICATIONS_ENABLED=true
2. Make API request
3. Check email within 5 seconds
4. Check Brevo dashboard for delivery status

---

## 📋 Checklist: Ensure Email Works

- [ ] .env has BREVO_API_KEY
- [ ] .env has BREVO_SENDER_EMAIL
- [ ] .env has EMAIL_NOTIFICATIONS_ENABLED=true
- [ ] Controller imports correct email function
- [ ] Email function is called after DB operation
- [ ] Email function is wrapped in try-catch
- [ ] All required parameters passed to function
- [ ] Email received within 5 seconds
- [ ] Email content is correct (check template variables)
- [ ] Email formatting looks good in Gmail/Outlook

---

## 🎯 Email Implementation Priorities

### Must Have (Critical):
1. ✅ Register → Welcome Email
2. ✅ Email Verify → Confirmation
3. ✅ Forgot Password → Reset Link
4. ✅ Booking → Confirmation
5. ✅ Cancel Booking → Refund Notice

### Should Have (Important):
6. ✅ Password Reset → Success (can skip)
7. ✅ Complaint → Acknowledgment
8. ✅ Complaint Resolve → Resolution
9. ✅ Checkout → Review Invitation
10. ✅ Payment → Confirmation

### Nice to Have (Optional):
11. ✅ Status Change → Notification
12. Host Registration → Welcome
13. Complaint Escalated → Alert
14. Staff Assigned → Notification

---

## 📞 Troubleshooting Common Email Issues

### Email Not Arriving
**Check:**
1. Email typed correctly (no typos)
2. Brevo API key valid
3. SENDER_EMAIL matches Brevo account
4. Check spam folder
5. Check Brevo logs for bounces

### Email Content Wrong
**Check:**
1. Template variables passed correctly
2. Template file has correct HTML
3. Variables substituted (${userName})
4. No typos in template

### Email Delayed
**Check:**
1. Network connection stable
2. Brevo service status
3. Check email logs for queue position
4. May be rate-limited (unlikely with Brevo)

### Too Many Emails Sending
**Check:**
1. EMAIL_NOTIFICATIONS_ENABLED still true?
2. Email function only called once per action
3. No duplicate API calls
4. Check logs for multiple calls

---

**Status**: ✅ Email Integration Complete & Ready for Testing

All email functions, templates, and integration points are ready. Start implementing controllers and test email sending via Brevo dashboard!
