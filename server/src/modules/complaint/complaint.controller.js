const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const logger = require("../../config/logger");
const Joi = require("joi");
const Complaint = require("./complaint.model");
const Booking = require("../booking/booking.model");
const Hostel = require("../hostel/hostel.model");
const User = require("../user/user.model");
const {
  sendComplaintAcknowledgmentEmail,
  sendComplaintResolutionEmail,
} = require("../../services/emailHelper");
const {
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  COMPLAINT_CATEGORY,
} = require("../../utils/constants");

/**
 * Complaint Controller
 * Handles complaint operations with email integration
 */

// Validation schemas
const createComplaintSchema = Joi.object({
  hostelId: Joi.string().required(),
  bookingId: Joi.string().optional(),
  title: Joi.string().max(200).required(),
  description: Joi.string().max(2000).required(),
  category: Joi.string().valid(...Object.values(COMPLAINT_CATEGORY)).required(),
  priority: Joi.string().valid(...Object.values(COMPLAINT_PRIORITY)).optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(COMPLAINT_STATUS)).required(),
});

const resolveSchema = Joi.object({
  resolutionNote: Joi.string().required(),
  rating: Joi.number().min(1).max(5).optional(),
  refundAmount: Joi.number().min(0).optional(),
});

const reassignSchema = Joi.object({
  staffId: Joi.string().required(),
});

const escalateSchema = Joi.object({
  newPriority: Joi.string().valid(...Object.values(COMPLAINT_PRIORITY)).required(),
});

const addNoteSchema = Joi.object({
  note: Joi.string().required(),
});

/**
 * CREATE - Create a new complaint
 * POST /api/v1/complaints
 */
const createComplaint = asyncHandler(async (req, res) => {
  const { error, value } = createComplaintSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, `Validation error: ${error.details[0].message}`);
  }

  const userId = req.user._id;
  const { hostelId, bookingId, title, description, category, priority, attachments } = value;

  // Check if hostel exists
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  // If booking ID provided, verify booking and user
  if (bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }
    if (booking.user.toString() !== userId.toString()) {
      throw new ApiError(403, "You can only complain about your own bookings");
    }
    if (booking.hostel.toString() !== hostelId) {
      throw new ApiError(400, "Booking does not match the hostel");
    }
  }

  // Create complaint
  const complaint = await Complaint.create({
    user: userId,
    hostel: hostelId,
    booking: bookingId || null,
    title,
    description,
    category,
    priority: priority || COMPLAINT_PRIORITY.MEDIUM,
    attachments: attachments || [],
    status: COMPLAINT_STATUS.OPEN,
  });

  await complaint.populate([
    { path: "user", select: "name email phone" },
    { path: "hostel", select: "name" },
    { path: "booking", select: "checkInDate checkOutDate" },
  ]);

  // Send acknowledgment email
  try {
    const user = await User.findById(userId);
    const complaintDetails = {
      complaintId: complaint._id,
      hostelName: hostel.name,
      category: complaint.category,
      priority: complaint.priority,
    };
    await sendComplaintAcknowledgmentEmail(user.email, user.name, complaintDetails);
  } catch (emailError) {
    logger.error(`Failed to send complaint acknowledgment email: ${emailError.message}`);
  }

  logger.info(`Complaint created: ${complaint._id} by user ${userId}`);

  return res.status(201).json(
    new ApiResponse(201, complaint, "Complaint created successfully")
  );
});

/**
 * READ - Get all complaints (with filters)
 * GET /api/v1/complaints
 * Query: status, priority, page, limit, hostelId, userId (admin only)
 */
const getComplaints = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { status, priority, page = 1, limit = 10, hostelId, userId: filterUserId } = req.query;

  const skip = (page - 1) * limit;
  let filter = {};

  // Authorization: Admin/Staff can see all, Users see only theirs
  if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole)) {
    filter.user = userId;
  } else if (filterUserId) {
    // Admin can filter by specific user
    filter.user = filterUserId;
  }

  if (status) {
    filter.status = status;
  }
  if (priority) {
    filter.priority = priority;
  }
  if (hostelId) {
    filter.hostel = hostelId;
  }

  const total = await Complaint.countDocuments(filter);
  const complaints = await Complaint.find(filter)
    .populate([
      { path: "user", select: "name email phone" },
      { path: "hostel", select: "name" },
      { path: "booking", select: "checkInDate checkOutDate" },
      { path: "handledBy", select: "name email" },
    ])
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, {
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, "Complaints retrieved successfully")
  );
});

/**
 * READ ONE - Get complaint by ID
 * GET /api/v1/complaints/:id
 */
const getComplaintById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  const complaint = await Complaint.findById(id).populate([
    { path: "user", select: "name email phone" },
    { path: "hostel", select: "name address contactEmail" },
    { path: "booking", select: "checkInDate checkOutDate" },
    { path: "handledBy", select: "name email" },
  ]);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Authorization check
  const isOwner = complaint.user._id.toString() === userId.toString();
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole);

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You do not have permission to view this complaint");
  }

  return res.status(200).json(
    new ApiResponse(200, complaint, "Complaint retrieved successfully")
  );
});

