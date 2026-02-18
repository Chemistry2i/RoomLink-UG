const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
    },

    comment: {
      type: String,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },

    cleanliness: Number,
    comfort: Number,
    staff: Number,
    value: Number,
    location: Number,

    isVerified: {
      type: Boolean,
      default: true,
    },

    helpful: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index
reviewSchema.index({ hostel: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ booking: 1 });

module.exports = mongoose.model("Review", reviewSchema);
