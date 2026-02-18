/**
 * Professional Email Templates - Airbnb Style
 * Flat design, no gradients, professional colors
 * 
 * DESIGN SYSTEM:
 * - Primary: #FF5A5F (Airbnb red)
 * - Success: #00A699 (Teal)
 * - Warning: #FFB800 (Amber)
 * - Error: #E74C3C (Red)
 * - Info: #0073E6 (Blue)
 * - Text: #222222 (Dark gray)
 * - Background: #FAFAFA (Off-white)
 * - Border: #EEEEEE (Light gray)
 */

const templates = {
  /**
   * Registration Welcome Email
   * Color: Primary Red (#FF5A5F)
   */
  registrationWelcome: (userName, verificationLink) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #FAFAFA;
                color: #222222;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .header {
                background-color: #FF5A5F;
                color: #FFFFFF;
                padding: 50px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                font-size: 14px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #222222;
            }
            .content p {
                margin-bottom: 15px;
                color: #222222;
            }
            .content ul {
                margin: 15px 0 15px 20px;
            }
            .content li {
                margin-bottom: 8px;
                color: #222222;
            }
            .button {
                display: inline-block;
                background-color: #FF5A5F;
                color: #FFFFFF;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 25px 0;
                transition: opacity 0.2s ease;
            }
            .button:hover {
                opacity: 0.9;
            }
            .highlight {
                font-weight: 600;
                color: #FF5A5F;
            }
            .note {
                color: #717171;
                font-size: 12px;
                margin-top: 20px;
            }
            .footer {
                text-align: center;
                color: #717171;
                font-size: 12px;
                padding: 30px;
                border-top: 1px solid #EEEEEE;
            }
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
                
                <p><span class="highlight">Get Started:</span></p>
                <ul>
                    <li>✓ Verify your email address</li>
                    <li>✓ Complete your profile</li>
                    <li>✓ Browse amazing hostels worldwide</li>
                    <li>✓ Connect with travelers globally</li>
                </ul>
                
                <p>Please verify your email by clicking the button below:</p>
                <center>
                    <a href="${verificationLink}" class="button">Verify Email Address</a>
                </center>
                
                <p class="note">This link is valid for 24 hours. If you did not create this account, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Questions? Contact us at support@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Email Verification Confirmation
   * Color: Success Teal (#00A699)
   */
  emailVerified: (userName) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #FAFAFA;
                color: #222222;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .header {
                background-color: #00A699;
                color: #FFFFFF;
                padding: 50px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                font-size: 14px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #222222;
            }
            .content p {
                margin-bottom: 15px;
                color: #222222;
            }
            .content ul {
                margin: 15px 0 15px 20px;
            }
            .content li {
                margin-bottom: 8px;
                color: #222222;
            }
            .success-badge {
                display: inline-block;
                background-color: #E8F5F3;
                color: #00A699;
                padding: 15px;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
                border-left: 4px solid #00A699;
            }
            .footer {
                text-align: center;
                color: #717171;
                font-size: 12px;
                padding: 30px;
                border-top: 1px solid #EEEEEE;
            }
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
                
                <div class="success-badge">
                    You can now explore all features!
                </div>
                
                <p><strong>You can now:</strong></p>
                <ul>
                    <li>✓ Book amazing hostels</li>
                    <li>✓ Leave reviews and ratings</li>
                    <li>✓ Manage your bookings</li>
                    <li>✓ Update your profile</li>
                </ul>
                
                <p>Start exploring incredible hostels worldwide today!</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Have questions? Contact support@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Booking Confirmation Email
   * Color: Info Blue (#0073E6)
   */
  bookingConfirmation: (userName, hostelName, bookingId, checkIn, checkOut, totalPrice, hostelLocation) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #FAFAFA;
                color: #222222;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .header {
                background-color: #0073E6;
                color: #FFFFFF;
                padding: 50px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                font-size: 14px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #222222;
            }
            .details-box {
                background-color: #E6F0FF;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #0073E6;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #D4E0FF;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: 600;
                color: #222222;
            }
            .value {
                color: #717171;
            }
            .button {
                display: inline-block;
                background-color: #0073E6;
                color: #FFFFFF;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 25px 0;
                transition: opacity 0.2s ease;
            }
            .button:hover {
                opacity: 0.9;
            }
            .content ul {
                margin: 15px 0 15px 20px;
            }
            .content li {
                margin-bottom: 8px;
                color: #222222;
            }
            .footer {
                text-align: center;
                color: #717171;
                font-size: 12px;
                padding: 30px;
                border-top: 1px solid #EEEEEE;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Booking Confirmed!</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName},</h2>
                <p>Your booking has been successfully confirmed! Here are your booking details:</p>
                
                <div class="details-box">
                    <div class="detail-row">
                        <span class="label">Booking ID:</span>
                        <span class="value">${bookingId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Hostel:</span>
                        <span class="value">${hostelName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Location:</span>
                        <span class="value">${hostelLocation}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Check-in:</span>
                        <span class="value">${new Date(checkIn).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Check-out:</span>
                        <span class="value">${new Date(checkOut).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Total Price:</span>
                        <span class="value" style="color: #0073E6; font-weight: 600;">$${totalPrice.toFixed(2)}</span>
                    </div>
                </div>
                
                <p><strong>Important Information:</strong></p>
                <ul>
                    <li>Check-in time: 2:00 PM (or as specified by hostel)</li>
                    <li>Check-out time: 11:00 AM (or as specified by hostel)</li>
                    <li>Keep your booking ID safe and secure</li>
                    <li>Cancellation policy: 7 days before check-in for full refund</li>
                </ul>
                
                <center>
                    <a href="${process.env.FRONTEND_URL}/bookings/${bookingId}" class="button">View Booking Details</a>
                </center>
            </div>
            <div class="footer">
                <p>Questions? Contact the hostel or support@roomlink.com</p>
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Booking Cancellation Email
   * Color: Warning Amber (#FFB800)
   */
  bookingCancellation: (userName, hostelName, bookingId, refundAmount, reason) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #FAFAFA;
                color: #222222;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .header {
                background-color: #FFB800;
                color: #222222;
                padding: 50px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                font-size: 14px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #222222;
            }
            .content p {
                margin-bottom: 15px;
                color: #222222;
            }
            .refund-box {
                background-color: #FFF4D6;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #FFB800;
            }
            .refund-box p {
                margin: 10px 0;
            }
            .refund-amount {
                font-size: 18px;
                font-weight: 600;
                color: #FFB800;
            }
            .footer {
                text-align: center;
                color: #717171;
                font-size: 12px;
                padding: 30px;
                border-top: 1px solid #EEEEEE;
            }
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
                <ul>
                    <li><strong>Booking ID:</strong> ${bookingId}</li>
                    <li><strong>Hostel:</strong> ${hostelName}</li>
                    <li><strong>Reason:</strong> ${reason || "User requested"}</li>
                </ul>
                
                <div class="refund-box">
                    <p class="refund-amount">Refund Amount: $${refundAmount.toFixed(2)}</p>
                    <p>The refund will be processed to your original payment method within 5-7 business days.</p>
                </div>
                
                <p>We understand plans change. We hope to welcome you back to RoomLink soon!</p>
                <p>If you have questions about this cancellation, contact our support team.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Support: support@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Complaint Acknowledgment Email
   * Color: Warning Amber (#FFB800)
   */
  complaintAcknowledgment: (userName, complaintId, hostelName, category, priority) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #FAFAFA;
                color: #222222;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .header {
                background-color: #FFB800;
                color: #222222;
                padding: 50px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                font-size: 14px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #222222;
            }
            .content p {
                margin-bottom: 15px;
                color: #222222;
            }
            .ticket-box {
                background-color: #FFF4D6;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #FFB800;
            }
            .ticket-box p {
                margin: 8px 0;
            }
            .priority {
                font-weight: 600;
                color: #E74C3C;
            }
            .content ul {
                margin: 15px 0 15px 20px;
            }
            .content li {
                margin-bottom: 8px;
                color: #222222;
            }
            .footer {
                text-align: center;
                color: #717171;
                font-size: 12px;
                padding: 30px;
                border-top: 1px solid #EEEEEE;
            }
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
                    <p><strong>Priority:</strong> <span class="priority">${priority.toUpperCase()}</span></p>
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                    <li>Our support team will review within 24 hours</li>
                    <li>You'll receive status updates via email</li>
                    <li>We aim to resolve complaints within 5-7 business days</li>
                </ul>
                
                <p>We appreciate your feedback. It helps us maintain excellent service standards.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Support: support@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Complaint Resolution Email
   * Color: Success Teal (#00A699)
   */
  complaintResolution: (userName, complaintId, resolutionNote) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #FAFAFA;
                color: #222222;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .header {
                background-color: #00A699;
                color: #FFFFFF;
                padding: 50px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                font-size: 14px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #222222;
            }
            .content p {
                margin-bottom: 15px;
                color: #222222;
            }
            .resolution-box {
                background-color: #E8F5F3;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #00A699;
            }
            .button {
                display: inline-block;
                background-color: #00A699;
                color: #FFFFFF;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 25px 0;
                transition: opacity 0.2s ease;
            }
            .button:hover {
                opacity: 0.9;
            }
            .footer {
                text-align: center;
                color: #717171;
                font-size: 12px;
                padding: 30px;
                border-top: 1px solid #EEEEEE;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Complaint Resolved</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName},</h2>
                <p>Your complaint (ID: <strong>${complaintId}</strong>) has been reviewed and resolved.</p>
                
                <div class="resolution-box">
                    <p><strong>Resolution Details:</strong></p>
                    <p>${resolutionNote}</p>
                </div>
                
                <p>If you're satisfied with this resolution, please let us know! Your feedback helps us improve continuously.</p>
                
                <center>
                    <a href="${process.env.FRONTEND_URL}/complaints/${complaintId}" class="button">View Full Details</a>
                </center>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Questions? Contact support@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Review Invitation Email
   * Color: Primary Red (#FF5A5F)
   */
  reviewInvitation: (userName, hostelName, bookingId) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #FAFAFA;
                color: #222222;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .header {
                background-color: #FF5A5F;
                color: #FFFFFF;
                padding: 50px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                font-size: 14px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #222222;
            }
            .content p {
                margin-bottom: 15px;
                color: #222222;
            }
            .benefit-box {
                background-color: #FFE5E4;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #FF5A5F;
            }
            .benefit-box ul {
                margin: 10px 0 0 20px;
            }
            .benefit-box li {
                margin: 8px 0;
                color: #222222;
            }
            .button {
                display: inline-block;
                background-color: #FF5A5F;
                color: #FFFFFF;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 25px 0;
                transition: opacity 0.2s ease;
            }
            .button:hover {
                opacity: 0.9;
            }
            .footer {
                text-align: center;
                color: #717171;
                font-size: 12px;
                padding: 30px;
                border-top: 1px solid #EEEEEE;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⭐ Share Your Experience</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName},</h2>
                <p>We hope you had a wonderful stay at <strong>${hostelName}</strong>!</p>
                
                <p>Your experience matters to us and to future travelers. Please share your honest review.</p>
                
                <div class="benefit-box">
                    <p><strong>Your review helps:</strong></p>
                    <ul>
                        <li>Future travelers choose the best hostels</li>
                        <li>Hostels improve their services</li>
                        <li>RoomLink maintain quality standards</li>
                    </ul>
                </div>
                
                <p>It takes just 2 minutes to leave a review!</p>
                
                <center>
                    <a href="${process.env.FRONTEND_URL}/bookings/${bookingId}/review" class="button">Write a Review</a>
                </center>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Questions? Contact support@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Password Reset Email
   * Color: Error Red (#E74C3C)
   */
  passwordReset: (userName, resetLink) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #FAFAFA;
                color: #222222;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .header {
                background-color: #E74C3C;
                color: #FFFFFF;
                padding: 50px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                font-size: 14px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #222222;
            }
            .content p {
                margin-bottom: 15px;
                color: #222222;
            }
            .button {
                display: inline-block;
                background-color: #0073E6;
                color: #FFFFFF;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 25px 0;
                transition: opacity 0.2s ease;
            }
            .button:hover {
                opacity: 0.9;
            }
            .warning {
                background-color: #FADBD8;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #E74C3C;
            }
            .warning p {
                margin: 10px 0;
            }
            .warning strong {
                color: #E74C3C;
            }
            .footer {
                text-align: center;
                color: #717171;
                font-size: 12px;
                padding: 30px;
                border-top: 1px solid #EEEEEE;
            }
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
                
                <center>
                    <a href="${resetLink}" class="button">Reset Password</a>
                </center>
                
                <div class="warning">
                    <p><strong>⚠️ Important Security Notice:</strong></p>
                    <p>This link is valid for 24 hours only. If you did not request a password reset, please ignore this email.</p>
                    <p style="margin-top: 10px;"><strong>Never share this link with anyone.</strong></p>
                </div>
                
                <p>Password resets are processed immediately and securely.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Security issues? Contact security@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Welcome Host Email
   * Color: Info Blue (#0073E6)
   */
  hostWelcome: (hostName) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #FAFAFA;
                color: #222222;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .header {
                background-color: #0073E6;
                color: #FFFFFF;
                padding: 50px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                font-size: 14px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #222222;
            }
            .content p {
                margin-bottom: 15px;
                color: #222222;
            }
            .feature {
                background-color: #E6F0FF;
                padding: 15px;
                margin: 12px 0;
                border-radius: 6px;
                border-left: 4px solid #0073E6;
            }
            .feature strong {
                color: #0073E6;
                display: block;
                margin-bottom: 5px;
            }
            .button {
                display: inline-block;
                background-color: #0073E6;
                color: #FFFFFF;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 25px 0;
                transition: opacity 0.2s ease;
            }
            .button:hover {
                opacity: 0.9;
            }
            .footer {
                text-align: center;
                color: #717171;
                font-size: 12px;
                padding: 30px;
                border-top: 1px solid #EEEEEE;
            }
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
                
                <p><strong>Get Started in 4 Steps:</strong></p>
                
                <div class="feature">
                    <strong>1. Create Your Listing</strong>
                    Add hostel details, photos, amenities, and house rules
                </div>
                
                <div class="feature">
                    <strong>2. Set Your Rates</strong>
                    Manage pricing and availability calendar
                </div>
                
                <div class="feature">
                    <strong>3. Receive Bookings</strong>
                    Accept reservations and manage guest requests
                </div>
                
                <div class="feature">
                    <strong>4. Build Your Reputation</strong>
                    Earn reviews and grow your hostel business
                </div>
                
                <center>
                    <a href="${process.env.FRONTEND_URL}/host/dashboard" class="button">Go to Host Dashboard</a>
                </center>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Host support: hosts@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Payment Confirmation Email
   * Color: Success Teal (#00A699)
   */
  paymentConfirmation: (userName, bookingId, hostelName, amount, transactionId) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #FAFAFA;
                color: #222222;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .header {
                background-color: #00A699;
                color: #FFFFFF;
                padding: 50px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                font-size: 14px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #222222;
            }
            .content p {
                margin-bottom: 15px;
                color: #222222;
            }
            .details {
                background-color: #F9F9F9;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #EEEEEE;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: 600;
                color: #222222;
            }
            .value {
                color: #717171;
            }
            .amount {
                color: #00A699;
                font-weight: 600;
                font-size: 16px;
            }
            .content ul {
                margin: 15px 0 15px 20px;
            }
            .content li {
                margin-bottom: 8px;
                color: #222222;
            }
            .note {
                color: #717171;
                font-size: 12px;
                margin-top: 20px;
                font-style: italic;
            }
            .footer {
                text-align: center;
                color: #717171;
                font-size: 12px;
                padding: 30px;
                border-top: 1px solid #EEEEEE;
            }
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
                        <span class="value">${bookingId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Hostel:</span>
                        <span class="value">${hostelName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Amount Paid:</span>
                        <span class="amount">$${amount}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Transaction ID:</span>
                        <span class="value">${transactionId}</span>
                    </div>
                </div>
                
                <p><strong>What's Next?</strong></p>
                <ul>
                    <li>Check-in instructions will arrive soon</li>
                    <li>View booking details in your account</li>
                    <li>Contact the hostel with any questions</li>
                </ul>
                
                <p class="note">This is an automated receipt. Please keep it for your records.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Help? Contact support@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,

  /**
   * Refund Email
   * Color: Info Blue (#0073E6)
   */
  refundEmail: (userName, bookingId, hostelName, refundAmount, reason) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #FAFAFA;
                color: #222222;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .header {
                background-color: #0073E6;
                color: #FFFFFF;
                padding: 50px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                font-size: 14px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #222222;
            }
            .content p {
                margin-bottom: 15px;
                color: #222222;
            }
            .details {
                background-color: #F9F9F9;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #EEEEEE;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: 600;
                color: #222222;
            }
            .value {
                color: #717171;
            }
            .amount {
                color: #0073E6;
                font-weight: 600;
                font-size: 16px;
            }
            .content ul {
                margin: 15px 0 15px 20px;
            }
            .content li {
                margin-bottom: 8px;
                color: #222222;
            }
            .note {
                color: #717171;
                font-size: 12px;
                margin-top: 20px;
                font-style: italic;
            }
            .footer {
                text-align: center;
                color: #717171;
                font-size: 12px;
                padding: 30px;
                border-top: 1px solid #EEEEEE;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💳 Refund Processed</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>Your refund has been successfully processed.</p>
                
                <div class="details">
                    <div class="detail-row">
                        <span class="label">Booking ID:</span>
                        <span class="value">${bookingId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Hostel:</span>
                        <span class="value">${hostelName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Refund Amount:</span>
                        <span class="amount">$${refundAmount}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Reason:</span>
                        <span class="value">${reason}</span>
                    </div>
                </div>
                
                <p><strong>Refund Timeline:</strong></p>
                <ul>
                    <li>Refund initiated immediately</li>
                    <li>May take 5-10 business days to appear in your account</li>
                    <li>Check your bank or PayPal account</li>
                </ul>
                
                <p>We understand travel plans change. If you have feedback about your experience, we'd love to hear from you!</p>
                
                <p class="note">Transaction reference has been saved to your account.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 RoomLink. All rights reserved.</p>
                <p>Questions? Contact support@roomlink.com</p>
            </div>
        </div>
    </body>
    </html>
  `,
};

module.exports = templates;

