const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "CREATE",
        "READ",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "FAILED_LOGIN",
      ],
    },

    module: {
      type: String,
      required: true,
      enum: [
        "Users",
        "Hostels",
        "Bookings",
        "Reviews",
        "Complaints",
        "Payments",
        "Auth",
        "Admin",
      ],
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    resourceType: {
      type: String,
      default: null,
    },

    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: String,

    userAgent: String,

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },

    errorMessage: String,

    description: String,
  },
  { timestamps: true }
);

// Indexes for faster queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ resourceId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
