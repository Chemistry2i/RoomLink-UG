const Complaint = require("./complaint.model");
const Booking = require("../booking/booking.model");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");

/**
 * Complaint Service
 * Business logic for complaint management and workflow
 */

/**
 * Create complaint
 */
const createComplaint = async (complaintData) => {
  try {
    const complaint = await Complaint.create(complaintData);

    logger.info(`Complaint created: ${complaint._id}`);
    return complaint;
  } catch (error) {
    logger.error(`Error creating complaint: ${error.message}`);
    throw error;
  }
};

/**
 * Get complaints with filters and pagination
 */
const getComplaints = async (filters = {}, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.category) query.category = filters.category;
    if (filters.hostel) query.hostel = filters.hostel;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    const complaints = await Complaint.find(query)
      .populate("filedBy", "name email phone")
      .populate("hostel", "name")
      .populate("assignedTo", "name staffType")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Complaint.countDocuments(query);

    return {
      complaints,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error fetching complaints: ${error.message}`);
    throw error;
  }
};

/**
 * Get complaint by ID
 */
const getComplaintById = async (complaintId) => {
  try {
    const complaint = await Complaint.findById(complaintId)
      .populate("filedBy", "name email phone")
      .populate("hostel", "name manager")
      .populate("assignedTo", "name staffType email")
      .populate("resolvedBy", "name staffType");

    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    return complaint;
  } catch (error) {
    logger.error(`Error fetching complaint: ${error.message}`);
    throw error;
  }
};

/**
 * Update complaint status
 */
const updateComplaintStatus = async (complaintId, status, notes = "") => {
  try {
    const validStatuses = ["open", "in-progress", "pending", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, "Invalid complaint status");
    }

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { status, lastUpdated: new Date() },
      { new: true }
    );

    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    // Add status change to notes
    if (notes) {
      complaint.notes.push({
        addedBy: "system",
        content: `Status changed to ${status}. ${notes}`,
        timestamp: new Date(),
      });
      await complaint.save();
    }

    logger.info(`Complaint status updated: ${complaintId} -> ${status}`);
    return complaint;
  } catch (error) {
    logger.error(`Error updating complaint status: ${error.message}`);
    throw error;
  }
};

/**
 * Resolve complaint
 */
const resolveComplaint = async (complaintId, resolutionNotes, resolvedById) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      {
        status: "resolved",
        resolvedBy: resolvedById,
        resolvedAt: new Date(),
        resolutionNotes,
      },
      { new: true }
    );

    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    logger.info(`Complaint resolved: ${complaintId}`);
    return complaint;
  } catch (error) {
    logger.error(`Error resolving complaint: ${error.message}`);
    throw error;
  }
};

/**
 * Close complaint
 */
const closeComplaint = async (complaintId, feedback = "") => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      {
        status: "closed",
        closedAt: new Date(),
        userFeedback: feedback,
      },
      { new: true }
    );

    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    logger.info(`Complaint closed: ${complaintId}`);
    return complaint;
  } catch (error) {
    logger.error(`Error closing complaint: ${error.message}`);
    throw error;
  }
};

/**
 * Assign complaint to staff
 */
const assignComplaint = async (complaintId, staffId) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { assignedTo: staffId, status: "in-progress" },
      { new: true }
    ).populate("assignedTo", "name staffType email");

    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    logger.info(`Complaint assigned: ${complaintId} to ${staffId}`);
    return complaint;
  } catch (error) {
    logger.error(`Error assigning complaint: ${error.message}`);
    throw error;
  }
};

/**
 * Reassign complaint
 */
const reassignComplaint = async (complaintId, newStaffId) => {
  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    const oldStaffId = complaint.assignedTo;
    complaint.assignedTo = newStaffId;
    complaint.reassignmentHistory.push({
      fromStaff: oldStaffId,
      toStaff: newStaffId,
      reassignedAt: new Date(),
    });

    await complaint.save();

    logger.info(`Complaint reassigned: ${complaintId} from ${oldStaffId} to ${newStaffId}`);
    return complaint;
  } catch (error) {
    logger.error(`Error reassigning complaint: ${error.message}`);
    throw error;
  }
};

/**
 * Escalate complaint priority
 */
const escalateComplaint = async (complaintId, reason) => {
  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    const priorityLevels = ["low", "medium", "high", "critical"];
    const currentPriority = complaint.priority;
    const currentIndex = priorityLevels.indexOf(currentPriority);

    if (currentIndex >= priorityLevels.length - 1) {
      throw new ApiError(400, "Complaint is already at highest priority");
    }

    complaint.priority = priorityLevels[currentIndex + 1];
    complaint.escalationHistory.push({
      escalatedAt: new Date(),
      fromPriority: currentPriority,
      toPriority: complaint.priority,
      reason,
    });

    await complaint.save();

    logger.info(
      `Complaint escalated: ${complaintId} from ${currentPriority} to ${complaint.priority}`
    );
    return complaint;
  } catch (error) {
    logger.error(`Error escalating complaint: ${error.message}`);
    throw error;
  }
};

/**
 * Add note to complaint
 */
const addComplaintNote = async (complaintId, note, addedById) => {
  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new ApiError(404, "Complaint not found");
    }

    if (!complaint.notes) {
      complaint.notes = [];
    }

    complaint.notes.push({
      addedBy: addedById,
      content: note,
      timestamp: new Date(),
    });

    await complaint.save();

    logger.info(`Note added to complaint: ${complaintId}`);
    return complaint;
  } catch (error) {
    logger.error(`Error adding note to complaint: ${error.message}`);
    throw error;
  }
};

/**
 * Get complaint statistics
 */
const getComplaintStats = async (hostelId = null) => {
  try {
    const query = hostelId ? { hostel: hostelId } : {};

    const stats = {
      totalComplaints: await Complaint.countDocuments(query),
      byStatus: {
        open: await Complaint.countDocuments({ ...query, status: "open" }),
        inProgress: await Complaint.countDocuments({
          ...query,
          status: "in-progress",
        }),
        resolved: await Complaint.countDocuments({
          ...query,
          status: "resolved",
        }),
        closed: await Complaint.countDocuments({ ...query, status: "closed" }),
      },
      byPriority: {
        low: await Complaint.countDocuments({ ...query, priority: "low" }),
        medium: await Complaint.countDocuments({ ...query, priority: "medium" }),
        high: await Complaint.countDocuments({ ...query, priority: "high" }),
        critical: await Complaint.countDocuments({
          ...query,
          priority: "critical",
        }),
      },
      avgResolutionTime: 0,
    };

    // Calculate average resolution time
    const resolvedComplaints = await Complaint.find({
      ...query,
      status: "resolved",
      resolvedAt: { $exists: true },
    });

    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, complaint) => {
        const time =
          new Date(complaint.resolvedAt) - new Date(complaint.createdAt);
        return sum + time;
      }, 0);

      stats.avgResolutionTime = Math.round(
        totalTime / resolvedComplaints.length / (1000 * 60 * 60)
      ); // in hours
    }

    return stats;
  } catch (error) {
    logger.error(`Error calculating complaint stats: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  resolveComplaint,
  closeComplaint,
  assignComplaint,
  reassignComplaint,
  escalateComplaint,
  addComplaintNote,
  getComplaintStats,
};
