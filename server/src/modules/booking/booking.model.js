const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: [true, "Hostel is required"],
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room is required"],
    },

    checkInDate: {
      type: Date,
      required: [true, "Check-in date is required"],
    },

    checkOutDate: {
      type: Date,
      required: [true, "Check-out date is required"],
    },

    numberOfGuests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "At least 1 guest is required"],
    },

    numberOfRooms: {
      type: Number,
      required: [true, "Number of rooms is required"],
      default: 1,
      min: [1, "At least 1 room is required"],
    },

    guestDetails: {
      firstName: {
        type: String,
        required: [true, "Guest first name is required"],
      },
      lastName: {
        type: String,
        required: [true, "Guest last name is required"],
      },
      email: {
        type: String,
        required: [true, "Guest email is required"],
      },
      phone: {
        type: String,
        required: [true, "Guest phone is required"],
      },
      idType: {
        type: String,
        enum: ["Passport", "National ID", "Driving License", "Other"],
      },
      idNumber: String,
    },

    pricing: {
      pricePerNight: {
        type: Number,
        required: [true, "Price per night is required"],
      },
      numberOfNights: {
        type: Number,
        required: [true, "Number of nights is required"],
      },
      subtotal: {
        type: Number,
        required: [true, "Subtotal is required"],
      },
      discountApplied: {
        type: Number,
        default: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      serviceFee: {
        type: Number,
        default: 0,
      },
      taxAmount: {
        type: Number,
        default: 0,
      },
      totalPrice: {
        type: Number,
        required: [true, "Total price is required"],
      },
      currency: {
        type: String,
        default: "UGX",
      },
    },

    payment: {
      method: {
        type: String,
        enum: ["M-Pesa", "Credit Card", "Debit Card", "Bank Transfer", "Cash"],
        required: [true, "Payment method is required"],
      },
      status: {
        type: String,
        enum: ["Pending", "Processing", "Completed", "Failed", "Refunded"],
        default: "Pending",
      },
      transactionId: String,
      phoneNumber: String,
      paidAt: Date,
      refundedAt: Date,
      refundReason: String,
      refundAmount: Number,
    },

    bookingStatus: {
      type: String,
      enum: ["Confirmed", "CheckedIn", "CheckedOut", "Cancelled", "NoShow"],
      default: "Confirmed",
    },

    cancellation: {
      cancelledAt: Date,
      cancelledBy: {
        type: String,
        enum: ["User", "Hostel", "Admin"],
      },
      cancelReason: String,
      refundEligible: Boolean,
      refundPercentage: Number,
    },

    specialRequests: {
      type: String,
      maxlength: [1000, "Special requests cannot exceed 1000 characters"],
    },

    notes: {
      type: String,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },

    checkInDetails: {
      checkedInAt: Date,
      checkedInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      documentVerified: Boolean,
      roomKeyIssued: Boolean,
      initialInspection: {
        roomCondition: String,
        amenitiesWorking: Boolean,
        notes: String,
      },
    },

    checkOutDetails: {
      checkedOutAt: Date,
      checkedOutBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      roomKeyReturned: Boolean,
      finalInspection: {
        roomCondition: String,
        damages: String,
        damageCharges: Number,
        notes: String,
      },
    },

    returnGuest: {
      type: Boolean,
      default: false,
    },

    noShowReason: String,

    additionalServices: [
      {
        service: String,
        quantity: Number,
        pricePerUnit: Number,
        totalAmount: Number,
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,
  },
  { timestamps: true }
);

// Indexes for optimization
bookingSchema.index({ user: 1 });
bookingSchema.index({ hostel: 1 });
bookingSchema.index({ room: 1 });
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ "payment.status": 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ user: 1, checkInDate: 1, bookingStatus: 1 });
bookingSchema.index({
  room: 1,
  checkInDate: 1,
  checkOutDate: 1,
  bookingStatus: 1,
});

// Pre-save middleware to generate booking reference
bookingSchema.pre("save", function (next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.bookingReference = `BK${random}${timestamp}`;
  }
  next();
});

// Instance methods
bookingSchema.methods.canBeCancelled = function () {
  if (
    this.bookingStatus === "CheckedIn" ||
    this.bookingStatus === "CheckedOut"
  ) {
    return false;
  }
  if (this.bookingStatus === "Cancelled" || this.bookingStatus === "NoShow") {
    return false;
  }
  return true;
};

bookingSchema.methods.calculateRefund = function (cancellationDays) {
  if (!this.canBeCancelled()) {
    return 0;
  }

  const daysUntilCheckIn = Math.floor(
    (this.checkInDate - new Date()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilCheckIn <= 0) {
    return 0;
  }

  if (daysUntilCheckIn >= cancellationDays) {
    return this.pricing.totalPrice;
  } else if (daysUntilCheckIn >= cancellationDays / 2) {
    return this.pricing.totalPrice * 0.5;
  }

  return 0;
};

module.exports = mongoose.model("Booking", bookingSchema);
