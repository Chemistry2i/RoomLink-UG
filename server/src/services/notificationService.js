const emailService = require("./emailService");
const Booking = require("../modules/booking/booking.model");
const User = require("../modules/user/user.model");
const Hostel = require("../modules/hostel/hostel.model");
const Room = require("../modules/room/room.model");
const logger = require("../config/logger");

/**
 * Notification Service - Handles all email triggers
 * Integrates with Brevo email service and booking events
 */

/**
 * Send booking confirmation email
 * Triggered when booking is created and payment is confirmed
 */
const sendBookingConfirmation = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("user", "email name phone")
      .populate("hostel", "name address contactEmail")
      .populate("room", "roomNumber roomType capacity");

    if (!booking || !booking.user || !booking.user.email) {
      logger.warn(`Cannot send booking confirmation: booking ${bookingId} missing user/email`);
      return false;
    }

    const checkInDate = new Date(booking.checkInDate).toLocaleDateString("en-UG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString("en-UG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const nights = Math.ceil(
      (new Date(booking.checkOutDate) - new Date(booking.checkInDate)) /
        (1000 * 60 * 60 * 24)
    );

    const emailData = {
      to: booking.user.email,
      templateKey: "BOOKING_CONFIRMATION",
      variables: {
        guestName: booking.user.name,
        bookingReference: booking.bookingReference,
        hostelName: booking.hostel.name,
        roomType: booking.room.roomType,
        roomNumber: booking.room.roomNumber,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        numberOfNights: nights,
        numberOfGuests: booking.numberOfGuests,
        totalPrice: `UGX ${booking.pricing.totalPrice.toLocaleString()}`,
        pricePerNight: `UGX ${booking.pricing.pricePerNight.toLocaleString()}`,
        hostelAddress: `${booking.hostel.address.street}, ${booking.hostel.address.city}`,
        hostelPhone: booking.hostel.contactEmail,
        guestPhone: booking.guestDetails.phone,
        bookingPortalLink: `${process.env.FRONTEND_URL}/bookings/${booking._id}`,
        hostelCheckInTime: booking.hostel.checkInTime || "14:00",
        hostelCheckOutTime: booking.hostel.checkOutTime || "11:00",
      },
    };

    await emailService.sendEmail(emailData);
    logger.info(`Booking confirmation sent to ${booking.user.email} for booking ${booking.bookingReference}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send booking confirmation for ${bookingId}:`, error.message);
    return false;
  }
};

/**
 * Send booking cancellation email
 * Triggered when guest cancels their booking
 */
const sendBookingCancellation = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("user", "email name")
      .populate("hostel", "name address");

    if (!booking || !booking.user || !booking.user.email) {
      logger.warn(`Cannot send cancellation email: booking ${bookingId} missing user/email`);
      return false;
    }

    const refundAmount = booking.cancellation?.refundPercentage
      ? (booking.pricing.totalPrice * booking.cancellation.refundPercentage) / 100
      : 0;

    const emailData = {
      to: booking.user.email,
      templateKey: "BOOKING_CANCELLED",
      variables: {
        guestName: booking.user.name,
        bookingReference: booking.bookingReference,
        hostelName: booking.hostel.name,
        cancellationDate: new Date().toLocaleDateString("en-UG"),
        cancellationReason: booking.cancellation?.cancelReason || "User requested",
        refundAmount: `UGX ${refundAmount.toLocaleString()}`,
        refundPercentage: booking.cancellation?.refundPercentage || 0,
        estimatedRefundDate: "3-5 business days",
        supportEmail: process.env.SUPPORT_EMAIL || "support@roomlink.ug",
      },
    };

    await emailService.sendEmail(emailData);
    logger.info(`Cancellation email sent to ${booking.user.email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send cancellation email for ${bookingId}:`, error.message);
    return false;
  }
};

/**
 * Send check-in reminder email
 * Triggered 24 hours before check-in
 */
const sendCheckInReminder = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("user", "email name")
      .populate("hostel", "name address contactEmail contactPhone checkInTime")
      .populate("room", "roomNumber roomType");

    if (!booking || !booking.user || !booking.user.email) {
      logger.warn(`Cannot send check-in reminder: booking ${bookingId} missing user/email`);
      return false;
    }

    const checkInDate = new Date(booking.checkInDate).toLocaleDateString("en-UG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailData = {
      to: booking.user.email,
      templateKey: "CHECKIN_REMINDER",
      variables: {
        guestName: booking.user.name,
        bookingReference: booking.bookingReference,
        hostelName: booking.hostel.name,
        checkInDate: checkInDate,
        checkInTime: booking.hostel.checkInTime || "14:00",
        hostelAddress: `${booking.hostel.address.street}, ${booking.hostel.address.city}`,
        hostelPhone: booking.hostel.contactPhone,
        hostelEmail: booking.hostel.contactEmail,
        roomNumber: booking.room.roomNumber,
        roomType: booking.room.roomType,
        guestPhone: booking.guestDetails.phone,
        directionsLink: `https://maps.google.com/?q=${encodeURIComponent(
          `${booking.hostel.address.street}, ${booking.hostel.address.city}`
        )}`,
        specialRequests: booking.specialRequests || "None",
      },
    };

    await emailService.sendEmail(emailData);
    logger.info(`Check-in reminder sent to ${booking.user.email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send check-in reminder for ${bookingId}:`, error.message);
    return false;
  }
};

