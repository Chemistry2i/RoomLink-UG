const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const Hostel = require("./hostel.model");
const uploadService = require("../../services/uploadService");

/**
 * CREATE - Add new hostel
 * POST /api/v1/hostels
 * Body: name, description, address, coordinates, contactEmail, contactPhone, amenities, policies
 * Files: images (max 10), coverImage
 */
const createHostel = asyncHandler(async (req, res) => {
  let { name, description, address, coordinates, contactEmail, contactPhone, amenities, policies, checkInTime, checkOutTime } = req.body;

  // Parse JSON strings from multipart form data
  if (typeof address === "string") {
    try { address = JSON.parse(address); } catch (e) { /* keep as-is */ }
  }
  if (typeof coordinates === "string") {
    try { coordinates = JSON.parse(coordinates); } catch (e) { /* keep as-is */ }
  }
  if (typeof amenities === "string") {
    try { amenities = JSON.parse(amenities); } catch (e) { amenities = []; }
  }
  if (typeof policies === "string") {
    try { policies = JSON.parse(policies); } catch (e) { policies = {}; }
  }

  // Validate required fields
  if (!name || !description || !address || !coordinates || !contactEmail || !contactPhone) {
    throw new ApiError(400, "Missing required fields");
  }

  // Check if owner already has max hostels (production limit: 10 per user)
  const existingCount = await Hostel.countDocuments({ owner: req.user._id, accountStatus: { $ne: "Deactivated" } });
  if (existingCount >= 10) {
    throw new ApiError(400, "Maximum hostels limit reached");
  }

  // Handle image uploads
  const images = [];
  let coverImage = null;

  if (req.files && req.files.images) {
    const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    
    for (const file of imageFiles.slice(0, 10)) {
      const uploadedData = await uploadService.uploadFile(file.path, "hostels");
      images.push({
        url: uploadedData.url,
        publicId: uploadedData.publicId,
      });
    }

    if (images.length === 0) {
      throw new ApiError(400, "At least one image is required");
    }
  } else {
    throw new ApiError(400, "Hostel images are required");
  }

  if (req.files && req.files.coverImage) {
    const coverFile = Array.isArray(req.files.coverImage) ? req.files.coverImage[0] : req.files.coverImage;
    const coverData = await uploadService.uploadFile(coverFile.path, "hostels");
    coverImage = {
      url: coverData.url,
      publicId: coverData.publicId,
    };
  }

  // Create hostel
  const hostel = await Hostel.create({
    name,
    description,
    address,
    coordinates,
    contactEmail,
    contactPhone,
    owner: req.user._id,
    amenities: amenities || [],
    images,
    coverImage,
    policies: policies || {},
    checkInTime: checkInTime || "14:00",
    checkOutTime: checkOutTime || "11:00",
    accountStatus: "Active",
  });

  await hostel.populate("owner", "name email phone");

  return res.status(201).json(
    new ApiResponse(201, hostel, "Hostel created successfully")
  );
});

/**
 * READ ALL - Get all hostels with advanced filtering, pagination, sorting
 * GET /api/v1/hostels
 * Query: page, limit, city, minRating, status, search, country, owner, minPrice, maxPrice, amenities, sort
 */
const getHostels = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    city,
    minRating,
    status = "Active",
    search,
    country,
    owner,
    minPrice,
    maxPrice,
    amenities,
    sort = "-createdAt"
  } = req.query;

  const skip = (page - 1) * limit;
  const filter = { accountStatus: status };

  if (city) filter["address.city"] = { $regex: city, $options: "i" };
  if (country) filter["address.country"] = { $regex: country, $options: "i" };
  if (owner) filter.owner = owner;
  if (minRating) filter.averageRating = { $gte: parseFloat(minRating) };
  if (minPrice || maxPrice) {
    filter.pricePerNight = {};
    if (minPrice) filter.pricePerNight.$gte = parseFloat(minPrice);
    if (maxPrice) filter.pricePerNight.$lte = parseFloat(maxPrice);
  }
  if (amenities) {
    const amenitiesArr = Array.isArray(amenities) ? amenities : amenities.split(",");
    filter.amenities = { $all: amenitiesArr };
  }

  // Text search if provided
  let query = Hostel.find(filter);
  if (search) {
    query = Hostel.find(
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

  const total = await Hostel.countDocuments(filter);
  const hostels = await query
    .skip(skip)
    .limit(parseInt(limit))
    .populate("owner", "name email phone");

  return res.status(200).json(
    new ApiResponse(200, {
      hostels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, "Hostels retrieved successfully")
  );
});

/**
 * READ ONE - Get single hostel by ID
 * GET /api/v1/hostels/:id
 */
const getHostelById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hostel = await Hostel.findById(id)
    .populate("owner", "name email phone");

  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  // Check access (public can view, owner can view even if suspended)
  if (hostel.accountStatus === "Deactivated" && hostel.owner._id.toString() !== req.user?._id?.toString()) {
    throw new ApiError(404, "Hostel not found");
  }

  return res.status(200).json(
    new ApiResponse(200, hostel, "Hostel retrieved successfully")
  );
});

