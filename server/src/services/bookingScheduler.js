const Booking = require("../modules/booking/booking.model");
const notificationService = require("./notificationService");
const logger = require("../config/logger");

/**
 * Booking Scheduler Service
 * Handles scheduled email notifications using node-cron or setTimeout
 * Can be run as a separate worker process or integrated into main app
 */

/**
 * Send check-in reminders 24 hours before check-in
 * Run this every hour to find bookings with check-in tomorrow
 */
const sendCheckInReminders = async () => {
  try {
    // Find bookings checking in 24 hours from now (with 1 hour window)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowPlusHour = new Date(tomorrow.getTime() + 60 * 60 * 1000);

    const bookings = await Booking.find({
      checkInDate: {
        $gte: tomorrow,
        $lt: tomorrowPlusHour,
      },
      bookingStatus: "Confirmed",
    });

    logger.info(`Found ${bookings.length} bookings for check-in reminders`);

    for (const booking of bookings) {
      // Send check-in reminder
      await notificationService.sendCheckInReminder(booking._id).catch((err) => {
        logger.error(`Failed to send check-in reminder for booking ${booking._id}:`, err.message);
      });
    }

    return { count: bookings.length, type: "CHECK_IN_REMINDERS" };
  } catch (error) {
    logger.error("Error in sendCheckInReminders:", error.message);
    throw error;
  }
};

/**
 * Send check-out reminders on the day of check-out
 * Run this once per day (morning)
 */
const sendCheckOutReminders = async () => {
  try {
    // Find bookings checking out today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await Booking.find({
      checkOutDate: {
        $gte: today,
        $lt: tomorrow,
      },
      bookingStatus: "CheckedIn",
    });

    logger.info(`Found ${bookings.length} bookings for check-out reminders`);

    for (const booking of bookings) {
      // Send check-out reminder
      await notificationService.sendCheckOutReminder(booking._id).catch((err) => {
        logger.error(`Failed to send check-out reminder for booking ${booking._id}:`, err.message);
      });
    }

    return { count: bookings.length, type: "CHECKOUT_REMINDERS" };
  } catch (error) {
    logger.error("Error in sendCheckOutReminders:", error.message);
    throw error;
  }
};

/**
 * Send payment confirmation reminders
 * For unpaid confirmed bookings that should be paid within 24 hours
 */
const sendPaymentReminders = async () => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const bookings = await Booking.find({
      bookingStatus: "Confirmed",
      "payment.status": "Pending",
      createdAt: { $lt: oneDayAgo },
      $expr: { $lt: ["$checkInDate", "$checkInDate"] }, // Check-in is coming up
    });

    logger.info(`Found ${bookings.length} bookings for payment reminders`);

    for (const booking of bookings) {
      // Send payment reminder email
      await notificationService.sendPaymentConfirmation(
        booking._id,
        "PENDING",
        booking.pricing.totalPrice
      ).catch((err) => {
        logger.error(`Failed to send payment reminder for booking ${booking._id}:`, err.message);
      });
    }

    return { count: bookings.length, type: "PAYMENT_REMINDERS" };
  } catch (error) {
    logger.error("Error in sendPaymentReminders:", error.message);
    throw error;
  }
};

/**
 * Auto-cancel NO-SHOW bookings
 * Mark bookings as NO-SHOW if guest hasn't checked in by 2 PM on check-in day
 */
const markNoShowBookings = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInDeadline = new Date();
    checkInDeadline.setHours(14, 0, 0, 0); // 2 PM check-in deadline

    const bookings = await Booking.find({
      checkInDate: {
        $gte: today,
        $lt: checkInDeadline,
      },
      bookingStatus: "Confirmed",
    });

    logger.info(`Checking ${bookings.length} bookings for no-show`);

    let noShowCount = 0;
    for (const booking of bookings) {
      if (!booking.checkInDetails || !booking.checkInDetails.checkedInAt) {
        // Guest hasn't checked in by deadline
        booking.bookingStatus = "NoShow";
        booking.noShowReason = "Guest did not check in by 2 PM";
        await booking.save();
        noShowCount++;

        logger.info(`Marked booking ${booking.bookingReference} as NO-SHOW`);
      }
    }

    return { count: noShowCount, type: "NO_SHOW_MARKINGS" };
  } catch (error) {
    logger.error("Error in markNoShowBookings:", error.message);
    throw error;
  }
};

/**
 * Initialize scheduler (run this in app.js)
 * Example: 
 * - Check-in reminders: every hour
 * - Check-out reminders: once daily at 6 AM
 * - Payment reminders: every 6 hours
 * - No-show marking: once daily at 2:15 PM
 */
const initializeScheduler = (cron) => {
  if (!cron) {
    logger.warn("node-cron not installed. Scheduler not initialized. Install with: npm install node-cron");
    return;
  }

  try {
    // Send check-in reminders every hour
    cron.schedule("0 * * * *", async () => {
      logger.info("Running scheduled check-in reminder task...");
      await sendCheckInReminders();
    });

    // Send check-out reminders daily at 6 AM
    cron.schedule("0 6 * * *", async () => {
      logger.info("Running scheduled check-out reminder task...");
      await sendCheckOutReminders();
    });

    // Send payment reminders every 6 hours
    cron.schedule("0 */6 * * *", async () => {
      logger.info("Running scheduled payment reminder task...");
      await sendPaymentReminders();
    });

    // Mark no-show bookings daily at 2:15 PM
    cron.schedule("15 14 * * *", async () => {
      logger.info("Running scheduled no-show marking task...");
      await markNoShowBookings();
    });

    logger.info("Booking scheduler initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize scheduler:", error.message);
  }
};

module.exports = {
  sendCheckInReminders,
  sendCheckOutReminders,
  sendPaymentReminders,
  markNoShowBookings,
  initializeScheduler,
};
