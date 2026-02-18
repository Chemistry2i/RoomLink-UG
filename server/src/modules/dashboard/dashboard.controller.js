const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const User = require("../user/user.model");
const Hostel = require("../hostel/hostel.model");
const Booking = require("../booking/booking.model");
const Complaint = require("../complaint/complaint.model");
const Payment = require("../payment/payment.model");
const Review = require("../review/review.model");
const logger = require("../../config/logger");

/**
 * Dashboard Controller
 * Returns analytics and operational metrics
 */

/**
 * GET - Admin Dashboard
 * Returns platform-wide metrics and statistics
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
  // Count total users by role
  const userStats = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalUsers = await User.countDocuments();
  const totalHostels = await Hostel.countDocuments();
  const totalBookings = await Booking.countDocuments();

  // Count bookings by status
  const bookingStats = await Booking.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Open complaints
  const openComplaints = await Complaint.countDocuments({ status: "open" });
  const highPriorityComplaints = await Complaint.countDocuments({ status: "open", priority: "high" });

  // Revenue calculation
  const payments = await Payment.aggregate([
    {
      $match: { status: "completed" },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  // Recent bookings
  const recentBookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("user", "name email")
    .populate("hostel", "name")
    .select("_id user hostel checkInDate checkOutDate status createdAt");

  // Average hostel rating
  const avgRating = await Hostel.aggregate([
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$averageRating" },
      },
    },
  ]);

  // Active vs inactive hostels
  const activeHostels = await Hostel.countDocuments({ accountStatus: "Active" });
  const inactiveHostels = await Hostel.countDocuments({ accountStatus: "Inactive" });

  const dashboard = {
    summary: {
      totalUsers,
      totalHostels,
      totalBookings,
      totalRevenue: payments[0]?.totalRevenue || 0,
      totalTransactions: payments[0]?.totalTransactions || 0,
    },
    users: {
      byRole: userStats,
      total: totalUsers,
    },
    bookings: {
      byStatus: bookingStats,
      total: totalBookings,
      recentCount: 5,
      recentBookings,
    },
    complaints: {
      openCount: openComplaints,
      highPriorityCount: highPriorityComplaints,
    },
    hostels: {
      active: activeHostels,
      inactive: inactiveHostels,
      avgRating: avgRating[0]?.averageRating || 0,
    },
  };

  logger.info(`Admin dashboard accessed by ${req.user._id}`);

  return res.status(200).json(
    new ApiResponse(200, dashboard, "Admin dashboard retrieved successfully")
  );
});

/**
 * GET - Host Dashboard
 * Returns metrics for a specific hostel owner
 */
const getHostDashboard = asyncHandler(async (req, res) => {
  const hostId = req.user._id;

  // Get all hostels for this host
  const hostels = await Hostel.find({ owner: hostId }).select("_id name totalReviews averageRating");

  if (hostels.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, {
        hostels: [],
        bookings: 0,
        revenue: 0,
        complaints: 0,
        avgOccupancy: 0,
        reviews: 0,
      }, "No hostels found for this host")
    );
  }

  const hostelIds = hostels.map((h) => h._id);

  // Count bookings for these hostels
  const totalBookings = await Booking.countDocuments({ hostel: { $in: hostelIds } });

  // Get booking stats
  const bookingStats = await Booking.aggregate([
    { $match: { hostel: { $in: hostelIds } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Calculate revenue from bookings
  const revenueData = await Booking.aggregate([
    {
      $match: { hostel: { $in: hostelIds }, status: { $in: ["completed", "checked_out"] } },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
  ]);

  // Get complaints for these hostels
  const totalComplaints = await Complaint.countDocuments({
    hostel: { $in: hostelIds },
  });

  const openComplaints = await Complaint.countDocuments({
    hostel: { $in: hostelIds },
    status: "open",
  });

  // Calculate overall occupancy rate
  const totalReviews = hostels.reduce((sum, h) => sum + (h.totalReviews || 0), 0);
  const avgRating = hostels.reduce((sum, h) => sum + h.averageRating, 0) / hostels.length || 0;

  // Recent complaints
  const recentComplaints = await Complaint.find({ hostel: { $in: hostelIds } })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("user", "name")
    .select("_id title category priority status createdAt");

  const dashboard = {
    hostels: hostels.length,
    bookings: {
      total: totalBookings,
      byStatus: bookingStats,
    },
    revenue: revenueData[0]?.totalRevenue || 0,
    complaints: {
      total: totalComplaints,
      open: openComplaints,
      recent: recentComplaints,
    },
    reviews: {
      total: totalReviews,
      avgRating: parseFloat(avgRating.toFixed(2)),
    },
  };

  logger.info(`Host dashboard accessed by ${hostId}`);

  return res.status(200).json(
    new ApiResponse(200, dashboard, "Host dashboard retrieved successfully")
  );
});

/**
 * GET - Staff Dashboard
 * Returns complaint management metrics for staff
 */
const getStaffDashboard = asyncHandler(async (req, res) => {
  const staffId = req.user._id;

  // Get complaints assigned to this staff member
  const assignedComplaints = await Complaint.countDocuments({ handledBy: staffId });

  // Open complaints assigned
  const openAssigned = await Complaint.countDocuments({
    handledBy: staffId,
    status: "open",
  });

  // In-progress complaints
  const inProgress = await Complaint.countDocuments({
    handledBy: staffId,
    status: "in-progress",
  });

  // Resolved complaints
  const resolvedCount = await Complaint.countDocuments({
    handledBy: staffId,
    status: "resolved",
  });

  // Get complaint stats by category
  const complaintsByCategory = await Complaint.aggregate([
    { $match: { handledBy: staffId } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get complaint stats by priority
  const complaintsByPriority = await Complaint.aggregate([
    { $match: { handledBy: staffId } },
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  // Calculate average resolution time (in days)
  const resolutionMetrics = await Complaint.aggregate([
    {
      $match: {
        handledBy: staffId,
        status: "resolved",
        resolutionDate: { $exists: true },
      },
    },
    {
      $project: {
        resolutionTime: {
          $divide: [
            { $subtract: ["$resolutionDate", "$createdAt"] },
            1000 * 60 * 60 * 24, // Convert to days
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgResolutionTime: { $avg: "$resolutionTime" },
        minResolutionTime: { $min: "$resolutionTime" },
        maxResolutionTime: { $max: "$resolutionTime" },
      },
    },
  ]);

  // Get recent complaints assigned to staff
  const recentComplaints = await Complaint.find({ handledBy: staffId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("user", "name")
    .populate("hostel", "name")
    .select("_id title category priority status createdAt");

  const dashboard = {
    assigned: assignedComplaints,
    status: {
      open: openAssigned,
      inProgress,
      resolved: resolvedCount,
    },
    byCategory: complaintsByCategory,
    byPriority: complaintsByPriority,
    metrics: {
      avgResolutionTime: resolutionMetrics[0]?.avgResolutionTime || 0,
      minResolutionTime: resolutionMetrics[0]?.minResolutionTime || 0,
      maxResolutionTime: resolutionMetrics[0]?.maxResolutionTime || 0,
    },
    recent: recentComplaints,
  };

  logger.info(`Staff dashboard accessed by ${staffId}`);

  return res.status(200).json(
    new ApiResponse(200, dashboard, "Staff dashboard retrieved successfully")
  );
});

module.exports = {
  getAdminDashboard,
  getHostDashboard,
  getStaffDashboard,
};
