const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const Room = require("./room.model");
const Hostel = require("../hostel/hostel.model");
const uploadService = require("../../services/uploadService");

/**
 * CREATE - Add new room to a hostel
 * POST /api/v1/rooms
 * Body: hostel, roomNumber, roomType, capacity, bedConfiguration, pricePerNight, amenities, totalRooms, availableRooms
 * Files: images (max 10)
 */
const createRoom = asyncHandler(async (req, res) => {
  const {
    hostel,
    roomNumber,
    roomType,
    capacity,
    bedConfiguration,
    totalBeds,
    pricePerNight,
    weeklyDiscount,
    monthlyDiscount,
    amenities,
    totalRooms,
    availableRooms,
    description,
    floor,
    viewType,
  } = req.body;

  // Validate required fields
  if (
    !hostel ||
    !roomNumber ||
    !roomType ||
    !capacity ||
    !bedConfiguration ||
    !totalBeds ||
    typeof pricePerNight === "undefined" ||
    !totalRooms ||
    typeof availableRooms === "undefined"
  ) {
    throw new ApiError(400, "Missing required fields");
  }

  // Check if hostel exists and belongs to current user or user is admin
  const hostelDoc = await Hostel.findById(hostel);
  if (!hostelDoc) {
    throw new ApiError(404, "Hostel not found");
  }

  if (
    hostelDoc.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "ADMIN" &&
    req.user.role !== "SUPER_ADMIN"
  ) {
    throw new ApiError(403, "Not authorized to add rooms to this hostel");
  }

  // Check if room number already exists in this hostel
  const existingRoom = await Room.findOne({ hostel, roomNumber });
  if (existingRoom) {
    throw new ApiError(400, "Room number already exists in this hostel");
  }

  // Handle image uploads
  const images = [];
  if (req.files && req.files.images) {
    const imageFiles = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    for (const file of imageFiles.slice(0, 10)) {
      const uploadedData = await uploadService.uploadFile(file, "rooms");
      images.push({
        url: uploadedData.secure_url,
        publicId: uploadedData.public_id,
      });
    }
  }

  // Create room
  const room = await Room.create({
    hostel,
    roomNumber,
    roomType,
    capacity,
    bedConfiguration,
    totalBeds,
    pricePerNight,
    weeklyDiscount: weeklyDiscount || 0,
    monthlyDiscount: monthlyDiscount || 0,
    amenities: amenities || [],
    images,
    totalRooms,
    availableRooms,
    description,
    floor: floor || 0,
    viewType: viewType || "No View",
    accountStatus: "Active",
  });

  await room.populate("hostel", "name");

  return res.status(201).json(
    new ApiResponse(201, room, "Room created successfully")
  );
});

/**
 * READ ALL - Get all rooms with filtering
 * GET /api/v1/rooms
 * Query: page, limit, hostel, roomType, minPrice, maxPrice, capacity, status
 */
const getRooms = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    hostel,
    roomType,
    minPrice,
    maxPrice,
    capacity,
    status = "Active",
  } = req.query;

  const skip = (page - 1) * limit;
  const filter = { accountStatus: status };

  if (hostel) filter.hostel = hostel;
  if (roomType) filter.roomType = roomType;
  if (capacity) filter.capacity = { $gte: parseInt(capacity) };

  if (minPrice || maxPrice) {
    filter.pricePerNight = {};
    if (minPrice) filter.pricePerNight.$gte = parseFloat(minPrice);
    if (maxPrice) filter.pricePerNight.$lte = parseFloat(maxPrice);
  }

  const total = await Room.countDocuments(filter);
  const rooms = await Room.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .populate("hostel", "name address")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        rooms,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Rooms retrieved successfully"
    )
  );
});

/**
 * READ ONE - Get single room by ID
 * GET /api/v1/rooms/:id
 */
const getRoomById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const room = await Room.findById(id).populate("hostel", "name address amenities");

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  if (room.accountStatus === "Deleted") {
    throw new ApiError(404, "Room not found");
  }

  return res.status(200).json(
    new ApiResponse(200, room, "Room retrieved successfully")
  );
});

/**
 * UPDATE - Update room details
 * PUT /api/v1/rooms/:id
 * Body: roomNumber, roomType, capacity, pricePerNight, amenities, etc.
 */
const updateRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const room = await Room.findById(id);
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  // Check authorization
  const hostel = await Hostel.findById(room.hostel);
  if (
    hostel.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "ADMIN" &&
    req.user.role !== "SUPER_ADMIN"
  ) {
    throw new ApiError(403, "Not authorized to update this room");
  }

  const {
    roomNumber,
    roomType,
    capacity,
    bedConfiguration,
    totalBeds,
    pricePerNight,
    weeklyDiscount,
    monthlyDiscount,
    amenities,
    totalRooms,
    availableRooms,
    description,
    floor,
    viewType,
    accountStatus,
  } = req.body;

  // Update allowed fields
  if (roomNumber) room.roomNumber = roomNumber;
  if (roomType) room.roomType = roomType;
  if (capacity) room.capacity = capacity;
  if (bedConfiguration) room.bedConfiguration = bedConfiguration;
  if (totalBeds) room.totalBeds = totalBeds;
  if (typeof pricePerNight !== "undefined") room.pricePerNight = pricePerNight;
  if (typeof weeklyDiscount !== "undefined") room.weeklyDiscount = weeklyDiscount;
  if (typeof monthlyDiscount !== "undefined") room.monthlyDiscount = monthlyDiscount;
  if (amenities) room.amenities = amenities;
  if (totalRooms) room.totalRooms = totalRooms;
  if (typeof availableRooms !== "undefined") room.availableRooms = availableRooms;
  if (description) room.description = description;
  if (typeof floor !== "undefined") room.floor = floor;
  if (viewType) room.viewType = viewType;
  if (accountStatus && ["Active", "Inactive", "Maintenance", "Deleted"].includes(accountStatus)) {
    room.accountStatus = accountStatus;
  }

  // Handle image updates
  if (req.files && req.files.images) {
    const imageFiles = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    for (const file of imageFiles) {
      const uploadedData = await uploadService.uploadFile(file, "rooms");
      room.images.push({
        url: uploadedData.secure_url,
        publicId: uploadedData.public_id,
      });
    }

    // Limit to 10 images
    if (room.images.length > 10) {
      const toDelete = room.images.splice(10);
      for (const img of toDelete) {
        await uploadService.deleteFile(img.publicId);
      }
    }
  }

  await room.save();
  await room.populate("hostel", "name");

  return res.status(200).json(
    new ApiResponse(200, room, "Room updated successfully")
  );
});

/**
 * DELETE - Soft delete room
 * DELETE /api/v1/rooms/:id
 */
const deleteRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const room = await Room.findById(id);
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  // Check authorization
  const hostel = await Hostel.findById(room.hostel);
  if (
    hostel.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "ADMIN" &&
    req.user.role !== "SUPER_ADMIN"
  ) {
    throw new ApiError(403, "Not authorized to delete this room");
  }

  // Soft delete
  room.accountStatus = "Deleted";
  await room.save();

  return res.status(200).json(
    new ApiResponse(200, room, "Room deleted successfully")
  );
});

/**
 * AVAILABILITY - Check room availability
 * GET /api/v1/rooms/:id/availability
 * Query: checkInDate, checkOutDate (YYYY-MM-DD format)
 */
const checkAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { checkInDate, checkOutDate } = req.query;

  const room = await Room.findById(id);
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  if (!checkInDate || !checkOutDate) {
    throw new ApiError(400, "Check-in and check-out dates are required");
  }

  // Parse dates
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (checkIn >= checkOut) {
    throw new ApiError(400, "Check-out date must be after check-in date");
  }

  // Get Booking model and count bookings for this room in the date range
  const Booking = require("../booking/booking.model");
  const bookings = await Booking.countDocuments({
    room: id,
    checkInDate: { $lt: checkOut },
    checkOutDate: { $gt: checkIn },
    status: { $in: ["Confirmed", "CheckedIn"] },
  });

  const availableCount = room.totalRooms - bookings;
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  
  let discountApplied = 0;
  if (nights >= 30 && room.monthlyDiscount > 0) {
    discountApplied = room.monthlyDiscount;
  } else if (nights >= 7 && room.weeklyDiscount > 0) {
    discountApplied = room.weeklyDiscount;
  }

  const totalPrice = room.pricePerNight * nights * (1 - discountApplied / 100);

  const availability = {
    roomId: room._id,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    checkInDate: checkInDate,
    checkOutDate: checkOutDate,
    nights,
    available: availableCount > 0,
    availableCount,
    totalRooms: room.totalRooms,
    pricePerNight: room.pricePerNight,
    discountApplied,
    totalPrice,
  };

  return res.status(200).json(
    new ApiResponse(200, availability, "Availability checked successfully")
  );
});

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  checkAvailability,
};
