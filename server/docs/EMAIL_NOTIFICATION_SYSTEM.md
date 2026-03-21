# Email Notification System Documentation

## Overview
The RoomLink notification system automatically sends transactional emails to guests and hostel owners at key points in the booking lifecycle. All emails are handled asynchronously to avoid blocking API responses.

---

## Email Templates & Triggers

### 1. **Booking Confirmation Email**
**Trigger:** Immediately after booking creation  
**Recipient:** Guest  
**Template Key:** `BOOKING_CONFIRMATION`

**Sent Information:**
- Booking reference number
- Hostel name & address
- Room type & room number
- Check-in/Check-out dates  
- Number of guests
- Nightly rate & discounts applied
- Total price breakdown
- Check-in/Check-out times
- Hostel contact info
- Link to booking portal

**Code Trigger:**
```javascript
notificationService.sendBookingConfirmation(bookingId)
```

---

### 2. **Hostel New Booking Alert**
**Trigger:** Immediately after booking creation  
**Recipient:** Hostel Owner/Manager  
**Template Key:** `HOSTEL_NEW_BOOKING`

**Sent Information:**
- Guest name, email, phone
- Booking reference
- Room number & type
- Check-in/Check-out dates
- Number of guests
- Total price
- Special requests
- Link to booking management dashboard

**Code Trigger:**
```javascript
notificationService.sendHostelNewBookingAlert(bookingId)
```

---

### 3. **Payment Confirmation Email**
**Trigger:** When M-Pesa payment is confirmed  
**Recipient:** Guest  
**Template Key:** `PAYMENT_CONFIRMATION`

**Sent Information:**
- Transaction ID
- Amount paid
- Payment date & time
- Payment method (M-Pesa)
- Receipt number
- Booking reference

**Code Trigger:**
```javascript
notificationService.sendPaymentConfirmation(bookingId, transactionId, amount)
```

---

### 4. **Check-In Reminder Email**
**Trigger:** 24 hours before check-in date  
**Recipient:** Guest  
**Template Key:** `CHECKIN_REMINDER`

**Sent Information:**
- Check-in date
- Check-in time
- Hostel address with map link
- Hostel contact details
- Room number & type
- Special requests
- Travel directions

**Scheduled:** Runs automatically every hour via node-cron  
**Code Trigger:**
```javascript
notificationService.sendCheckInReminder(bookingId)
```

---

### 5. **Check-Out Reminder Email**
**Trigger:** On check-out day (morning at 6 AM)  
**Recipient:** Guest  
**Template Key:** `CHECKOUT_REMINDER`

**Sent Information:**
- Check-out time
- Room number
- Hostel contact info
- Check-out instructions
- Late checkout fee information
- Items to remember (keys, valuables)

**Scheduled:** Runs daily at 6 AM via node-cron  
**Code Trigger:**
```javascript
notificationService.sendCheckOutReminder(bookingId)
```

---

### 6. **Review Invitation Email**
**Trigger:** Immediately after guest checks out  
**Recipient:** Guest  
**Template Key:** `REVIEW_INVITATION`

**Sent Information:**
- Hostel name
- Room type
- Stay duration (number of nights)
- Check-out date
- Direct link to leave review
- Hostel image

**Code Trigger:**
```javascript
notificationService.sendReviewInvitation(bookingId)
```

---

### 7. **Booking Cancellation Email**
**Trigger:** When guest cancels booking  
**Recipient:** Guest  
**Template Key:** `BOOKING_CANCELLED`

**Sent Information:**
- Booking reference
- Hostel name
- Cancellation date
- Cancellation reason
- Refund amount & percentage
- Estimated refund timeline
- Support email for disputes

**Code Trigger:**
```javascript
notificationService.sendBookingCancellation(bookingId)
```

---

## How to Set Up Email Notifications

### 1. **Install Dependencies**
```bash
npm install brevo node-cron
```

### 2. **Configure Environment Variables**
```env
# .env file
BREVO_API_KEY=your_brevo_api_key_here
FRONTEND_URL=http://localhost:3000
SUPPORT_EMAIL=support@roomlink.ug
```

