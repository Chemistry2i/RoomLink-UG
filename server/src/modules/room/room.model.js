const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: [true, "Hostel is required"],
    },

    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
    },

    roomType: {
      type: String,
      enum: ["Single", "Double", "Twin", "Dorm", "Family", "Suite"],
      required: [true, "Room type is required"],
    },

    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
      max: [20, "Capacity cannot exceed 20"],
    },

    bedConfiguration: {
      type: String,
      enum: ["Single Bed", "Double Bed", "Two Single Beds", "Bunk Beds", "Mixed"],
      required: [true, "Bed configuration is required"],
    },

    totalBeds: {
      type: Number,
      required: [true, "Total beds is required"],
      min: [1, "Must have at least 1 bed"],
    },

    pricePerSemester: {
      type: Number,
      required: [true, "Price per semester is required"],
      min: [0, "Price cannot be negative"],
    },

    weeklyDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100, // percentage
    },

    monthlyDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100, // percentage
    },

    amenities: [
      {
        type: String,
        enum: [
          "Private Bathroom",
          "Shared Bathroom",
          "WiFi",
          "AC",
          "Fan",
          "TV",
          "Balcony",
          "Wardrobe",
          "Work Desk",
          "Locker",
          "Heating",
          "Hot Water",
          "Hairdryer",
          "Safe",
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

    totalRooms: {
      type: Number,
      required: [true, "Total rooms count is required"],
      min: [1, "Must have at least 1 room"],
    },

    availableRooms: {
      type: Number,
      required: [true, "Available rooms is required"],
      min: [0, "Available rooms cannot be negative"],
    },

    description: {
      type: String,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    floor: {
      type: Number,
      default: 0, // 0 = ground floor
    },

    viewType: {
      type: String,
      enum: ["City View", "Garden View", "Street View", "No View"],
      default: "No View",
    },

    accountStatus: {
      type: String,
      enum: ["Active", "Inactive", "Maintenance", "Deleted"],
      default: "Active",
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

    lastBookedAt: Date,

    maintenanceSchedule: [
      {
        startDate: Date,
        endDate: Date,
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

// Compound index for unique room number per hostel
roomSchema.index({ hostel: 1, roomNumber: 1 }, { unique: true });

// Indexes for queries
roomSchema.index({ hostel: 1 });
roomSchema.index({ roomType: 1 });
roomSchema.index({ pricePerSemester: 1 });
roomSchema.index({ averageRating: -1 });
roomSchema.index({ accountStatus: 1 });
roomSchema.index({ capacity: 1 });
roomSchema.index({ createdAt: -1 });

// Virtual for calculated price with discount
roomSchema.virtual("calculatedPrice").get(function (semsters = 1) {
  let discount = 0;
  if (semsters >= 30 && this.monthlyDiscount > 0) {
    discount = this.monthlyDiscount;
  } else if (semsters >= 7 && this.weeklyDiscount > 0) {
    discount = this.weeklyDiscount;
  }
  return this.pricePersemster * semsters * (1 - discount / 100);
});

module.exports = mongoose.model("Room", roomSchema);
