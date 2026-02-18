const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const Booking = require("./booking.model");
const Room = require("../room/room.model");
const Hostel = require("../hostel/hostel.model");
const User = require("../user/user.model");
const notificationService = require("../../services/notificationService");
const logger = require("../../config/logger");

/**
 * CREATE - Create new booking
 * POST /api/v1/bookings
 * Body: room, checkInDate, checkOutDate, numberOfGuests, guestDetails, payment, specialRequests
 */
const createBooking = asyncHandler(async (req, res) => {
  const {
    hostel,
    room,
    checkInDate,
    checkOutDate,
    numberOfGuests,
    numberOfRooms,
    guestDetails,
    payment,
    specialRequests,
  } = req.body;

  // Validate required fields
  if (!room || !checkInDate || !checkOutDate || !numberOfGuests || !guestDetails) {
    throw new ApiError(400, "Missing required fields");
  }

  // Parse dates
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (checkIn >= checkOut) {
    throw new ApiError(400, "Check-out date must be after check-in date");
  }

  // Get room and hostel details
  const roomData = await Room.findById(room).populate("hostel");
  if (!roomData) {
    throw new ApiError(404, "Room not found");
  }

  const hostelData = roomData.hostel;
  if (!hostelData || hostelData.accountStatus === "Deactivated") {
    throw new ApiError(400, "Hostel is not available");
  }

  // Check room availability
  const existingBookings = await Booking.countDocuments({
    room: room,
    checkInDate: { $lt: checkOut },
    checkOutDate: { $gt: checkIn },
    bookingStatus: { $in: ["Confirmed", "CheckedIn"] },
  });

  if (existingBookings >= roomData.totalRooms) {
    throw new ApiError(400, "Room not available for selected dates");
  }

  // Calculate pricing
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  let discountApplied = 0;

  if (nights >= 30 && roomData.monthlyDiscount > 0) {
    discountApplied = roomData.monthlyDiscount;
  } else if (nights >= 7 && roomData.weeklyDiscount > 0) {
    discountApplied = roomData.weeklyDiscount;
  }

  const subtotal = roomData.pricePerNight * nights * numberOfRooms;
  const discountAmount = (subtotal * discountApplied) / 100;
  const netAmount = subtotal - discountAmount;
  const serviceFee = netAmount * 0.05; // 5% service fee
  const taxAmount = (netAmount + serviceFee) * 0.08; // 8% tax
  const totalPrice = netAmount + serviceFee + taxAmount;

  // Create booking
  const booking = await Booking.create({
    user: req.user._id,
    hostel: hostelData._id,
    room: room,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    numberOfGuests,
    numberOfRooms: numberOfRooms || 1,
    guestDetails,
    pricing: {
      pricePerNight: roomData.pricePerNight,
      numberOfNights: nights,
      subtotal,
      discountApplied,
      discountAmount,
      serviceFee,
      taxAmount,
      totalPrice,
    },
    payment: {
      method: payment.method || "M-Pesa",
      status: "Pending",
      phoneNumber: payment.phoneNumber,
    },
    specialRequests,
    bookingStatus: "Confirmed",
  });

  await booking.populate([
    { path: "user", select: "name email phone" },
    { path: "hostel", select: "name address" },
    { path: "room", select: "roomNumber roomType" },
  ]);

  // Send confirmation email asynchronously (non-blocking)
  notificationService.sendBookingConfirmation(booking._id).catch((err) => {
    logger.error("Failed to send booking confirmation:", err.message);
  });

  // Alert hostel owner
  notificationService.sendHostelNewBookingAlert(booking._id).catch((err) => {
    logger.error("Failed to send hostel booking alert:", err.message);
  });

  return res.status(201).json(
    new ApiResponse(201, booking, "Booking created successfully. Confirmation email sent.")
  );
});

/**
 * READ ALL - Get bookings with filters
 * GET /api/v1/bookings
 * Query: page, limit, status, userId, hostel (admin only)
 */
const getBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, hostel } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};

  if (status) filter.bookingStatus = status;

  // Admins can see all bookings, users only their own
  if (req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN") {
    if (hostel) filter.hostel = hostel;
  } else if (req.user.role === "HOST") {
    // Hosts can see bookings for their hostels
    const hostels = await Hostel.find({ owner: req.user._id }).select("_id");
    filter.hostel = { $in: hostels.map((h) => h._id) };
  } else {
    // Users can only see their own bookings
    filter.user = req.user._id;
  }

  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .populate("user", "name email phone")
    .populate("hostel", "name address")
    .populate("room", "roomNumber roomType")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Bookings retrieved successfully"
    )
  );
});

/**
 * READ ONE - Get single booking by ID
 * GET /api/v1/bookings/:id
 */
const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = await Booking.findById(id).populate([
    { path: "user", select: "name email phone" },
    { path: "hostel", select: "name address contactEmail contactPhone" },
    { path: "room", select: "roomNumber roomType capacity" },
  ]);

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check authorization
  if (
    booking.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "ADMIN" &&
    req.user.role !== "SUPER_ADMIN"
  ) {
    throw new ApiError(403, "Not authorized to view this booking");
  }

  return res.status(200).json(
    new ApiResponse(200, booking, "Booking retrieved successfully")
  );
});

/**
 * UPDATE - Update booking details (before check-in only)
 * PUT /api/v1/bookings/:id
 * Body: checkInDate, checkOutDate, numberOfGuests, specialRequests
 */
const updateBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { checkInDate, checkOutDate, numberOfGuests, specialRequests } = req.body;

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check authorization and booking status
  if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Not authorized to update this booking");
  }

  if (booking.bookingStatus === "CheckedIn" || booking.bookingStatus === "CheckedOut") {
    throw new ApiError(400, "Cannot modify booking after check-in");
  }

  // Update allowed fields
  if (checkInDate || checkOutDate) {
    const newCheckIn = new Date(checkInDate || booking.checkInDate);
    const newCheckOut = new Date(checkOutDate || booking.checkOutDate);

    if (newCheckIn >= newCheckOut) {
      throw new ApiError(400, "Check-out date must be after check-in date");
    }

    // Check availability for new dates
    const conflicts = await Booking.countDocuments({
      room: booking.room,
      _id: { $ne: id },
      checkInDate: { $lt: newCheckOut },
      checkOutDate: { $gt: newCheckIn },
      bookingStatus: { $in: ["Confirmed", "CheckedIn"] },
    });

    if (conflicts > 0) {
      throw new ApiError(400, "Room not available for the new dates");
    }

    booking.checkInDate = newCheckIn;
    booking.checkOutDate = newCheckOut;
  }

  if (numberOfGuests) booking.numberOfGuests = numberOfGuests;
  if (specialRequests) booking.specialRequests = specialRequests;

  await booking.save();
  await booking.populate([
    { path: "user", select: "name email" },
    { path: "hostel", select: "name" },
    { path: "room", select: "roomNumber" },
  ]);

  return res.status(200).json(
    new ApiResponse(200, booking, "Booking updated successfully")
  );
});

/**
 * DELETE/CANCEL - Cancel booking
 * DELETE /api/v1/bookings/:id
 * Body: cancelReason
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancelReason } = req.body;

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check authorization
  if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Not authorized to cancel this booking");
  }

  if (!booking.canBeCancelled()) {
    throw new ApiError(400, "Booking cannot be cancelled at this time");
  }

  // Calculate refund
  const hostel = await Hostel.findById(booking.hostel);
  const refundAmount = booking.calculateRefund(hostel.policies.cancellationDays);

  // Update booking
  booking.bookingStatus = "Cancelled";
  booking.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: req.user.role === "ADMIN" ? "Admin" : "User",
    cancelReason: cancelReason || "No reason provided",
    refundEligible: refundAmount > 0,
    refundPercentage: (refundAmount / booking.pricing.totalPrice) * 100,
  };

  // Update payment
  booking.payment.status = "Refunded";
  booking.payment.refundedAt = new Date();
  booking.payment.refundAmount = refundAmount;

  await booking.save();

  // Send cancellation email asynchronously
  notificationService.sendBookingCancellation(booking._id).catch((err) => {
    logger.error("Failed to send cancellation email:", err.message);
  });

  return res.status(200).json(
    new ApiResponse(200, booking, "Booking cancelled successfully. Cancellation email sent.")
  );
});

/**
 * CHECK-IN - Mark booking as checked-in
 * POST /api/v1/bookings/:id/checkin
 * Body: documentVerified, roomKeyIssued, roomCondition
 */
const checkIn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { documentVerified, roomKeyIssued, roomCondition } = req.body;

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.bookingStatus !== "Confirmed") {
    throw new ApiError(400, "Can only check-in confirmed bookings");
  }

  // Check if check-in date has arrived
  if (new Date() < booking.checkInDate) {
    throw new ApiError(400, "Check-in date has not arrived yet");
  }

  // Update booking
  booking.bookingStatus = "CheckedIn";
  booking.checkInDetails = {
    checkedInAt: new Date(),
    checkedInBy: req.user._id,
    documentVerified: documentVerified || false,
    roomKeyIssued: roomKeyIssued || false,
    initialInspection: {
      roomCondition: roomCondition || "Good",
      amenitiesWorking: true,
    },
  };

  await booking.save();
  await booking.populate("hostel", "name");

  return res.status(200).json(
    new ApiResponse(200, booking, "Guest checked-in successfully")
  );
});

/**
 * CHECK-OUT - Mark booking as checked-out
 * POST /api/v1/bookings/:id/checkout
 * Body: roomKeyReturned, damages, damageCharges
 */
const checkOut = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roomKeyReturned, damages, damageCharges } = req.body;

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.bookingStatus !== "CheckedIn") {
    throw new ApiError(400, "Booking must be checked-in for check-out");
  }

  // Update booking
  booking.bookingStatus = "CheckedOut";
  booking.checkOutDetails = {
    checkedOutAt: new Date(),
    checkedOutBy: req.user._id,
    roomKeyReturned: roomKeyReturned || true,
    finalInspection: {
      roomCondition: "Good",
      damages: damages || "None",
      damageCharges: damageCharges || 0,
    },
  };

  await booking.save();

  // Send review invitation email asynchronously
  notificationService.sendReviewInvitation(booking._id).catch((err) => {
    logger.error("Failed to send review invitation:", err.message);
  });

  logger.info(`Guest checked out from booking ${booking.bookingReference}`);

  return res.status(200).json(
    new ApiResponse(200, booking, "Guest checked-out successfully. Review invitation sent.")
  );
});

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  checkIn,
  checkOut,
};
