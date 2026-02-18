/**
 * Application Constants
 * Centralized constants for the application
 */

// User Roles with hierarchy
const ROLES = {
  SUPER_ADMIN: "super_admin",  // Level 5 - System owner
  ADMIN: "admin",              // Level 4 - Platform admin
  HOST: "host",                // Level 2 - Property owner
  STAFF: "staff",              // Level 1 - Hostel staff
  USER: "user",                // Level 0 - Regular customer
};

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  super_admin: 5,
  admin: 4,
  host: 2,
  staff: 1,
  user: 0,
};

// Staff types
const STAFF_TYPES = {
  MANAGER: "MANAGER",
  RECEPTIONIST: "RECEPTIONIST",
  CLEANER: "CLEANER",
};

// Account status
const ACCOUNT_STATUS = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  LOCKED: "locked",
  DELETED: "deleted",
};

// Permissions by role
const ROLE_PERMISSIONS = {
  super_admin: ["all"], // Full access
  admin: [
    "manage_users",
    "manage_hostels",
    "manage_complaints",
    "manage_payments",
    "view_reports",
    "manage_staff",
    "moderate_reviews",
  ],
  host: [
    "manage_own_hostel",
    "manage_own_bookings",
    "view_own_reviews",
    "respond_to_reviews",
    "manage_own_staff",
  ],
  staff: ["manage_hostel_operations", "handle_guest_services", "view_schedule"],
  user: ["make_booking", "leave_review", "contact_support"],
};

// Booking Status
const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
};

// Complaint Status
const COMPLAINT_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in-progress",
  RESOLVED: "resolved",
  REJECTED: "rejected",
};

// Complaint Priority
const COMPLAINT_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

// Complaint Category
const COMPLAINT_CATEGORY = {
  MAINTENANCE: "maintenance",
  HYGIENE: "hygiene",
  STAFF: "staff",
  OTHER: "other",
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
};

// Error Messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",
  INVALID_INPUT: "Invalid input provided",
  DUPLICATE_ENTRY: "Duplicate entry",
  CONFLICT: "Resource conflict",
  BOOKING_CONFLICT: "Booking dates conflict with existing reservations",
  DOUBLE_BOOKING: "Cannot book - dates already reserved",
  MAX_OCCUPANCY: "Maximum occupancy reached",
};

// Success Messages
const SUCCESS_MESSAGES = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  RETRIEVED: "Resource retrieved successfully",
};

module.exports = {
  ROLES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  COMPLAINT_CATEGORY,
  CACHE_TTL,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
