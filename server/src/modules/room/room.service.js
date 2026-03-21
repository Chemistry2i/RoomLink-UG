const Room = require("./room.model");
const Booking = require("../booking/booking.model");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");

/**
 * Room Service
 * Business logic for room availability, booking conflicts, and pricing
 */

/**
 * Check if rooms are available for given dates
 */
const checkRoomAvailability = async (roomId, checkInDate, checkOutDate) => {
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new ApiError(404, "Room not found");
    }

    // Check for overlapping bookings
    const conflictingBookings = await Booking.find({
      room: roomId,
      status: { $in: ["confirmed", "checked-in"] },
      $or: [
        {
          checkInDate: { $lt: checkOutDate },
          checkOutDate: { $gt: checkInDate },
        },
      ],
    });

    const isAvailable = conflictingBookings.length === 0;
    const occupiedBeds = conflictingBookings.reduce((sum, booking) => {
      return sum + (booking.guestCount || 1);
    }, 0);

    return {
      isAvailable,
      occupiedBeds,
      availableBeds: room.capacity - occupiedBeds,
      pricePerNight: room.pricePerNight,
    };
  } catch (error) {
    logger.error(`Error checking room availability: ${error.message}`);
    throw error;
  }
};

/**
 * Calculate room price with discounts
 */
const calculateRoomPrice = async (roomId, checkInDate, checkOutDate) => {
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new ApiError(404, "Room not found");
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    let basePrice = room.pricePerNight * nights;
    let discount = 0;
    let appliedDiscount = "none";

    // Apply discounts based on stay length
    if (nights >= 30) {
      discount = (basePrice * room.monthlyDiscount) / 100;
      appliedDiscount = "monthly";
    } else if (nights >= 7) {
      discount = (basePrice * room.weeklyDiscount) / 100;
      appliedDiscount = "weekly";
    }

    const totalPrice = basePrice - discount;

    return {
      pricePerNight: room.pricePerNight,
      nights,
      basePrice,
      discount,
      discountType: appliedDiscount,
      totalPrice,
      discountPercentage:
        appliedDiscount === "monthly"
          ? room.monthlyDiscount
          : appliedDiscount === "weekly"
          ? room.weeklyDiscount
          : 0,
    };
  } catch (error) {
    logger.error(`Error calculating room price: ${error.message}`);
    throw error;
  }
};

/**
 * Get available rooms in hostel
 */
const getAvailableRooms = async (hostelId, checkInDate, checkOutDate) => {
  try {
    // Get all active rooms in hostel
    const rooms = await Room.find({
      hostel: hostelId,
      isActive: true,
    });

    const availableRoomsData = [];

    for (const room of rooms) {
      const availability = await checkRoomAvailability(
        room._id,
        checkInDate,
        checkOutDate
      );

      if (availability.isAvailable && availability.availableBeds > 0) {
        const pricing = await calculateRoomPrice(room._id, checkInDate, checkOutDate);
        availableRoomsData.push({
          ...room.toObject(),
          pricing,
          availability,
        });
      }
    }

    return availableRoomsData;
  } catch (error) {
    logger.error(`Error fetching available rooms: ${error.message}`);
    throw error;
  }
};

/**
 * Update room availability count
 */
const updateRoomAvailability = async (roomId, increment = true) => {
  try {
    const operation = increment ? 1 : -1;

    const room = await Room.findByIdAndUpdate(
      roomId,
      { $inc: { availableRooms: operation } },
      { new: true }
    );

    if (!room) {
      throw new ApiError(404, "Room not found");
    }

    logger.info(`Room availability updated: ${roomId}, increment: ${increment}`);
    return room;
  } catch (error) {
    logger.error(`Error updating room availability: ${error.message}`);
    throw error;
  }
};

/**
 * Get room occupancy rate
 */
const getRoomOccupancyRate = async (roomId, startDate, endDate) => {
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new ApiError(404, "Room not found");
    }

    const bookings = await Booking.find({
      room: roomId,
      status: { $in: ["confirmed", "checked-in", "checked-out"] },
      checkInDate: { $gte: startDate },
      checkOutDate: { $lte: endDate },
    });

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const totalDays = Math.ceil(
      (endDateObj - startDateObj) / (1000 * 60 * 60 * 24)
    );
    const totalCapacityDays = totalDays * room.capacity;

    let occupiedBedsCount = 0;
    bookings.forEach((booking) => {
      const nights = Math.ceil(
        (new Date(booking.checkOutDate) - new Date(booking.checkInDate)) /
          (1000 * 60 * 60 * 24)
      );
      occupiedBedsCount += nights * (booking.guestCount || 1);
    });

    const occupancyRate = (occupiedBedsCount / totalCapacityDays) * 100;

    return {
      occupancyRate: Math.round(occupancyRate),
      occupiedBedsCount,
      totalCapacityDays,
      bookingCount: bookings.length,
    };
  } catch (error) {
    logger.error(`Error calculating occupancy rate: ${error.message}`);
    throw error;
  }
};

/**
 * Get rooms with low availability
 */
const getLowAvailabilityRooms = async (hostelId, threshold = 2) => {
  try {
    const rooms = await Room.find({
      hostel: hostelId,
      availableRooms: { $lte: threshold },
      isActive: true,
    });

    return rooms;
  } catch (error) {
    logger.error(`Error fetching low availability rooms: ${error.message}`);
    throw error;
  }
};

/**
 * Get room booking history
 */
const getRoomBookingHistory = async (roomId, limit = 10) => {
  try {
    const bookings = await Booking.find({ room: roomId })
      .populate("guest", "name email phone")
      .sort({ checkInDate: -1 })
      .limit(limit);

    return bookings;
  } catch (error) {
    logger.error(`Error fetching room booking history: ${error.message}`);
    throw error;
  }
};

/**
 * Get room revenue (for host)
 */
const getRoomRevenue = async (roomId, startDate, endDate) => {
  try {
    const bookings = await Booking.find({
      room: roomId,
      status: { $in: ["confirmed", "checked-out", "cancelled"] },
      checkInDate: { $gte: startDate },
      checkOutDate: { $lte: endDate },
    });

    let totalRevenue = 0;
    let completedBookings = 0;

    bookings.forEach((booking) => {
      if (booking.status !== "cancelled") {
        totalRevenue += booking.totalPrice || 0;
        completedBookings++;
      }
    });

    return {
      totalRevenue,
      completedBookings,
      averageRevenuePerBooking: completedBookings > 0 ? totalRevenue / completedBookings : 0,
    };
  } catch (error) {
    logger.error(`Error calculating room revenue: ${error.message}`);
    throw error;
  }
};

module.exports = {
  checkRoomAvailability,
  calculateRoomPrice,
  getAvailableRooms,
  updateRoomAvailability,
  getRoomOccupancyRate,
  getLowAvailabilityRooms,
  getRoomBookingHistory,
  getRoomRevenue,
};
