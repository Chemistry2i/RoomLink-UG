const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../../utils/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't return password by default
    },

    phone: {
      type: String,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },

    // Staff-specific field (required when role is STAFF)
    staffType: {
      type: String,
      enum: ["MANAGER", "RECEPTIONIST", "CLEANER"],
      default: null,
    },

    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // Account status management
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "locked", "deleted"],
      default: "active",
    },

    // Security: Track failed login attempts
    loginAttempts: {
      type: Number,
      default: 0,
    },

    // Security: Lockout until timestamp (for brute force protection)
    lockoutUntil: {
      type: Date,
      default: null,
    },

    // Suspension details
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    suspendedAt: {
      type: Date,
      default: null,
    },

    suspendReason: {
      type: String,
      default: null,
    },

    // Two-factor authentication
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      default: null,
      select: false, // Don't return this by default
    },

    // For staff: which hostels are they assigned to
    assignedHostels: [
      {
        hostelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hostel",
        },
        startDate: {
          type: Date,
          default: Date.now,
        },
        endDate: {
          type: Date,
          default: null,
        },
      },
    ],

    lastLogin: Date,

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1 });

// Validation: STAFF role must have staffType
userSchema.pre("save", function (next) {
  if (this.role === "staff" && !this.staffType) {
    next(new Error("Staff role requires staffType (MANAGER, RECEPTIONIST, or CLEANER)"));
  } else {
    next();
  }
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (passwordToCompare) {
  return await bcrypt.compare(passwordToCompare, this.password);
};

// Method to hide sensitive data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);
