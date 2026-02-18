# 📧 Email System Quick Reference

Quick guide to using the RoomLink professional email system with Brevo.

## 🚀 Quick Start

### 1. Environment Setup
```env
BREVO_API_KEY=your_key
BREVO_SENDER_EMAIL=noreply@roomlink.com
BREVO_SENDER_NAME=RoomLink
EMAIL_NOTIFICATIONS_ENABLED=true
```

### 2. Import Email Helper
```javascript
const { sendWelcomeEmail } = require("../../services/emailHelper");
```

### 3. Send Email
```javascript
await sendWelcomeEmail(userEmail, userName, verificationLink);
```

---

## 📧 Email Helper Functions

### Authentication Emails

```javascript
// Send welcome email on registration
await sendWelcomeEmail(email, name, verificationLink);

// Send email verification confirmation
await sendEmailVerificationEmail(email, name);

// Send password reset email
await sendPasswordResetEmail(email, name, resetLink);

// Send host welcome email
await sendHostWelcomeEmail(email, name);
```

### Booking Emails

```javascript
// Send booking confirmation
await sendBookingConfirmationEmail(email, name, {
  hostelName: "Hostel Name",
  bookingId: "ID",
  checkIn: date,
  checkOut: date,
  totalPrice: 100,
  hostelLocation: "City"
});

// Send booking cancellation
await sendBookingCancellationEmail(email, name, {
  hostelName: "Hostel Name",
  bookingId: "ID",
  refundAmount: 100,
  reason: "User requested"
});
```

### Complaint Emails

```javascript
// Send complaint acknowledgment
await sendComplaintAcknowledgmentEmail(email, name, {
  complaintId: "ID",
  hostelName: "Name",
  category: "maintenance",
  priority: "high"
});

// Send complaint resolution
await sendComplaintResolutionEmail(email, name, {
  complaintId: "ID",
  resolutionNote: "Issue fixed"
});
```

### Review Emails

```javascript
// Send review invitation
await sendReviewInvitationEmail(email, name, {
  hostelName: "Hostel Name",
  bookingId: "ID"
});
```

---

## 🔌 Where to Add Emails

### Auth Module
```javascript
// src/modules/auth/auth.controller.js

// On register - send welcome
await sendWelcomeEmail(user.email, user.name, verificationLink);

// On email verify - send confirmation
await sendEmailVerificationEmail(user.email, user.name);

// On password reset request - send reset email
await sendPasswordResetEmail(user.email, user.name, resetLink);
```

### Booking Module
```javascript
// src/modules/booking/booking.controller.js

// On create booking - send confirmation
await sendBookingConfirmationEmail(user.email, user.name, bookingDetails);

// On cancel booking - send cancellation
await sendBookingCancellationEmail(user.email, user.name, cancellationDetails);
```

### Complaint Module
```javascript
// src/modules/complaint/complaint.controller.js

// On create complaint - send acknowledgment
await sendComplaintAcknowledgmentEmail(user.email, user.name, complaintDetails);

// On resolve complaint - send resolution
await sendComplaintResolutionEmail(user.email, user.name, complaintDetails);
```

### Review Module
```javascript
// src/modules/review/review.controller.js

// After booking checkout - send review invitation
// (use cron job or scheduled task)
await sendReviewInvitationEmail(user.email, user.name, reviewDetails);
```

---

## 📝 Available Templates

| Template | Function | Use |
|----------|----------|-----|
| Welcome | `registrationWelcome` | New user registration |
| Verification | `emailVerified` | Email confirmed |
| Booking Confirmation | `bookingConfirmation` | Booking created |
| Booking Cancellation | `bookingCancellation` | Booking cancelled |
| Complaint Ack | `complaintAcknowledgment` | Complaint filed |
| Complaint Resolution | `complaintResolution` | Complaint resolved |
| Review Invitation | `reviewInvitation` | Ask for review |
| Password Reset | `passwordReset` | Reset password |
| Host Welcome | `hostWelcome` | New host joins |

---

## ✅ Checklist for Implementation

### Auth Module
- [ ] Register: Send welcome email
- [ ] Email verify: Send verification email
- [ ] Password reset: Send reset email
- [ ] Host register: Send host welcome

### Booking Module
- [ ] Create booking: Send confirmation
- [ ] Cancel booking: Send cancellation

### Complaint Module
- [ ] Create complaint: Send acknowledgment
- [ ] Resolve complaint: Send resolution

### Review Module
- [ ] Post-checkout: Send review invitation

---

## 🧪 Testing

### Enable/Disable Emails
```env
# Turn off for development
EMAIL_NOTIFICATIONS_ENABLED=false

# Turn on for testing
EMAIL_NOTIFICATIONS_ENABLED=true
```

### Test Email
```javascript
const { sendWelcomeEmail } = require("../../services/emailHelper");

const result = await sendWelcomeEmail(
  "youremail@gmail.com",
  "Test User",
  "https://roomlink.com/verify-email/test"
);

console.log(result);
// { success: true, messageId: "..." }
```

---

## 🎨 Customize Templates

### Edit templates in `src/services/emailTemplates.js`

```javascript
// Each template is a function
const customTemplate = (userName, data) => `
  <!DOCTYPE html>
  <html>
  <body>
    <h1>Hello ${userName}!</h1>
    <p>Your custom content here</p>
  </body>
  </html>
`;
```

### Update colors, text, links as needed
```javascript
// Change color scheme
background-color: #3498db  // Blue
background-color: #27ae60  // Green
background-color: #e74c3c  // Red
```

---

## 🚨 Error Handling

```javascript
try {
  const result = await sendWelcomeEmail(email, name, link);
  
  if (!result.success) {
    logger.error(`Email failed: ${result.error}`);
    // Handle error gracefully
  }
} catch (error) {
  logger.error(`Email error: ${error.message}`);
  // Don't block user flow if email fails
}
```

---

## 📊 Monitoring

### Check email status
1. Go to [brevo.com](https://brevo.com)
2. Transactional → Email logs
3. View delivery status
4. Check bounce/complaint rates

### Monitor from code
```javascript
const result = await sendEmail({...});
console.log(result.messageId); // Track email ID
```

---

## 🔒 Security Notes

✅ Never hardcode email addresses
✅ Always validate email format
✅ Don't send sensitive passwords
✅ Use HTTPS for all links
✅ Add unsubscribe option for bulk emails
✅ Log all email activities

---

## 📚 File Structure

```
src/
├── services/
│   ├── email.service.js      ← Brevo API integration
│   ├── emailTemplates.js     ← Email HTML templates
│   └── emailHelper.js        ← Easy-to-use functions
│
├── modules/
│   ├── auth/auth.controller.js       ← Add welcome email
│   ├── booking/booking.controller.js ← Add booking emails
│   ├── complaint/complaint.controller.js ← Add complaint emails
│   └── review/review.controller.js   ← Add review invitation
```

---

## 🆘 Common Issues

### Email not sending?
- Check `BREVO_API_KEY` in .env
- Verify `EMAIL_NOTIFICATIONS_ENABLED=true`
- Check email address format
- View server logs

### Wrong sender name/email?
- Update `BREVO_SENDER_EMAIL`
- Update `BREVO_SENDER_NAME`
- Must match Brevo account settings

### Template looks broken?
- Check CSS in template file
- Use inline styles for compatibility
- Test in different email clients

---

**For detailed guide**: See `EMAIL_INTEGRATION_GUIDE.md`

**Status**: ✅ Email System Ready | Start Implementing!
