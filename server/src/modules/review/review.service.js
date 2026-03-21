const Review = require("./review.model");
const Booking = require("../booking/booking.model");
const Room = require("../room/room.model");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");

/**
 * Review Service
 * Business logic for reviews and ratings aggregation
 */

/**
 * Create review
 */
const createReview = async (reviewData) => {
  try {
    // Check if booking exists and is completed
    const booking = await Booking.findById(reviewData.booking);
    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    if (booking.status !== "checked-out") {
      throw new ApiError(
        400,
        "Cannot review before checkout"
      );
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: reviewData.booking });
    if (existingReview) {
      throw new ApiError(400, "Review already exists for this booking");
    }

    const review = await Review.create(reviewData);

    // Update room rating averages
    await updateRoomRatings(booking.room);

    logger.info(`Review created: ${review._id}`);
    return review;
  } catch (error) {
    logger.error(`Error creating review: ${error.message}`);
    throw error;
  }
};

/**
 * Get reviews for a room/hostel
 */
const getReviews = async (filters = {}, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.room) query.room = filters.room;
    if (filters.hostel) query.hostel = filters.hostel;
    if (filters.minRating) query.rating = { $gte: filters.minRating };

    const reviews = await Review.find(query)
      .populate("guest", "name avatar")
      .populate("room", "roomNumber")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(query);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error fetching reviews: ${error.message}`);
    throw error;
  }
};

/**
 * Get reviews by room
 */
const getReviewsByRoom = async (roomId, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ room: roomId })
      .populate("guest", "name avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments({ room: roomId });

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error fetching reviews by room: ${error.message}`);
    throw error;
  }
};

/**
 * Get reviews by user
 */
const getReviewsByUser = async (userId, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ guest: userId })
      .populate("room", "roomNumber roomType")
      .populate("hostel", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments({ guest: userId });

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error fetching reviews by user: ${error.message}`);
    throw error;
  }
};

/**
 * Update review
 */
const updateReview = async (reviewId, updates) => {
  try {
    const allowedFields = ["title", "comment", "rating", "cleanliness", "comfort", "valueForMoney", "photos"];
    const filteredUpdates = {};
    allowedFields.forEach((field) => {
      if (updates[field]) filteredUpdates[field] = updates[field];
    });

    const review = await Review.findByIdAndUpdate(reviewId, filteredUpdates, {
      new: true,
      runValidators: true,
    });

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Update room ratings
    await updateRoomRatings(review.room);

    logger.info(`Review updated: ${reviewId}`);
    return review;
  } catch (error) {
    logger.error(`Error updating review: ${error.message}`);
    throw error;
  }
};

/**
 * Delete review
 */
const deleteReview = async (reviewId) => {
  try {
    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Update room ratings
    await updateRoomRatings(review.room);

    logger.info(`Review deleted: ${reviewId}`);
    return review;
  } catch (error) {
    logger.error(`Error deleting review: ${error.message}`);
    throw error;
  }
};

/**
 * Get room rating statistics
 */
const getRoomRatingStats = async (roomId) => {
  try {
    const reviews = await Review.find({ room: roomId });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const stats = {
      averageRating: 0,
      totalReviews: reviews.length,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      categoryAverages: {
        cleanliness: 0,
        comfort: 0,
        valueForMoney: 0,
      },
    };

    let totalRating = 0;
    let cleanliness = 0,
      comfort = 0,
      valueForMoney = 0;

    reviews.forEach((review) => {
      totalRating += review.rating;
      stats.ratingDistribution[review.rating]++;
      cleanliness += review.cleanliness || 0;
      comfort += review.comfort || 0;
      valueForMoney += review.valueForMoney || 0;
    });

    stats.averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
    stats.categoryAverages.cleanliness = Math.round((cleanliness / reviews.length) * 10) / 10;
    stats.categoryAverages.comfort = Math.round((comfort / reviews.length) * 10) / 10;
    stats.categoryAverages.valueForMoney = Math.round((valueForMoney / reviews.length) * 10) / 10;

    return stats;
  } catch (error) {
    logger.error(`Error calculating rating stats: ${error.message}`);
    throw error;
  }
};

/**
 * Update room ratings (internal helper)
 */
const updateRoomRatings = async (roomId) => {
  try {
    const stats = await getRoomRatingStats(roomId);

    await Room.findByIdAndUpdate(roomId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingStats: stats.categoryAverages,
    });

    logger.info(`Room ratings updated: ${roomId}`);
  } catch (error) {
    logger.error(`Error updating room ratings: ${error.message}`);
  }
};

/**
 * Mark review as helpful
 */
const markReviewHelpful = async (reviewId, userId) => {
  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Check if user already marked as helpful
    if (review.helpfulVotes.includes(userId)) {
      throw new ApiError(400, "You already found this review helpful");
    }

    review.helpfulVotes.push(userId);
    await review.save();

    logger.info(`Review marked as helpful: ${reviewId}`);
    return review;
  } catch (error) {
    logger.error(`Error marking review as helpful: ${error.message}`);
    throw error;
  }
};

/**
 * Report inappropriate review
 */
const reportReview = async (reviewId, reportData) => {
  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    if (!review.reports) {
      review.reports = [];
    }

    review.reports.push({
      reportedByUser: reportData.reportedByUser,
      reason: reportData.reason,
      description: reportData.description,
      reportedAt: new Date(),
    });

    await review.save();

    logger.info(`Review reported: ${reviewId}`);
    return review;
  } catch (error) {
    logger.error(`Error reporting review: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createReview,
  getReviews,
  getReviewsByRoom,
  getReviewsByUser,
  updateReview,
  deleteReview,
  getRoomRatingStats,
  updateRoomRatings,
  markReviewHelpful,
  reportReview,
};
