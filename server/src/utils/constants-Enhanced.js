/**
 * Enhanced Application Constants
 * With improved role system and permissions
 * 
 * TODO: Replace old ROLES in src/utils/constants.js with this structure
 */

// ============================================
// Enhanced User Roles with Hierarchy
// ============================================

const ROLES = {
  // System Level
  SUPER_ADMIN: "super_admin",      // Level 5 - System owner
  ADMIN: "admin",                   // Level 4 - Platform admin

  // Business Level
  HOST: "host",                     // Level 3 - Hostel owner
  STAFF: "staff",                   // Level 2 - Hostel employee

  // User Level
  USER: "user",                     // Level 1 - Regular guest
  GUEST: "guest",                   // Level 0 - Anonymous user
};

/**
 * Staff Subtypes
 * Used when role is STAFF to determine exact permissions
 */
const STAFF_TYPES = {
  MANAGER: "manager",               // Senior staff - full hostel operations
  RECEPTIONIST: "receptionist",     // Front desk - check-in/check-out
  CLEANER: "cleaner",               // Cleaning - room status only
};

/**
 * Role Hierarchy Levels
 * Used for access control and permission checking
 */
const ROLE_LEVELS = {
  [ROLES.SUPER_ADMIN]: 5,
  [ROLES.ADMIN]: 4,
  [ROLES.HOST]: 3,
  [ROLES.STAFF]: 2,
  [ROLES.USER]: 1,
  [ROLES.GUEST]: 0,
};

/**
 * Permissions Map by Role
 * Defines what each role can do
 */
const PERMISSIONS = {
  // SUPER_ADMIN - Can do everything
  [ROLES.SUPER_ADMIN]: {
    system: ["*"],                  // All system operations
    admin: ["*"],                   // All admin operations
    user: ["*"],                    // All user operations
    hostel: ["*"],                  // All hostel operations
    booking: ["*"],                 // All booking operations
    payment: ["*"],                 // All payment operations
    complaint: ["*"],               // All complaint operations
    review: ["*"],                  // All review operations
    report: ["*"],                  // All report operations
  },

  // ADMIN - Platform control (no system settings)
  [ROLES.ADMIN]: {
    // Cannot touch system settings
    user: [
      "view_all",
      "suspend",
      "delete",
      "view_history",
      "unlock_account",
    ],
    hostel: [
      "view_all",
      "approve",
      "reject",
      "suspend",
      "view_details",
    ],
    booking: [
      "view_all",
      "modify_status",
      "refund",
      "view_details",
    ],
    complaint: [
      "view_all",
      "assign",
      "resolve",
      "escalate",
      "view_details",
    ],
    review: [
      "moderate",
      "delete_spam",
      "view_all",
    ],
    payment: [
      "view_all",
      "resolve_disputes",
      "process_refund",
    ],
    report: [
      "generate",
      "view_all",
      "export",
    ],
  },

  // HOST - Own hostel management
  [ROLES.HOST]: {
    hostel: [
      "create",
      "view_own",
      "update_own",
      "delete_own",
      "view_analytics",
    ],
    booking: [
      "view_own",
      "modify_own",
      "check_in",
      "check_out",
      "view_details",
    ],
    review: [
      "view_own",
      "respond",
      "reply",
    ],
    complaint: [
      "view_own",
      "respond",
      "provide_evidence",
    ],
    report: [
      "generate_own",
      "view_own",
      "export_own",
    ],
    staff: [
      "manage",
      "create",
      "update",
      "delete",
    ],
  },

  // STAFF - Hostel operations
  [ROLES.STAFF]: {
    booking: [
      "view_own_hostel",
      "check_in",
      "check_out",
      "view_guest_details",
    ],
    complaint: [
      "view_own_hostel",
      "handle_basic",
      "escalate",
    ],
    review: [
      "view_own_hostel",
    ],
    // Staff cleaning/receptionist restrictions
    // manager: full permissions above
    // receptionist: check-in/check-out only
    // cleaner: room status only
  },

  // USER - Guest operations
  [ROLES.USER]: {
    hostel: [
      "search",
      "view_public",
    ],
    booking: [
      "create",
      "view_own",
      "modify_own",
      "cancel",
    ],
    review: [
      "create_own",
      "update_own",
      "delete_own",
      "view_all",
    ],
    complaint: [
      "create",
      "view_own",
      "update_own",
    ],
  },

  // GUEST - Public access only
  [ROLES.GUEST]: {
    hostel: [
      "search",
      "view_public",
    ],
    review: [
      "view_all",
    ],
  },
};

