const express = require("express");
const router = express.Router();
const reviewController = require("./review.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { reviewLimiter } = require("../../middlewares/rateLimit.middleware");

/**
 * Review Routes
 * GET    /api/v1/reviews/hostel/:hostelId
 * POST   /api/v1/reviews
 * PATCH  /api/v1/reviews/:id
 * DELETE /api/v1/reviews/:id
 */

router.get("/hostel/:hostelId", reviewController.getReviews);
router.post("/", authenticate, reviewLimiter, reviewController.createReview);
router.patch("/:id", authenticate, reviewController.updateReview);
router.delete("/:id", authenticate, reviewController.deleteReview);

module.exports = router;