/**
 * UPDATE - Update hostel details
 * PUT /api/v1/hostels/:id
 * Body: name, description, address, amenities, policies, etc.
 */
const updateHostel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hostel = await Hostel.findById(id);
  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  // Check ownership
  const userRole = req.user.role.toLowerCase();
  if (hostel.owner.toString() !== req.user._id.toString() && userRole !== "admin" && userRole !== "super_admin") {
    throw new ApiError(403, "Not authorized to update this hostel");
  }

  let { name, description, address, amenities, policies, contactEmail, contactPhone, checkInTime, checkOutTime } = req.body;

  // Parse JSON strings from multipart form data
  if (typeof address === "string") {
    try { address = JSON.parse(address); } catch (e) { /* keep as-is */ }
  }
  if (typeof amenities === "string") {
    try { amenities = JSON.parse(amenities); } catch (e) { amenities = []; }
  }
  if (typeof policies === "string") {
    try { policies = JSON.parse(policies); } catch (e) { policies = {}; }
  }

  // Update allowed fields
  if (name) hostel.name = name;
  if (description) hostel.description = description;
  if (address) hostel.address = { ...hostel.address, ...address };
  if (amenities) hostel.amenities = amenities;
  if (policies) hostel.policies = { ...hostel.policies, ...policies };
  if (contactEmail) hostel.contactEmail = contactEmail;
  if (contactPhone) hostel.contactPhone = contactPhone;
  if (checkInTime) hostel.checkInTime = checkInTime;
  if (checkOutTime) hostel.checkOutTime = checkOutTime;

  // Handle image updates
  if (req.files) {
    if (req.files.images) {
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      
      for (const file of imageFiles) {
        const uploadedData = await uploadService.uploadFile(file.path, "hostels");
        hostel.images.push({
          url: uploadedData.url,
          publicId: uploadedData.publicId,
        });
      }

      // Limit to 10 images
      if (hostel.images.length > 10) {
        const toDelete = hostel.images.splice(10);
        for (const img of toDelete) {
          await uploadService.deleteFile(img.publicId);
        }
      }
    }

    if (req.files.coverImage) {
      if (hostel.coverImage) {
        await uploadService.deleteFile(hostel.coverImage.publicId);
      }
      const coverFile = Array.isArray(req.files.coverImage) ? req.files.coverImage[0] : req.files.coverImage;
      const coverData = await uploadService.uploadFile(coverFile.path, "hostels");
      hostel.coverImage = {
        url: coverData.url,
        publicId: coverData.publicId,
      };
    }
  }

  await hostel.save();
  await hostel.populate("owner", "name email phone");

  return res.status(200).json(
    new ApiResponse(200, hostel, "Hostel updated successfully")
  );
});

/**
 * DELETE - Soft delete hostel
 * DELETE /api/v1/hostels/:id
 */
const deleteHostel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hostel = await Hostel.findById(id);
  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  // Check ownership
  const delRole = req.user.role.toLowerCase();
  if (hostel.owner.toString() !== req.user._id.toString() && delRole !== "admin" && delRole !== "super_admin") {
    throw new ApiError(403, "Not authorized to delete this hostel");
  }

  // Soft delete
  hostel.accountStatus = "Deactivated";
  hostel.suspendedAt = new Date();
  hostel.suspendReason = "Owner deactivation";
  hostel.suspendedBy = req.user._id;

  await hostel.save();

  return res.status(200).json(
    new ApiResponse(200, hostel, "Hostel deactivated successfully")
  );
});