/**
 * UPDATE - Update complaint status
 * PATCH /api/v1/complaints/:id/status
 */
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { error, value } = updateStatusSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, `Validation error: ${error.details[0].message}`);
  }

  const { id } = req.params;
  const { status } = value;
  const userRole = req.user.role;

  // Only staff/admin can update status
  if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole)) {
    throw new ApiError(403, "Only staff can update complaint status");
  }

  const complaint = await Complaint.findByIdAndUpdate(
    id,
    { status, handledBy: req.user._id },
    { new: true, runValidators: true }
  ).populate([
    { path: "user", select: "name email" },
    { path: "hostel", select: "name" },
  ]);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  logger.info(`Complaint ${id} status updated to ${status} by ${req.user._id}`);

  return res.status(200).json(
    new ApiResponse(200, complaint, "Complaint status updated successfully")
  );
});

/**
 * UPDATE - Resolve complaint
 * PATCH /api/v1/complaints/:id/resolve
 */
const resolveComplaint = asyncHandler(async (req, res) => {
  const { error, value } = resolveSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, `Validation error: ${error.details[0].message}`);
  }

  const { id } = req.params;
  const { resolutionNote, rating, refundAmount } = value;
  const userRole = req.user.role;

  // Only staff/admin can resolve
  if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole)) {
    throw new ApiError(403, "Only staff can resolve complaints");
  }

  const complaint = await Complaint.findByIdAndUpdate(
    id,
    {
      status: COMPLAINT_STATUS.RESOLVED,
      resolutionNote,
      resolutionDate: new Date(),
      rating: rating || null,
      handledBy: req.user._id,
    },
    { new: true, runValidators: true }
  ).populate([
    { path: "user", select: "name email" },
    { path: "hostel", select: "name" },
  ]);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Send resolution email
  try {
    const user = await User.findById(complaint.user);
    const complaintDetails = {
      complaintId: complaint._id,
      resolutionNote,
      refundAmount: refundAmount || 0,
    };
    await sendComplaintResolutionEmail(user.email, user.name, complaintDetails);
  } catch (emailError) {
    logger.error(`Failed to send resolution email: ${emailError.message}`);
  }

  logger.info(`Complaint ${id} resolved by ${req.user._id}`);

  return res.status(200).json(
    new ApiResponse(200, complaint, "Complaint resolved successfully")
  );
});

/**
 * UPDATE - Reassign complaint to staff
 * PATCH /api/v1/complaints/:id/reassign
 */
const reassignComplaint = asyncHandler(async (req, res) => {
  const { error, value } = reassignSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, `Validation error: ${error.details[0].message}`);
  }

  const { id } = req.params;
  const { staffId } = value;
  const userRole = req.user.role;

  // Only admin can reassign
  if (!["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
    throw new ApiError(403, "Only managers can reassign complaints");
  }

  // Verify staff member exists
  const staff = await User.findById(staffId);
  if (!staff) {
    throw new ApiError(404, "Staff member not found");
  }

  const complaint = await Complaint.findByIdAndUpdate(
    id,
    { handledBy: staffId },
    { new: true }
  ).populate([
    { path: "user", select: "name email" },
    { path: "hostel", select: "name" },
    { path: "handledBy", select: "name email" },
  ]);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  logger.info(`Complaint ${id} reassigned to ${staffId}`);

  return res.status(200).json(
    new ApiResponse(200, complaint, "Complaint reassigned successfully")
  );
});

/**
 * UPDATE - Escalate complaint
 * PATCH /api/v1/complaints/:id/escalate
 */
const escalateComplaint = asyncHandler(async (req, res) => {
  const { error, value } = escalateSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, `Validation error: ${error.details[0].message}`);
  }

  const { id } = req.params;
  const { newPriority } = value;
  const userRole = req.user.role;

  // Staff can escalate
  if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole)) {
    throw new ApiError(403, "Only staff can escalate complaints");
  }

  const complaint = await Complaint.findByIdAndUpdate(
    id,
    { priority: newPriority, isEscalated: true },
    { new: true }
  ).populate([
    { path: "user", select: "name email" },
    { path: "hostel", select: "name" },
  ]);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  logger.info(`Complaint ${id} escalated to priority ${newPriority}`);

  return res.status(200).json(
    new ApiResponse(200, complaint, "Complaint escalated successfully")
  );
});

/**
 * UPDATE - Add internal note to complaint
 * PATCH /api/v1/complaints/:id/note
 */
const addComplaintNote = asyncHandler(async (req, res) => {
  const { error, value } = addNoteSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, `Validation error: ${error.details[0].message}`);
  }

  const { id } = req.params;
  const { note } = value;
  const userRole = req.user.role;

  // Only staff can add notes
  if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole)) {
    throw new ApiError(403, "Only staff can add notes to complaints");
  }

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Add note to a notes array if it exists, or create a new field
  await Complaint.findByIdAndUpdate(
    id,
    { 
      $push: { 
        internalNotes: { 
          note, 
          addedBy: req.user._id, 
          addedAt: new Date() 
        } 
      } 
    },
    { new: true }
  );

  logger.info(`Note added to complaint ${id} by ${req.user._id}`);

  return res.status(200).json(
    new ApiResponse(200, null, "Note added successfully")
  );
});

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  resolveComplaint,
  reassignComplaint,
  escalateComplaint,
  addComplaintNote,
};
