/**
 * Email Templates
 * Professional HTML email templates for various events
 */

const templates = {
  /**
   * Registration Welcome Email
   */
  registrationWelcome: (userName, verificationLink) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; }
            .content { padding: 20px; }
            .button { display: inline-block; background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; padding-top: 20px; border-top: 1px solid #ecf0f1; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏨 Welcome to RoomLink</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>Thank you for joining RoomLink, the ultimate hostel booking platform. We're excited to have you on board!</p>
                
                <p><strong>Get Started:</strong></p>
                <ul>
                    <li>Verify your email address</li>
                    <li>Complete your profile</li>
                    <li>Browse and book amazing hostels</li>
                    <li>Connect with travelers worldwide</li>
                </ul>
                
                <p><strong>Please verify your email by clicking the link below:</strong></p>
                <a href="${verificationLink}" class="button">Verify Email</a>
                
                <p style="color: #7f8c8d; font-size: 12px;">This link is valid for 24 hours. If you did not create this account, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Have questions? Contact us at support@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Email Verification Confirmation
   */
  emailVerified: (userName) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
            .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .content { padding: 20px; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Email Verified Successfully</h1>
            </div>
            <div class="content">
                <h2>Congratulations ${userName}!</h2>
                <p>Your email has been verified successfully. Your RoomLink account is now fully activated.</p>
                
                <p>You can now:</p>
                <ul>
                    <li>Book hostels</li>
                    <li>Leave reviews</li>
                    <li>Manage your bookings</li>
                    <li>Update your profile</li>
                </ul>
                
                <p>Start exploring amazing hostels today!</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Booking Confirmation Email
   */
  bookingConfirmation: (
    userName,
    hostelName,
    bookingId,
    checkIn,
    checkOut,
    totalPrice,
    hostelLocation
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
            .header { background-color: #3498db; color: white; padding: 20px; text-align: center; }
            .booking-details { background-color: #ecf0f1; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
            .booking-details p { margin: 8px 0; }
            .button { display: inline-block; background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; padding-top: 20px; border-top: 1px solid #ecf0f1; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Booking Confirmed!</h1>
            </div>
            <div style="padding: 20px;">
                <h2>Hello ${userName},</h2>
                <p>Your booking has been confirmed! Here are your booking details:</p>
                
                <div class="booking-details">
                    <p><strong>Booking ID:</strong> ${bookingId}</p>
                    <p><strong>Hostel:</strong> ${hostelName}</p>
                    <p><strong>Location:</strong> ${hostelLocation}</p>
                    <p><strong>Check-in:</strong> ${new Date(checkIn).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> ${new Date(checkOut).toLocaleDateString()}</p>
                    <p><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</p>
                </div>
                
                <p><strong>Important Information:</strong></p>
                <ul>
                    <li>Check-in time: 2:00 PM (or as specified by hostel)</li>
                    <li>Check-out time: 11:00 AM (or as specified by hostel)</li>
                    <li>Please keep your booking ID safe</li>
                    <li>Cancellation policy: Cancellations must be made 7 days before check-in</li>
                </ul>
                
                <a href="${process.env.FRONTEND_URL}/bookings/${bookingId}" class="button">View Booking Details</a>
            </div>
            <div class="footer">
                <p>If you have any questions, contact the hostel directly.</p>
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Booking Cancellation Email
   */
  bookingCancellation: (
    userName,
    hostelName,
    bookingId,
    refundAmount,
    reason
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
            .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .refund-box { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Booking Cancelled</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName},</h2>
                <p>Your booking has been successfully cancelled.</p>
                
                <p><strong>Cancellation Details:</strong></p>
                <p>Booking ID: ${bookingId}</p>
                <p>Hostel: ${hostelName}</p>
                <p>Cancellation Reason: ${reason || "User requested"}</p>
                
                <div class="refund-box">
                    <p><strong>Refund Amount:</strong> $${refundAmount.toFixed(2)}</p>
                    <p>The refund will be processed to your original payment method within 5-7 business days.</p>
                </div>
                
                <p>We hope to see you again at RoomLink soon!</p>
                <p>If you have any questions about this cancellation, please contact our support team.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Complaint Acknowledgment Email
   */
  complaintAcknowledgment: (
    userName,
    complaintId,
    hostelName,
    category,
    priority
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
            .header { background-color: #f39c12; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .ticket-box { background-color: #ecf0f1; padding: 15px; border-left: 4px solid #f39c12; margin: 20px 0; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 Complaint Received</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName},</h2>
                <p>Thank you for reporting this issue. We take all complaints seriously and will investigate promptly.</p>
                
                <div class="ticket-box">
                    <p><strong>Complaint ID:</strong> ${complaintId}</p>
                    <p><strong>Hostel:</strong> ${hostelName}</p>
                    <p><strong>Category:</strong> ${category}</p>
                    <p><strong>Priority:</strong> <span style="color: #e74c3c; font-weight: bold;">${priority.toUpperCase()}</span></p>
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                    <li>Our support team will review your complaint within 24 hours</li>
                    <li>You will receive an email update on the status</li>
                    <li>We aim to resolve all complaints within 5-7 business days</li>
                </ul>
                
                <p>We appreciate your feedback. It helps us maintain the highest standards of service.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Complaint Resolution Email
   */
  complaintResolution: (
    userName,
    complaintId,
    resolutionNote
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
            .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .resolution-box { background-color: #d4edda; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0; }
            .button { display: inline-block; background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Complaint Resolved</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName},</h2>
                <p>Your complaint (ID: ${complaintId}) has been reviewed and resolved.</p>
                
                <div class="resolution-box">
                    <p><strong>Resolution Details:</strong></p>
                    <p>${resolutionNote}</p>
                </div>
                
                <p>If you're satisfied with this resolution, please let us know! Your feedback helps us improve.</p>
                <a href="${process.env.FRONTEND_URL}/complaints/${complaintId}" class="button">View Full Details</a>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Review Invitation Email
   */
  reviewInvitation: (
    userName,
    hostelName,
    bookingId
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
            .header { background-color: #9b59b6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; background-color: #9b59b6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⭐ Share Your Experience</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName},</h2>
                <p>We hope you had a great stay at <strong>${hostelName}</strong>!</p>
                
                <p>Your experience matters to us and to future travelers. Please take a moment to share your honest review.</p>
                
                <p><strong>Your review helps:</strong></p>
                <ul>
                    <li>Other travelers choose the best hostels</li>
                    <li>Hostels improve their services</li>
                    <li>RoomLink maintain quality standards</li>
                </ul>
                
                <a href="${process.env.FRONTEND_URL}/bookings/${bookingId}/review" class="button">Write a Review</a>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Password Reset Email
   */
  passwordReset: (userName, resetLink) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
            .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .warning { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .button { display: inline-block; background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName},</h2>
                <p>We received a request to reset your password. Click the button below to create a new password.</p>
                
                <a href="${resetLink}" class="button">Reset Password</a>
                
                <div class="warning">
                    <p><strong>⚠️ Important:</strong></p>
                    <p>This link is valid for 24 hours only. If you did not request a password reset, please ignore this email.</p>
                </div>
                
                <p>For security reasons, never share your password reset link with anyone.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Welcome Host Email
   */
  hostWelcome: (hostName) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
            .header { background-color: #16a085; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .feature { background-color: #ecf0f1; padding: 15px; margin: 10px 0; border-left: 4px solid #16a085; }
            .button { display: inline-block; background-color: #16a085; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏨 Welcome to RoomLink Hosts</h1>
            </div>
            <div class="content">
                <h2>Hello ${hostName}!</h2>
                <p>Welcome to the RoomLink Host program! We're excited to help you manage your hostel and reach travelers worldwide.</p>
                
                <p><strong>Get Started:</strong></p>
                <div class="feature">
                    <p><strong>1. Create Your Listing</strong> - Add your hostel details, photos, and amenities</p>
                </div>
                <div class="feature">
                    <p><strong>2. Set Your Rates</strong> - Manage pricing and availability</p>
                </div>
                <div class="feature">
                    <p><strong>3. Receive Bookings</strong> - Manage reservations and guest requests</p>
                </div>
                <div class="feature">
                    <p><strong>4. Grow Your Business</strong> - Build reputation through reviews and ratings</p>
                </div>
                
                <a href="${process.env.FRONTEND_URL}/host/dashboard" class="button">Go to Host Dashboard</a>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Payment Confirmation Email
   */
  paymentConfirmation: (userName, bookingId, hostelName, amount, transactionId) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; }
            .content { padding: 20px; }
            .details { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ecf0f1; }
            .detail-row:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #2c3e50; }
            .amount { color: #27ae60; font-weight: bold; font-size: 16px; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; padding-top: 20px; border-top: 1px solid #ecf0f1; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Payment Confirmed</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>Your payment has been successfully processed. Your booking is now confirmed!</p>
                
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Booking ID:</span>
                        <span>${bookingId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Hostel:</span>
                        <span>${hostelName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Amount Paid:</span>
                        <span class="amount">$${amount}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Transaction ID:</span>
                        <span>${transactionId}</span>
                    </div>
                </div>
                
                <p><strong>What's Next?</strong></p>
                <ul>
                    <li>You'll receive a check-in instructions email soon</li>
                    <li>Check your booking details in your account</li>
                    <li>Contact the hostel if you have any questions</li>
                </ul>
                
                <p style="color: #7f8c8d; font-size: 12px;">This is an automated receipt. Please keep it for your records.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Need help? Contact us at support@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Refund Email
   */
  refundEmail: (userName, bookingId, hostelName, refundAmount, reason) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background-color: #3498db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; }
            .content { padding: 20px; }
            .details { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ecf0f1; }
            .detail-row:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #2c3e50; }
            .amount { color: #3498db; font-weight: bold; font-size: 16px; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; padding-top: 20px; border-top: 1px solid #ecf0f1; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💳 Refund Processed</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>Your refund has been processed successfully.</p>
                
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Booking ID:</span>
                        <span>${bookingId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Hostel:</span>
                        <span>${hostelName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Refund Amount:</span>
                        <span class="amount">$${refundAmount}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Reason:</span>
                        <span>${reason}</span>
                    </div>
                </div>
                
                <p><strong>Refund Timeline:</strong></p>
                <ul>
                    <li>Refund initiated immediately</li>
                    <li>It may take 5-10 business days to appear in your account</li>
                    <li>Please check your bank or PayPal account</li>
                </ul>
                
                <p>We understand booking plans change. If you have any feedback about your experience, we'd love to hear from you!</p>
                
                <p style="color: #7f8c8d; font-size: 12px;">Transaction reference has been saved to your account.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Questions? Contact us at support@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,
};

module.exports = templates;