/**
 * Send check-out reminder email
 * Triggered on check-out day (morning)
 */
const sendCheckOutReminder = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("user", "email name")
      .populate("hostel", "name checkOutTime contactPhone")
      .populate("room", "roomNumber");

    if (!booking || !booking.user || !booking.user.email) {
      logger.warn(`Cannot send check-out reminder: booking ${bookingId} missing user/email`);
      return false;
    }

    const emailData = {
      to: booking.user.email,
      templateKey: "CHECKOUT_REMINDER",
      variables: {
        guestName: booking.user.name,
        bookingReference: booking.bookingReference,
        hostelName: booking.hostel.name,
        checkOutTime: booking.hostel.checkOutTime || "11:00",
        roomNumber: booking.room.roomNumber,
        hostelPhone: booking.hostel.contactPhone,
        checkOutInstructions: "Please return all room keys and check for personal items",
        lateCheckoutFee: "UGX 50,000 per hour (subject to availability)",
      },
    };

    await emailService.sendEmail(emailData);
    logger.info(`Check-out reminder sent to ${booking.user.email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send check-out reminder for ${bookingId}:`, error.message);
    return false;
  }
};

/**
 * Send review invitation email
 * Triggered after guest checks out
 */
const sendReviewInvitation = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("user", "email name")
      .populate("hostel", "name address")
      .populate("room", "roomType");

    if (!booking || !booking.user || !booking.user.email) {
      logger.warn(`Cannot send review invitation: booking ${bookingId} missing user/email`);
      return false;
    }

    const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString("en-UG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailData = {
      to: booking.user.email,
      templateKey: "REVIEW_INVITATION",
      variables: {
        guestName: booking.user.name,
        bookingReference: booking.bookingReference,
        hostelName: booking.hostel.name,
        roomType: booking.room.roomType,
        checkOutDate: checkOutDate,
        stayDuration: Math.ceil(
          (new Date(booking.checkOutDate) - new Date(booking.checkInDate)) /
            (1000 * 60 * 60 * 24)
        ),
        reviewLink: `${process.env.FRONTEND_URL}/bookings/${booking._id}/review`,
        hostelImageUrl: "https://via.placeholder.com/400x300?text=Hostel", // Will be replaced with actual hostel image
      },
    };

    await emailService.sendEmail(emailData);
    logger.info(`Review invitation sent to ${booking.user.email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send review invitation for ${bookingId}:`, error.message);
    return false;
  }
};

/**
 * Send payment confirmation email
 * Triggered when M-Pesa payment is confirmed
 */
const sendPaymentConfirmation = async (bookingId, transactionId, amount) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("user", "email name")
      .populate("hostel", "name");

    if (!booking || !booking.user || !booking.user.email) {
      logger.warn(`Cannot send payment confirmation: booking ${bookingId} missing user/email`);
      return false;
    }

    const emailData = {
      to: booking.user.email,
      templateKey: "PAYMENT_CONFIRMATION",
      variables: {
        guestName: booking.user.name,
        bookingReference: booking.bookingReference,
        hostelName: booking.hostel.name,
        transactionId: transactionId,
        amount: `UGX ${amount.toLocaleString()}`,
        paymentDate: new Date().toLocaleDateString("en-UG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        paymentMethod: "M-Pesa",
        receiptNumber: transactionId,
      },
    };

    await emailService.sendEmail(emailData);
    logger.info(`Payment confirmation sent to ${booking.user.email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send payment confirmation for ${bookingId}:`, error.message);
    return false;
  }
};

/**
 * Send hostel notification - New booking alert
 * Triggered when new booking is created (alert the hostel owner/staff)
 */
const sendHostelNewBookingAlert = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("user", "email name phone")
      .populate("hostel", "name owner contactEmail")
      .populate("room", "roomNumber roomType");

    const hostel = await Hostel.findById(booking.hostel._id).populate("owner", "email name");

    if (!hostel || !hostel.owner || !hostel.owner.email) {
      logger.warn(`Cannot send hostel alert: hostel ${booking.hostel._id} missing owner/email`);
      return false;
    }

    const checkInDate = new Date(booking.checkInDate).toLocaleDateString("en-UG");
    const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString("en-UG");

    const emailData = {
      to: hostel.owner.email,
      templateKey: "HOSTEL_NEW_BOOKING",
      variables: {
        hostelOwnerName: hostel.owner.name,
        hostelName: hostel.name,
        bookingReference: booking.bookingReference,
        guestName: booking.user.name,
        guestEmail: booking.user.email,
        guestPhone: booking.guestDetails.phone,
        roomNumber: booking.room.roomNumber,
        roomType: booking.room.roomType,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        numberOfGuests: booking.numberOfGuests,
        totalPrice: `UGX ${booking.pricing.totalPrice.toLocaleString()}`,
        specialRequests: booking.specialRequests || "None",
        managementLink: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking._id}`,
      },
    };

    await emailService.sendEmail(emailData);
    logger.info(`New booking alert sent to ${hostel.owner.email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send hostel new booking alert for ${bookingId}:`, error.message);
    return false;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendBookingCancellation,
  sendCheckInReminder,
  sendCheckOutReminder,
  sendReviewInvitation,
  sendPaymentConfirmation,
  sendHostelNewBookingAlert,
};
