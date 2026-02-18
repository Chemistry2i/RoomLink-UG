const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const Review = require("./review.model");
const Booking = require("../booking/booking.model");
const Hostel = require("../hostel/hostel.model");
const User = require("../user/user.model");
const logger = require("../../config/logger");
const Joi = require("joi");

/**
 * Review Controller
 * Handles review operations for hostels
 */

// Validation schemas
const createReviewSchema = Joi.object({
  hostelId: Joi.string().required(),
  bookingId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(1000).optional(),
  cleanliness: Joi.number().min(1).max(5).optional(),
  comfort: Joi.number().min(1).max(5).optional(),
  staff: Joi.number().min(1).max(5).optional(),
  value: Joi.number().min(1).max(5).optional(),
  location: Joi.number().min(1).max(5).optional(),
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  comment: Joi.string().max(1000).optional(),
  cleanliness: Joi.number().min(1).max(5).optional(),
  comfort: Joi.number().min(1).max(5).optional(),
  staff: Joi.number().min(1).max(5).optional(),
  value: Joi.number().min(1).max(5).optional(),
  location: Joi.number().min(1).max(5).optional(),
});

/**
 * CREATE - Add new review for a hostel
 * POST /api/v1/reviews
 * Body: hostelId, bookingId, rating, comment, cleanliness, comfort, staff, value, location
 */
const createReview = asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = createReviewSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, `Validation error: ${error.details[0].message}`);
  }

  const { hostelId, bookingId, rating, comment, cleanliness, comfort, staff, value: valueRating, location } = value;
  const userId = req.user._id;

  // Check if hostel exists
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  // Check if booking exists and belongs to current user
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only review your own bookings");
  }

  if (booking.hostel.toString() !== hostelId) {
    throw new ApiError(400, "Booking does not match the hostel");
  }

  // Check if booking is completed
  if (booking.status !== "completed" && booking.status !== "checked_out") {
    throw new ApiError(400, "You can only review completed bookings");
  }

  // Check if user already reviewed this booking
  const existingReview = await Review.findOne({ booking: bookingId, user: userId });
  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this booking");
  }

  // Create review
  const newReview = await Review.create({
    user: userId,
    hostel: hostelId,
    booking: bookingId,
    rating,
    comment,
    cleanliness,
    comfort,
    staff,
    value: valueRating,
    location,
    isVerified: true,
  });

  // Populate references
  await newReview.populate([
    { path: "user", select: "name email" },
    { path: "hostel", select: "name" },
    { path: "booking", select: "checkInDate checkOutDate" },
  ]);

  // Update hostel average rating and review count
  const allReviews = await Review.find({ hostel: hostelId });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  
  await Hostel.findByIdAndUpdate(
    hostelId,
    { 
      averageRating: parseFloat(avgRating.toFixed(2)),
      totalReviews: allReviews.length 
    },
    { new: true }
  );

  logger.info(`Review created for hostel ${hostelId} by user ${userId}`);

  return res.status(201).json(
    new ApiResponse(201, newReview, "Review created successfully")
  );
});

/**
 * READ - Get reviews for a hostel
 * GET /api/v1/reviews/hostel/:hostelId
 * Query: page, limit, sortBy (rating, helpful, newest)
 */
const getReviews = asyncHandler(async (req, res) => {
  const { hostelId } = req.params;
  const { page = 1, limit = 10, sortBy = "newest" } = req.query;

  const skip = (page - 1) * limit;

  // Check if hostel exists
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  // Build sort options
  let sortOptions = { createdAt: -1 }; // Default: newest first
  if (sortBy === "rating") {
    sortOptions = { rating: -1 };
  } else if (sortBy === "helpful") {
    sortOptions = { helpful: -1 };
  }

  // Get reviews
  const total = await Review.countDocuments({ hostel: hostelId, isVerified: true });
  const reviews = await Review.find({ hostel: hostelId, isVerified: true })
    .populate("user", "name email")
    .populate("booking", "checkInDate checkOutDate")
    .skip(skip)
    .limit(parseInt(limit))
    .sort(sortOptions);

  return res.status(200).json(
    new ApiResponse(200, {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, "Reviews retrieved successfully")
  );
});

/**
 * UPDATE - Update a review
 * PATCH /api/v1/reviews/:id
 * Body: rating, comment, cleanliness, comfort, staff, value, location
 */
const updateReview = asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = updateReviewSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, `Validation error: ${error.details[0].message}`);
  }

  const { id } = req.params;
  const userId = req.user._id;

  // Check if review exists
  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check authorization (only review owner can update)
  if (review.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only update your own reviews");
  }

  // Update review
  const updatedReview = await Review.findByIdAndUpdate(
    id,
    { $set: value },
    { new: true, runValidators: true }
  ).populate([
    { path: "user", select: "name email" },
    { path: "hostel", select: "name" },
    { path: "booking", select: "checkInDate checkOutDate" },
  ]);

  // Update hostel average rating if rating changed
  if (value.rating) {
    const allReviews = await Review.find({ hostel: review.hostel });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await Hostel.findByIdAndUpdate(
      review.hostel,
      { averageRating: parseFloat(avgRating.toFixed(2)) },
      { new: true }
    );
  }

  logger.info(`Review ${id} updated by user ${userId}`);

  return res.status(200).json(
    new ApiResponse(200, updatedReview, "Review updated successfully")
  );
});

/**
 * DELETE - Delete a review
 * DELETE /api/v1/reviews/:id
 */
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Check if review exists
  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check authorization (only review owner or admin can delete)
  if (review.user.toString() !== userId.toString() && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "You can only delete your own reviews");
  }

  const hostelId = review.hostel;

  // Delete review
  await Review.findByIdAndDelete(id);

  // Update hostel average rating
  const allReviews = await Review.find({ hostel: hostelId });
  if (allReviews.length > 0) {
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Hostel.findByIdAndUpdate(
      hostelId,
      { 
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalReviews: allReviews.length 
      },
      { new: true }
    );
  } else {
    await Hostel.findByIdAndUpdate(
      hostelId,
      { averageRating: 0, totalReviews: 0 },
      { new: true }
    );
  }

  logger.info(`Review ${id} deleted by user ${userId}`);

  return res.status(200).json(
    new ApiResponse(200, null, "Review deleted successfully")
  );
});

module.exports = {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
};
