const Booking = require("./booking.model");
const Room = require("../room/room.model");
const mongoose = require("mongoose");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");

/**
 * Booking Service
 * Business logic for booking operations with conflict prevention
 */

/**
 * Check if booking dates conflict with existing bookings
 */
const checkBookingConflict = async (roomId, checkInDate, checkOutDate, bookingIdToExclude = null) => {
  try {
    const query = {
      room: roomId,
      status: { $in: ["confirmed", "checked-in"] },
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate },
    };

    if (bookingIdToExclude) {
      query._id = { $ne: bookingIdToExclude };
    }

    const conflictingBookings = await Booking.find(query);
    return conflictingBookings.length > 0;
  } catch (error) {
    logger.error(`Error checking booking conflict: ${error.message}`);
    throw error;
  }
};

/**
 * Create booking with transaction
 */
const createBooking = async (bookingData, session = null) => {
  const sessionActive = session || (await mongoose.startSession());
  try {
    // Begin transaction
    if (!session) sessionActive.startTransaction();

    // Check for booking conflicts
    const hasConflict = await checkBookingConflict(
      bookingData.room,
      bookingData.checkInDate,
      bookingData.checkOutDate
    );

    if (hasConflict) {
      throw new ApiError(
        400,
        "Room is not available for the selected dates"
      );
    }

    // Get room details
    const room = await Room.findById(bookingData.room);
    if (!room) {
      throw new ApiError(404, "Room not found");
    }

    // Create booking
    const booking = await Booking.create([bookingData], { session: sessionActive });

    // Update room availability
    await Room.findByIdAndUpdate(
      bookingData.room,
      { $dec: { availableRooms: 1 } },
      { session: sessionActive }
    );

    // Commit transaction
    if (!session) await sessionActive.commitTransaction();

    logger.info(`Booking created: ${booking[0]._id}`);
    return booking[0];
  } catch (error) {
    // Rollback transaction
    if (!session) {
      await sessionActive.abortTransaction();
    }
    logger.error(`Error creating booking: ${error.message}`);
    throw error;
  } finally {
    if (!session) sessionActive.endSession();
  }
};

/**
 * Get bookings with filters and pagination
 */
const getBookings = async (filters = {}, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.room) query.room = filters.room;
    if (filters.guest) query.guest = filters.guest;
    if (filters.status) query.status = filters.status;
    if (filters.hostel) query.hostel = filters.hostel;

    // Date range filtering
    if (filters.checkInDate || filters.checkOutDate) {
      query.$or = [];
      if (filters.checkInDate) {
        query.$or.push({ checkInDate: { $gte: filters.checkInDate } });
      }
      if (filters.checkOutDate) {
        query.$or.push({ checkOutDate: { $lte: filters.checkOutDate } });
      }
    }

    const bookings = await Booking.find(query)
      .populate("room", "roomNumber roomType pricePerNight")
      .populate("guest", "name email phone")
      .skip(skip)
      .limit(limit)
      .sort({ checkInDate: -1 });

    const total = await Booking.countDocuments(query);

    return {
      bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error fetching bookings: ${error.message}`);
    throw error;
  }
};

/**
 * Get booking by ID
 */
const getBookingById = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("room", "roomNumber roomType pricePerNight amenities")
      .populate("hostel", "name address phone email")
      .populate("guest", "name email phone");

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    return booking;
  } catch (error) {
    logger.error(`Error fetching booking: ${error.message}`);
    throw error;
  }
};

/**
 * Cancel booking
 */
const cancelBooking = async (bookingId, reason = "") => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    if (booking.status === "cancelled") {
      throw new ApiError(400, "Booking is already cancelled");
    }

    // Update booking status
    booking.status = "cancelled";
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    await booking.save({ session });

    // Restore room availability
    await Room.findByIdAndUpdate(
      booking.room,
      { $inc: { availableRooms: 1 } },
      { session }
    );

    await session.commitTransaction();

    logger.info(`Booking cancelled: ${bookingId}`);
    return booking;
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error cancelling booking: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get user bookings
 */
const getUserBookings = async (userId, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ guest: userId })
      .populate("room", "roomNumber roomType pricePerNight")
      .populate("hostel", "name address")
      .skip(skip)
      .limit(limit)
      .sort({ checkInDate: -1 });

    const total = await Booking.countDocuments({ guest: userId });

    return {
      bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error fetching user bookings: ${error.message}`);
    throw error;
  }
};

/**
 * Update booking (extend dates, etc.)
 */
const updateBooking = async (bookingId, updates) => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    // Only allow certain fields to be updated
    const allowedFields = ["checkOutDate", "specialRequests", "notes"];
    const filteredUpdates = {};
    allowedFields.forEach((field) => {
      if (updates[field]) filteredUpdates[field] = updates[field];
    });

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).populate("room", "roomNumber roomType pricePerNight");

    logger.info(`Booking updated: ${bookingId}`);
    return updatedBooking;
  } catch (error) {
    logger.error(`Error updating booking: ${error.message}`);
    throw error;
  }
};

/**
 * Confirm check-in
 */
const confirmCheckIn = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    if (booking.status !== "confirmed") {
      throw new ApiError(400, "Only confirmed bookings can be checked in");
    }

    booking.status = "checked-in";
    booking.checkInTime = new Date();
    await booking.save();

    logger.info(`Guest checked in: ${bookingId}`);
    return booking;
  } catch (error) {
    logger.error(`Error confirming check-in: ${error.message}`);
    throw error;
  }
};

/**
 * Confirm check-out
 */
const confirmCheckOut = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    if (booking.status !== "checked-in") {
      throw new ApiError(400, "Only checked-in guests can be checked out");
    }

    booking.status = "checked-out";
    booking.checkOutTime = new Date();
    await booking.save();

    logger.info(`Guest checked out: ${bookingId}`);
    return booking;
  } catch (error) {
    logger.error(`Error confirming check-out: ${error.message}`);
    throw error;
  }
};

module.exports = {
  checkBookingConflict,
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  getUserBookings,
  updateBooking,
  confirmCheckIn,
  confirmCheckOut,
};
