# 🎯 Email Implementation Checklist

Step-by-step guide to implement emails in each module.

## ✅ Phase 1: Authentication Module

### Step 1: Update auth.controller.js
**File**: `src/modules/auth/auth.controller.js`

- [ ] Import email helper at top
```javascript
const { 
  sendWelcomeEmail, 
  sendEmailVerificationEmail, 
  sendPasswordResetEmail,
  sendHostWelcomeEmail 
} = require("../../services/emailHelper");
```

### Step 2: Add email to register endpoint
**Location**: After user is created and before response

```javascript
exports.register = async (req, res) => {
  try {
    // ... existing validation ...
    
    // Create user in database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      emailVerified: false
    });
    
    // ✅ NEW: Send welcome email
    const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${user.emailVerificationToken}`;
    try {
      await sendWelcomeEmail(user.email, user.name, verificationLink);
    } catch (emailError) {
      logger.error(`Failed to send welcome email: ${emailError.message}`);
      // Don't block registration if email fails
    }
    
    return res.status(201).json({
      success: true,
      message: "User registered. Check email for verification link.",
      user: { id: user._id, email: user.email }
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

### Step 3: Add email to verification endpoint
**Location**: After email is verified

```javascript
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    
    // Mark as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    // ✅ NEW: Send verification confirmation email
    try {
      await sendEmailVerificationEmail(user.email, user.name);
    } catch (emailError) {
      logger.error(`Failed to send verification email: ${emailError.message}`);
    }
    
    return res.status(200).json({
      success: true,
      message: "Email verified successfully!"
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

### Step 4: Add email to password reset endpoint
**Location**: After reset token is generated

```javascript
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();
    
    // ✅ NEW: Send password reset email
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    try {
      await sendPasswordResetEmail(user.email, user.name, resetLink);
    } catch (emailError) {
      logger.error(`Failed to send reset email: ${emailError.message}`);
    }
    
    return res.status(200).json({
      success: true,
      message: "Check email for password reset link"
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

### Step 5: Add email to host registration
**Location**: If separate host registration endpoint

```javascript
exports.registerAsHost = async (req, res) => {
  try {
    // ... create host user ...
    const host = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "host",
      businessName,
      businessRegistration
    });
    
    // ✅ NEW: Send host welcome email
    try {
      await sendHostWelcomeEmail(host.email, host.name);
    } catch (emailError) {
      logger.error(`Failed to send host welcome email: ${emailError.message}`);
    }
    
    return res.status(201).json({ success: true, host });
  } catch (error) {
    // ... error handling ...
  }
};
```

---

## ✅ Phase 2: Booking Module

### Step 1: Update booking.controller.js
**File**: `src/modules/booking/booking.controller.js`

- [ ] Import email helper
```javascript
const { 
  sendBookingConfirmationEmail, 
  sendBookingCancellationEmail 
} = require("../../services/emailHelper");
```

### Step 2: Add email to booking creation
**Location**: After booking is created

```javascript
exports.createBooking = async (req, res) => {
  try {
    // ... validation ...
    
    const booking = await Booking.create({
      guestId,
      hostelId,
      roomId,
      checkInDate,
      checkOutDate,
      totalPrice,
      status: "confirmed"
    });
    
    // Get user and hostel details
    const user = await User.findById(guestId);
    const hostel = await Hostel.findById(hostelId);
    
    // ✅ NEW: Send booking confirmation email
    try {
      await sendBookingConfirmationEmail(user.email, user.name, {
        hostelName: hostel.name,
        bookingId: booking._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
        hostelLocation: hostel.location.city
      });
    } catch (emailError) {
      logger.error(`Failed to send booking confirmation: ${emailError.message}`);
    }
    
    return res.status(201).json({
      success: true,
      message: "Booking confirmed. Check email for details.",
      booking
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

### Step 3: Add email to booking cancellation
**Location**: After booking is cancelled

```javascript
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Calculate refund
    const refundAmount = booking.totalPrice * 0.9; // 90% refund
    
    // Cancel booking
    booking.status = "cancelled";
    booking.cancellationReason = req.body.reason || "User requested";
    booking.refundAmount = refundAmount;
    await booking.save();
    
    // Get user details
    const user = await User.findById(booking.guestId);
    
    // ✅ NEW: Send cancellation email
    try {
      await sendBookingCancellationEmail(user.email, user.name, {
        hostelName: booking.hostelName,
        bookingId: booking._id,
        refundAmount,
        reason: booking.cancellationReason
      });
    } catch (emailError) {
      logger.error(`Failed to send cancellation email: ${emailError.message}`);
    }
    
    return res.status(200).json({
      success: true,
      message: "Booking cancelled. Refund initiated.",
      booking
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

---

## ✅ Phase 3: Complaint Module

### Step 1: Update complaint.controller.js
**File**: `src/modules/complaint/complaint.controller.js`

- [ ] Import email helper
```javascript
const { 
  sendComplaintAcknowledgmentEmail, 
  sendComplaintResolutionEmail 
} = require("../../services/emailHelper");
```

### Step 2: Add email to complaint filing
**Location**: After complaint is created

```javascript
exports.createComplaint = async (req, res) => {
  try {
    // ... validation ...
    
    const complaint = await Complaint.create({
      userId,
      hostelId,
      bookingId,
      title,
      description,
      category,
      priority,
      status: "open"
    });
    
    // Get user details
    const user = await User.findById(userId);
    
    // ✅ NEW: Send acknowledgment email
    try {
      await sendComplaintAcknowledgmentEmail(user.email, user.name, {
        complaintId: complaint._id,
        hostelName: complaint.hostelName,
        category: complaint.category,
        priority: complaint.priority
      });
    } catch (emailError) {
      logger.error(`Failed to send complaint acknowledgment: ${emailError.message}`);
    }
    
    return res.status(201).json({
      success: true,
      message: `Complaint filed. Reference: ${complaint._id}`,
      complaint
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

### Step 3: Add email to complaint resolution
**Location**: After complaint is resolved

```javascript
exports.resolveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { resolutionNotes, refundAmount } = req.body;
    
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    
    // Mark as resolved
    complaint.status = "resolved";
    complaint.resolutionNotes = resolutionNotes;
    complaint.resolvedAt = new Date();
    complaint.refundAmount = refundAmount;
    await complaint.save();
    
    // Get user details
    const user = await User.findById(complaint.userId);
    
    // ✅ NEW: Send resolution email
    try {
      await sendComplaintResolutionEmail(user.email, user.name, {
        complaintId: complaint._id,
        resolutionNote: resolutionNotes,
        refundAmount
      });
    } catch (emailError) {
      logger.error(`Failed to send resolution email: ${emailError.message}`);
    }
    
    return res.status(200).json({
      success: true,
      message: "Complaint resolved",
      complaint
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

---

## ✅ Phase 4: Review Module (Optional - Using Scheduler)

### Option A: Send on Checkout (Manual)
**Location**: After checkout date is reached

```javascript
exports.sendReviewInvitation = async (req, res) => {
  try {
    // Find eligible bookings (checkout date passed, no review yet)
    const bookings = await Booking.find({
      checkOutDate: { $lt: new Date() },
      status: "completed",
      reviewed: false
    });
    
    let sent = 0;
    for (const booking of bookings) {
      const user = await User.findById(booking.guestId);
      const hostel = await Hostel.findById(booking.hostelId);
      
      try {
        await sendReviewInvitationEmail(user.email, user.name, {
          hostelName: hostel.name,
          bookingId: booking._id
        });
        sent++;
      } catch (emailError) {
        logger.error(`Failed to send review invitation: ${emailError.message}`);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Sent ${sent} review invitations`
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

### Option B: Automated Cron Job
**File**: `src/jobs/reviewInvitations.js`

```javascript
const cron = require("node-cron");
const Booking = require("../modules/booking/booking.model");
const User = require("../modules/user/user.model");
const Hostel = require("../modules/hostel/hostel.model");
const { sendReviewInvitationEmail } = require("../services/emailHelper");

// Run every day at 9 AM
cron.schedule("0 9 * * *", async () => {
  try {
    const bookings = await Booking.find({
      checkOutDate: { $lt: new Date() },
      status: "completed",
      reviewed: false
    });
    
    for (const booking of bookings) {
      const user = await User.findById(booking.guestId);
      const hostel = await Hostel.findById(booking.hostelId);
      
      try {
        await sendReviewInvitationEmail(user.email, user.name, {
          hostelName: hostel.name,
          bookingId: booking._id
        });
      } catch (emailError) {
        logger.error(`Review invitation failed: ${emailError.message}`);
      }
    }
    
    console.log(`✅ Review invitations sent to ${bookings.length} users`);
  } catch (error) {
    console.error(`Error sending review invitations: ${error.message}`);
  }
});
```

---

## ✅ Verification Checklist

### Before Testing
- [ ] All imports added to controllers
- [ ] BREVO_API_KEY set in .env
- [ ] BREVO_SENDER_EMAIL set in .env
- [ ] EMAIL_NOTIFICATIONS_ENABLED=true

### Testing Email Sending
- [ ] Register user → check email for welcome
- [ ] Verify email → check for verification email
- [ ] Request password reset → check for reset link
- [ ] Create booking → check for confirmation
- [ ] Cancel booking → check for cancellation
- [ ] File complaint → check for acknowledgment
- [ ] Resolve complaint → check for resolution

### Monitoring
- [ ] Check Brevo dashboard for delivery status
- [ ] View email logs
- [ ] Monitor server logs for email errors

---

## 📝 Code Patterns to Remember

### Always use try-catch
```javascript
try {
  await sendWelcomeEmail(email, name, link);
} catch (error) {
  logger.error(`Email failed: ${error.message}`);
  // Don't block main flow
}
```

### Email never blocks user response
```javascript
// ✅ CORRECT: Send email after response sent
booking.save();
await sendBookingConfirmationEmail(user.email, user.name, data);
res.json({ success: true });

// ❌ WRONG: Blocking response until email sent
await sendBookingConfirmationEmail(user.email, user.name, data);
res.json({ success: true });
```

### Gather all needed data first
```javascript
const user = await User.findById(userId);      // Get user
const hostel = await Hostel.findById(hostelId); // Get hostel
const booking = await Booking.findById(id);     // Get booking

// Then send email with all data
await sendBookingConfirmationEmail(user.email, user.name, {
  hostelName: hostel.name,
  bookingId: booking._id,
  checkIn: booking.checkInDate
});
```

---

## 🎉 Completion

After completing all phases, you will have:
- ✅ Welcome emails on registration
- ✅ Email verification confirmations
- ✅ Password reset emails
- ✅ Host welcome emails
- ✅ Booking confirmations
- ✅ Booking cancellations
- ✅ Complaint acknowledgments
- ✅ Complaint resolutions
- ✅ Review invitations

**Status**: Ready to implement! Follow the steps above in order.
