const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const Room = require("./room.model");
const Hostel = require("../hostel/hostel.model");
const uploadService = require("../../services/uploadService");

/**
 * CREATE - Add new room to a hostel
 * POST /api/v1/rooms
 * Body: hostel, roomNumber, roomType, capacity, bedConfiguration, pricePersemster, amenities, totalRooms, availableRooms
 * Files: images (max 10)
 */
const createRoom = asyncHandler(async (req, res) => {
  console.log('DEBUG: Incoming createRoom request body:', req.body);
  if (req.files) {
    console.log('DEBUG: Incoming files:', Object.keys(req.files));
  }

  // Extract and sanitize input
  const {
    hostel,
    roomNumber,
    roomType,
    capacity,
    bedConfiguration,
    totalBeds,
    pricePerSemester,
    weeklyDiscount,
    monthlyDiscount,
    amenities,
    totalRooms: totalRoomsRaw = 1,
    availableRooms: availableRoomsRaw = 1,
    description,
    floor,
    viewType,
  } = req.body;

  // Convert to integers and validate
  const totalRooms = parseInt(totalRoomsRaw, 10);
  const availableRooms = parseInt(availableRoomsRaw, 10);
  console.log('DEBUG: Parsed totalRooms:', totalRooms, 'availableRooms:', availableRooms);


  // Validate required fields and types
  if (!hostel || !roomNumber || !roomType || !capacity || !bedConfiguration || !totalBeds || typeof pricePerSemester === "undefined") {
    console.log('DEBUG: Validation failed. hostel:', hostel, 'roomNumber:', roomNumber, 'roomType:', roomType, 'capacity:', capacity, 'bedConfiguration:', bedConfiguration, 'totalBeds:', totalBeds, 'pricePerSemester:', pricePerSemester);
    throw new ApiError(400, "Missing required fields: hostel, roomNumber, roomType, capacity, bedConfiguration, totalBeds, pricePerSemester");
  }
  if (!Number.isInteger(totalRooms) || totalRooms < 1) {
    throw new ApiError(400, "totalRooms must be a positive integer");
  }
  if (!Number.isInteger(availableRooms) || availableRooms < 0) {
    throw new ApiError(400, "availableRooms must be a non-negative integer");
  }
  if (availableRooms > totalRooms) {
    throw new ApiError(400, "availableRooms cannot exceed totalRooms");
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


  // Enforce unique room number per hostel
  const existingRoom = await Room.findOne({ hostel, roomNumber });
  if (existingRoom) {
    throw new ApiError(400, "Room number already exists in this hostel");
  }


  // Handle image uploads (max 10)
  const images = [];
  if (req.files && req.files.images) {
    const imageFiles = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];
    for (const file of imageFiles.slice(0, 10)) {
      const uploadedData = await uploadService.uploadFile(file.path, "rooms");
      images.push({
        url: uploadedData.url,
        publicId: uploadedData.publicId,
      });
    }
  }


  // Create room with all validated and normalized fields
  const room = await Room.create({
    hostel,
    roomNumber,
    roomType,
    capacity,
    bedConfiguration,
    totalBeds,
    pricePerSemester,
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
  console.log('DEBUG: Room created:', room);

  // Emit real-time event for new room (admin/host dashboards)
  if (global.io) {
    global.io.to("admin").emit("newRoom", room);
    global.io.to("host").emit("newRoom", room);
  }

  // Professional, clear response with all key details
  return res.status(201).json(
    new ApiResponse(201, {
      ...room.toObject(),
      totalRooms: room.totalRooms,
      availableRooms: room.availableRooms,
    }, "Room created successfully")
  );
});

/**
 * READ ALL - Get all rooms with advanced filtering, pagination, sorting
 * GET /api/v1/rooms
 * Query: page, limit, hostel, roomType, minPrice, maxPrice, capacity, status, amenities, search, sort
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
    amenities,
    search,
    sort = "-createdAt"
  } = req.query;

  const skip = (page - 1) * limit;
  const filter = { accountStatus: status };

  if (hostel) filter.hostel = hostel;
  if (roomType) filter.roomType = roomType;
  if (capacity) filter.capacity = { $gte: parseInt(capacity) };
  if (minPrice || maxPrice) {
    filter.pricePersemster = {};
    if (minPrice) filter.pricePersemster.$gte = parseFloat(minPrice);
    if (maxPrice) filter.pricePersemster.$lte = parseFloat(maxPrice);
  }
  if (amenities) {
    const amenitiesArr = Array.isArray(amenities) ? amenities : amenities.split(",");
    filter.amenities = { $all: amenitiesArr };
  }

  // Text search if provided
  let query = Room.find(filter);
  if (search) {
    query = Room.find(
      { $text: { $search: search }, ...filter },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
  } else {
    // Flexible sorting
    const sortObj = {};
    const sortFields = sort.split(",");
    for (const field of sortFields) {
      if (field.startsWith("-")) sortObj[field.substring(1)] = -1;
      else sortObj[field] = 1;
    }
    query = query.sort(sortObj);
  }

  const total = await Room.countDocuments(filter);
  const rooms = await query
    .skip(skip)
    .limit(parseInt(limit))
    .populate("hostel", "name address");

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
 * Body: roomNumber, roomType, capacity, pricePersemster, amenities, etc.
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
    pricePersemster,
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
  if (typeof pricePersemster !== "undefined") room.pricePersemster = pricePersemster;
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
      const uploadedData = await uploadService.uploadFile(file.path, "rooms");
      room.images.push({
        url: uploadedData.url,
        publicId: uploadedData.publicId,
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
  const semsters = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  
  let discountApplied = 0;
  if (semsters >= 30 && room.monthlyDiscount > 0) {
    discountApplied = room.monthlyDiscount;
  } else if (semsters >= 7 && room.weeklyDiscount > 0) {
    discountApplied = room.weeklyDiscount;
  }

  const totalPrice = room.pricePersemster * semsters * (1 - discountApplied / 100);

  const availability = {
    roomId: room._id,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    checkInDate: checkInDate,
    checkOutDate: checkOutDate,
    semsters,
    available: availableCount > 0,
    availableCount,
    totalRooms: room.totalRooms,
    pricePersemster: room.pricePersemster,
    discountApplied,
    totalPrice,
  };

  return res.status(200).json(
    new ApiResponse(200, availability, "Availability checked successfully")
  );
});

/**
 * Get all rooms for a specific hostel
 * GET /api/v1/hostels/:hostelId/rooms
 */
const getHostelRooms = asyncHandler(async (req, res) => {
  const { hostelId } = req.params;
  const rooms = await Room.find({ hostel: hostelId });
  res.json(new ApiResponse(200, rooms, "Rooms fetched successfully"));
});

/**
 * Update room availability
 * PATCH /api/v1/hostels/:hostelId/rooms/:roomId/availability
 */
const updateRoomAvailability = asyncHandler(async (req, res) => {
  const { hostelId, roomId } = req.params;
  const { availableRooms } = req.body;
  const room = await Room.findOneAndUpdate(
    { _id: roomId, hostel: hostelId },
    { availableRooms },
    { new: true }
  );
  if (!room) throw new ApiError(404, "Room not found");
  res.json(new ApiResponse(200, room, "Room availability updated"));
});

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  checkAvailability,
  getHostelRooms,
  updateRoomAvailability,
};