/**
 * Protected Routes by Role
 * Which roles can access which routes
 */
const ROUTE_PERMISSIONS = {
  // System routes - SUPER_ADMIN only
  "/api/v1/admin/system/*": [ROLES.SUPER_ADMIN],

  // Admin routes - ADMIN and above
  "/api/v1/admin/*": [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // Host dashboard - HOST and above
  "/api/v1/host/*": [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOST],

  // Staff operations - STAFF and above
  "/api/v1/staff/*": [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOST, ROLES.STAFF],

  // User operations - USER and above
  "/api/v1/users/*": [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HOST, ROLES.STAFF, ROLES.USER],

  // Public routes - All authenticated users
  "/api/v1/hostels/*": [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.HOST,
    ROLES.STAFF,
    ROLES.USER,
    ROLES.GUEST,
  ],

  // Booking routes - Authenticated users
  "/api/v1/bookings/*": [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.HOST,
    ROLES.STAFF,
    ROLES.USER,
  ],
};

// ============================================
// Existing Constants (Keep as is)
// ============================================

// Booking Status
const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  CHECKED_IN: "checked-in",
  CHECKED_OUT: "checked-out",
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
  PARTIAL_REFUND: "partial_refund",
};

// Complaint Status
const COMPLAINT_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in-progress",
  RESOLVED: "resolved",
  REJECTED: "rejected",
  ESCALATED: "escalated",
};

// Complaint Priority
const COMPLAINT_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

// Complaint Category
const COMPLAINT_CATEGORY = {
  MAINTENANCE: "maintenance",
  HYGIENE: "hygiene",
  STAFF: "staff",
  NOISE: "noise",
  THEFT: "theft",
  OTHER: "other",
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
  VERY_LONG: 86400, // 1 day
};

// Error Messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden - You don't have permission",
  NOT_FOUND: "Resource not found",
  INVALID_INPUT: "Invalid input provided",
  DUPLICATE_ENTRY: "Duplicate entry",
  CONFLICT: "Resource conflict",
  BOOKING_CONFLICT: "Booking dates conflict with existing reservations",
  DOUBLE_BOOKING: "Cannot book - dates already reserved",
  MAX_OCCUPANCY: "Maximum occupancy reached",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions for this action",
  ACCOUNT_LOCKED: "Account is locked due to multiple failed attempts",
  ACCOUNT_SUSPENDED: "Account has been suspended",
  INVALID_TOKEN: "Invalid or expired token",
  PAYMENT_FAILED: "Payment processing failed",
};

// Success Messages
const SUCCESS_MESSAGES = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  RETRIEVED: "Resource retrieved successfully",
  LOGGED_IN: "Logged in successfully",
  LOGGED_OUT: "Logged out successfully",
  EMAIL_VERIFIED: "Email verified successfully",
  PASSWORD_RESET: "Password reset successfully",
  PAYMENT_COMPLETED: "Payment completed successfully",
};

// Email Configuration
const EMAIL_TYPES = {
  WELCOME: "registrationWelcome",
  EMAIL_VERIFIED: "emailVerified",
  BOOKING_CONFIRMATION: "bookingConfirmation",
  BOOKING_CANCELLATION: "bookingCancellation",
  COMPLAINT_ACK: "complaintAcknowledgment",
  COMPLAINT_RESOLUTION: "complaintResolution",
  REVIEW_INVITATION: "reviewInvitation",
  PASSWORD_RESET: "passwordReset",
  HOST_WELCOME: "hostWelcome",
  PAYMENT_CONFIRMATION: "paymentConfirmation",
  REFUND: "refundEmail",
};

module.exports = {
  // NEW - Enhanced role system
  ROLES,
  STAFF_TYPES,
  ROLE_LEVELS,
  PERMISSIONS,
  ROUTE_PERMISSIONS,

  // EXISTING - Keep compatibility
  BOOKING_STATUS,
  PAYMENT_STATUS,
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  COMPLAINT_CATEGORY,
  CACHE_TTL,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  EMAIL_TYPES,
};