/**
 * ANALYTICS - Get hostel analytics
 * GET /api/v1/hostels/:id/analytics
 */
const getHostelAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hostel = await Hostel.findById(id);
  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  // Check ownership or admin
  const analyticsRole = req.user.role.toLowerCase();
  if (hostel.owner.toString() !== req.user._id.toString() && analyticsRole !== "admin" && analyticsRole !== "super_admin") {
    throw new ApiError(403, "Not authorized to view analytics");
  }

  const analytics = {
    hostelId: hostel._id,
    name: hostel.name,
    totalBookings: hostel.totalBookings,
    averageRating: hostel.averageRating,
    totalReviews: hostel.totalReviews,
    accountStatus: hostel.accountStatus,
    createdAt: hostel.createdAt,
    roomCount: 0, // Will be calculated from Room model
    occupancyRate: 0, // Will be calculated based on bookings
  };

  return res.status(200).json(
    new ApiResponse(200, analytics, "Hostel analytics retrieved successfully")
  );
});

/**
 * List all available amenities (static list)
 * GET /api/v1/hostels/amenities
 */
const getAmenities = asyncHandler(async (req, res) => {
  const amenities = [
    "WiFi",
    "Parking",
    "Kitchen",
    "Laundry",
    "Gym",
    "Lounge",
    "Garden",
    "Security",
    "CCTV",
    "Hot Water",
    "AC",
    "Breakfast Included",
    "Pet Friendly",
    "Wheelchair Friendly",
    "Library",
    "Game Room",
  ];
  res.json(new ApiResponse(200, amenities, "Amenities list fetched successfully"));
});

/**
 * Add an amenity to a hostel
 * POST /api/v1/hostels/:id/amenities
 */
const addAmenityToHostel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amenity } = req.body;
  if (!amenity) throw new ApiError(400, "Amenity is required");
  const hostel = await Hostel.findByIdAndUpdate(
    id,
    { $addToSet: { amenities: amenity } },
    { new: true }
  );
  if (!hostel) throw new ApiError(404, "Hostel not found");
  res.json(new ApiResponse(200, hostel, "Amenity added to hostel"));
});

/**
 * Remove an amenity from a hostel
 * DELETE /api/v1/hostels/:id/amenities
 */
const removeAmenityFromHostel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amenity } = req.body;
  if (!amenity) throw new ApiError(400, "Amenity is required");
  const hostel = await Hostel.findByIdAndUpdate(
    id,
    { $pull: { amenities: amenity } },
    { new: true }
  );
  if (!hostel) throw new ApiError(404, "Hostel not found");
  res.json(new ApiResponse(200, hostel, "Amenity removed from hostel"));
});

/**
 * Upload hostel images (add to existing images)
 * POST /api/v1/hostels/:id/images
 * Files: images (max 10)
 */
const uploadHostelImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.files || !req.files.images) throw new ApiError(400, "No images uploaded");
  const hostel = await Hostel.findById(id);
  if (!hostel) throw new ApiError(404, "Hostel not found");
  const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
  const uploadedImages = [];
  for (const file of imageFiles.slice(0, 10)) {
    const uploadedData = await uploadService.uploadFile(file.path, "hostels");
    uploadedImages.push({
      url: uploadedData.url,
      publicId: uploadedData.publicId,
    });
  }
  hostel.images.push(...uploadedImages);
  await hostel.save();
  res.json(new ApiResponse(200, hostel.images, "Images uploaded successfully"));
});

/**
 * Delete a hostel image by publicId
 * DELETE /api/v1/hostels/:id/images/:publicId
 */
const deleteHostelImage = asyncHandler(async (req, res) => {
  const { id, publicId } = req.params;
  const hostel = await Hostel.findById(id);
  if (!hostel) throw new ApiError(404, "Hostel not found");
  // Remove from Cloudinary
  await uploadService.deleteFile(publicId);
  // Remove from DB
  hostel.images = hostel.images.filter(img => img.publicId !== publicId);
  await hostel.save();
  res.json(new ApiResponse(200, hostel.images, "Image deleted successfully"));
});

module.exports = {
  createHostel,
  getHostels,
  getHostelById,
  updateHostel,
  deleteHostel,
  getHostelAnalytics,
  getAmenities,
  addAmenityToHostel,
  removeAmenityFromHostel,
  uploadHostelImages,
  deleteHostelImage,
};
