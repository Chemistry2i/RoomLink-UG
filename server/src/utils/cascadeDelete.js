const logger = require("../config/logger");

/**
 * Cascading Delete Utilities
 * Handles related record cleanup when deleting main entities
 */

/**
 * Delete all records related to a user
 */
const deleteUserCascade = async (userId) => {
  try {
    const User = require("../modules/user/user.model");
    const Booking = require("../modules/booking/booking.model");
    const Review = require("../modules/review/review.model");
    const Complaint = require("../modules/complaint/complaint.model");
    const AuditLog = require("../modules/audit/audit.model");

    // Start transaction would be ideal here in production
    logger.info(`Starting cascade delete for user: ${userId}`);

    // Delete user's bookings
    const bookingDeleteResult = await Booking.deleteMany({ user: userId });
    logger.info(`Deleted ${bookingDeleteResult.deletedCount} bookings for user ${userId}`);

    // Delete user's reviews
    const reviewDeleteResult = await Review.deleteMany({ user: userId });
    logger.info(`Deleted ${reviewDeleteResult.deletedCount} reviews for user ${userId}`);

    // Delete user's complaints
    const complaintDeleteResult = await Complaint.deleteMany({ user: userId });
    logger.info(`Deleted ${complaintDeleteResult.deletedCount} complaints for user ${userId}`);

    // Keep audit logs for compliance (don't delete)
    // Just update them to mark user as deleted
    await AuditLog.updateMany(
      { userId },
      { $set: { userId: "DELETED_USER" } }
    );

    // Delete the user
    const userDeleteResult = await User.findByIdAndDelete(userId);
    logger.info(`User deleted: ${userId}`);

    return {
      success: true,
      deletedRecords: {
        bookings: bookingDeleteResult.deletedCount,
        reviews: reviewDeleteResult.deletedCount,
        complaints: complaintDeleteResult.deletedCount,
      },
    };
  } catch (error) {
    logger.error(`Cascade delete failed for user ${userId}: ${error.message}`);
    throw error;
  }
};

/**
 * Delete all records related to a hostel
 */
const deleteHostelCascade = async (hostelId) => {
  try {
    const Hostel = require("../modules/hostel/hostel.model");
    const Room = require("../modules/room/room.model");
    const Booking = require("../modules/booking/booking.model");
    const Review = require("../modules/review/review.model");
    const Complaint = require("../modules/complaint/complaint.model");

    logger.info(`Starting cascade delete for hostel: ${hostelId}`);

    // Get all booking IDs for this hostel to cascade delete
    const bookings = await Booking.find({ hostel: hostelId }).select("_id");
    const bookingIds = bookings.map((b) => b._id);

    // Delete reviews for this hostel
    const reviewDeleteResult = await Review.deleteMany({ hostel: hostelId });
    logger.info(`Deleted ${reviewDeleteResult.deletedCount} reviews for hostel ${hostelId}`);

    // Delete complaints for this hostel
    const complaintDeleteResult = await Complaint.deleteMany({
      hostel: hostelId,
    });
    logger.info(
      `Deleted ${complaintDeleteResult.deletedCount} complaints for hostel ${hostelId}`
    );

    // Delete bookings for this hostel
    const bookingDeleteResult = await Booking.deleteMany({ hostel: hostelId });
    logger.info(`Deleted ${bookingDeleteResult.deletedCount} bookings for hostel ${hostelId}`);

    // Delete rooms for this hostel
    const roomDeleteResult = await Room.deleteMany({ hostel: hostelId });
    logger.info(`Deleted ${roomDeleteResult.deletedCount} rooms for hostel ${hostelId}`);

    // Delete the hostel
    const hostelDeleteResult = await Hostel.findByIdAndDelete(hostelId);
    logger.info(`Hostel deleted: ${hostelId}`);

    return {
      success: true,
      deletedRecords: {
        reviews: reviewDeleteResult.deletedCount,
        complaints: complaintDeleteResult.deletedCount,
        bookings: bookingDeleteResult.deletedCount,
        rooms: roomDeleteResult.deletedCount,
      },
    };
  } catch (error) {
    logger.error(`Cascade delete failed for hostel ${hostelId}: ${error.message}`);
    throw error;
  }
};

/**
 * Soft delete user (mark as deleted instead of hard delete)
 */
const softDeleteUser = async (userId) => {
  try {
    const User = require("../modules/user/user.model");

    logger.info(`Soft deleting user: ${userId}`);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        accountStatus: "deleted",
        isEmailVerified: false,
        deletedAt: new Date(),
      },
      { new: true }
    );

    logger.info(`User soft deleted: ${userId}`);
    return user;
  } catch (error) {
    logger.error(`Soft delete failed for user ${userId}: ${error.message}`);
    throw error;
  }
};

/**
 * Soft delete hostel (mark as inactive instead of hard delete)
 */
const softDeleteHostel = async (hostelId) => {
  try {
    const Hostel = require("../modules/hostel/hostel.model");

    logger.info(`Soft deleting hostel: ${hostelId}`);

    // Mark all rooms as unavailable
    const Room = require("../modules/room/room.model");
    await Room.updateMany(
      { hostel: hostelId },
      { availableRooms: 0, isActive: false }
    );

    const hostel = await Hostel.findByIdAndUpdate(
      hostelId,
      {
        accountStatus: "Deactivated",
        deactivatedAt: new Date(),
      },
      { new: true }
    );

    logger.info(`Hostel soft deleted: ${hostelId}`);
    return hostel;
  } catch (error) {
    logger.error(`Soft delete failed for hostel ${hostelId}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  deleteUserCascade,
  deleteHostelCascade,
  softDeleteUser,
  softDeleteHostel,
};
