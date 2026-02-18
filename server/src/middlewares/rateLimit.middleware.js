const rateLimit = require("express-rate-limit");

/**
 * General Rate Limiter
 * Apply to all requests
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Strict Rate Limiter for Auth endpoints
 * Prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message:
    "Too many login/register attempts, please try again after 15 minutes.",
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Booking Rate Limiter
 * Allow moderate requests for booking
 */
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per hour
  message: "Too many booking attempts, please try again later.",
});

/**
 * Review Rate Limiter
 */
const reviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // limit each IP to 5 reviews per day
  message: "Too many reviews submitted, please try again tomorrow.",
});

/**
 * Upload Rate Limiter
 * Prevent excessive file uploads
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 uploads per hour
  message: "Too many file uploads, please try again later.",
});

/**
 * Payment Rate Limiter
 * Prevent spam payment attempts
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 payment attempts per hour
  message: "Too many payment attempts, please try again later.",
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Complaint Rate Limiter
 * Prevent spam complaints
 */
const complaintLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // limit each IP to 5 complaints per day
  message: "Too many complaints submitted, please try again tomorrow.",
});

module.exports = {
  generalLimiter,
  authLimiter,
  bookingLimiter,
  reviewLimiter,
  uploadLimiter,
  paymentLimiter,
  complaintLimiter,
};