### 3. **Initialize Scheduler (in app.js)**
```javascript
const cron = require('node-cron');
const bookingScheduler = require('./services/bookingScheduler');

// After express app setup
bookingScheduler.initializeScheduler(cron);
```

### 4. **Email Service Configuration**
The email service is already configured to work with Brevo. Template keys should match your Brevo account templates.

---

## Scheduled Notification Jobs

| Task | Schedule | Time | Purpose |
|------|----------|------|---------|
| Check-in Reminders | Hourly | Every hour | Remind guests 24 hours before check-in |
| Check-out Reminders | Daily | 6:00 AM | Remind guests on check-out day |
| Payment Reminders | Every 6 hours | 12 AM, 6 AM, 12 PM, 6 PM | Remind about unpaid bookings |
| No-Show Marking | Daily | 2:15 PM | Auto-mark unpaid check-ins as NO-SHOW |

---

## Email Sending Flow

```
User Action → Controller → notificationService
                            ↓
                      emailService.sendEmail()
                            ↓
                      Brevo API
                            ↓
                      Guest Email
```

All email sending is **asynchronous** and uses `.catch()` to handle failures without blocking the API response.

---

## Testing Notifications

### Manual Testing
```bash
# Test check-in reminder
POST /api/v1/bookings/:id/test-checkin-email

# Test review invitation
POST /api/v1/bookings/:id/test-review-email

# Test cancellation email
POST /api/v1/bookings/:id/test-cancel-email
```

### Using Node-cron Manually
```javascript
const bookingScheduler = require('./services/bookingScheduler');

// Test sending check-in reminders
await bookingScheduler.sendCheckInReminders();

// Test marking no-shows
await bookingScheduler.markNoShowBookings();
```

---

## Email Customization

### Creating New Email Templates
1. Add template in Brevo dashboard
2. Get template key (e.g., `CUSTOM_EMAIL`)
3. Add function to notificationService.js:

```javascript
const sendCustomEmail = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate("user", "email name");

  const emailData = {
    to: booking.user.email,
    templateKey: "CUSTOM_EMAIL",
    variables: {
      // Your custom variables
    },
  };

  await emailService.sendEmail(emailData);
};
```

### Modifying Email Content
Edit the `variables` object in each email function in `notificationService.js` to customize what data is sent to the email templates.

---

## Troubleshooting

### Emails Not Sending
1. **Check Brevo API Key:** Verify `BREVO_API_KEY` in .env
2. **Check Email Service:** Review logs for emailService errors
3. **Check Email Templates:** Verify template keys exist in Brevo
4. **Check Database Connection:** Ensure bookings can be fetched from database

### Missing Scheduler
If cron jobs don't run:
1. Install node-cron: `npm install node-cron`
2. Initialize scheduler in app.js before starting server
3. Check server logs for scheduler initialization message

### Template Variables Not Populating
1. Verify variable names match between code and Brevo template
2. Ensure booking has all required fields populated
3. Check emailService logs for variable substitution errors

---

## Monitoring & Logging

All email activities are logged using the Winston logger:
```
[timestamp] [info] Booking confirmation sent to user@example.com
[timestamp] [error] Failed to send check-in reminder: ...
```

Monitor logs using:
```bash
tail -f logs/combined.log | grep "email"
```

---

## Future Enhancements

- [ ] SMS notifications for critical events
- [ ] Push notifications via mobile app
- [ ] Email scheduling with custom time selection
- [ ] Email template preview in admin dashboard
- [ ] Email bounce/unsubscribe handling
- [ ] Personalized hostel signature in emails
- [ ] Multi-language email templates

---

## API Response Examples

### After Booking Creation
```json
{
  "status": 201,
  "message": "Booking created successfully. Confirmation email sent.",
  "data": { /* booking details */ }
}
```

### After Guest Check-Out
```json
{
  "status": 200,
  "message": "Guest checked-out successfully. Review invitation sent.",
  "data": { /* booking details */ }
}
```

### After Booking Cancellation
```json
{
  "status": 200,
  "message": "Booking cancelled successfully. Cancellation email sent.",
  "data": { /* booking details */ }
}
```

---

**Last Updated:** February 2026  
**Maintained By:** RoomLink Development Team
