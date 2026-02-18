const mongoose = require("mongoose");

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hostel name is required"],
      trim: true,
      minlength: [3, "Hostel name must be at least 3 characters"],
      maxlength: [100, "Hostel name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Hostel description is required"],
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    address: {
      street: {
        type: String,
        required: [true, "Street address is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      state: {
        type: String,
        default: "",
      },
      zipCode: {
        type: String,
        default: "",
      },
      country: {
        type: String,
        required: [true, "Country is required"],
        default: "Uganda",
      },
    },

    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Coordinates are required for geolocation"],
      },
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },

    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },

    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
      match: [/^(\+\d{1,3})?[\d\s\-\(\)]+$/, "Please provide a valid phone number"],
    },

    checkInTime: {
      type: String,
      default: "14:00", // 24-hour format
    },

    checkOutTime: {
      type: String,
      default: "11:00", // 24-hour format
    },

    amenities: [
      {
        type: String,
        enum: [
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
        ],
      },
    ],

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    coverImage: {
      url: String,
      publicId: String,
    },

    policies: {
      cancellation: {
        type: String,
        enum: ["Flexible", "Moderate", "Strict", "Non-refundable"],
        default: "Moderate",
      },
      cancellationDays: {
        type: Number,
        default: 7, // days before check-in for cancellation
      },
      petPolicy: {
        type: String,
        enum: ["Not Allowed", "Allowed Free", "Allowed With Fee"],
        default: "Not Allowed",
      },
      minStay: {
        type: Number,
        default: 1, // minimum nights
      },
      maxStay: {
        type: Number,
        default: 365, // maximum nights
      },
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    totalBookings: {
      type: Number,
      default: 0,
    },

    accountStatus: {
      type: String,
      enum: ["Active", "Inactive", "Suspended", "Deactivated"],
      default: "Active",
    },

    suspendedAt: Date,

    suspendReason: String,

    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    bank: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      bankCode: String,
      swiftCode: String,
    },

    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },

    verifiedAt: Date,

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes for optimization
hostelSchema.index({ owner: 1 });
hostelSchema.index({ "address.city": 1 });
hostelSchema.index({ accountStatus: 1 });
hostelSchema.index({ coordinates: "2dsphere" }); // For geolocation queries
hostelSchema.index({ createdAt: -1 });
hostelSchema.index({ averageRating: -1 });

// Text index for search
hostelSchema.index({
  name: "text",
  description: "text",
  "address.city": "text",
});

// Virtual for full address
hostelSchema.virtual("fullAddress").get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.country}`;
});

module.exports = mongoose.model("Hostel", hostelSchema);
