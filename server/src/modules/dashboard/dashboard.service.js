const Booking = require("../booking/booking.model");
const Payment = require("../payment/payment.model");
const Review = require("../review/review.model");
const Complaint = require("../complaint/complaint.model");
const User = require("../user/user.model");
const Room = require("../room/room.model");
const Hostel = require("../hostel/hostel.model");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");

/**
 * Dashboard Service
 * Business logic for generating analytics and dashboard data
 */

/**
 * Get admin dashboard statistics
 */
const getAdminDashboard = async (startDate = null, endDate = null) => {
  try {
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Total Users
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments(query);

    // Total Hostels
    const totalHostels = await Hostel.countDocuments();
    const activeHostels = await Hostel.countDocuments({ isActive: true });

    // Booking Statistics
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({
      status: "checked-out",
    });
    const confirmedBookings = await Booking.countDocuments({
      status: "confirmed",
    });
    const cancelledBookings = await Booking.countDocuments({
      status: "cancelled",
    });

    // Revenue Statistics
    const revenues = await Payment.find({
      status: "completed",
      ...query,
    });

    const totalRevenue = revenues.reduce((sum, p) => sum + (p.amount || 0), 0);
    const revenueByProvider = {};
    revenues.forEach((p) => {
      if (!revenueByProvider[p.provider])
        revenueByProvider[p.provider] = 0;
      revenueByProvider[p.provider] += p.amount || 0;
    });

    // Complaint Statistics
    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({
      status: "resolved",
    });
    const pendingComplaints = await Complaint.countDocuments({
      status: { $in: ["open", "in-progress"] },
    });

    // Review Statistics
    const totalReviews = await Review.countDocuments();
    const avgRating = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);

    // Occupancy Rate
    const roomsData = await Room.aggregate([
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: "$capacity" },
          availableRooms: { $sum: "$availableRooms" },
        },
      },
    ]);

    const occupancyRate =
      roomsData.length > 0
        ? Math.round(
            ((roomsData[0].totalCapacity - roomsData[0].availableRooms) /
              roomsData[0].totalCapacity) *
              100
          )
        : 0;

    return {
      users: {
        total: totalUsers,
        new: newUsers,
      },
      hostels: {
        total: totalHostels,
        active: activeHostels,
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
        occupancyRate,
      },
      revenue: {
        total: totalRevenue,
        byProvider: revenueByProvider,
        transactionCount: revenues.length,
      },
      complaints: {
        total: totalComplaints,
        resolved: resolvedComplaints,
        pending: pendingComplaints,
        resolutionRate: totalComplaints > 0 
          ? Math.round((resolvedComplaints / totalComplaints) * 100)
          : 0,
      },
      reviews: {
        total: totalReviews,
        averageRating: avgRating.length > 0 ? avgRating[0].avgRating : 0,
      },
    };
  } catch (error) {
    logger.error(`Error generating admin dashboard: ${error.message}`);
    throw error;
  }
};

/**
 * Get host dashboard statistics
 */
const getHostDashboard = async (hostelId, startDate = null, endDate = null) => {
  try {
    const query = { hostel: hostelId };
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    // Hostel Info
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      throw new ApiError(404, "Hostel not found");
    }

    // Booking Statistics
    const totalBookings = await Booking.countDocuments({
      ...query,
      ...dateQuery,
    });
    const completedBookings = await Booking.countDocuments({
      ...query,
      status: "checked-out",
      ...dateQuery,
    });
    const currentBookings = await Booking.countDocuments({
      ...query,
      status: "checked-in",
    });

    // Revenue Statistics
    const revenues = await Payment.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "booking",
          foreignField: "_id",
          as: "booking",
        },
      },
      {
        $unwind: "$booking",
      },
      {
        $match: {
          "booking.hostel": hostelId,
          status: "completed",
          ...dateQuery,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenues.length > 0 ? revenues[0].totalRevenue : 0;
    const revenueTransactions = revenues.length > 0 ? revenues[0].count : 0;

    // Room Statistics
    const rooms = await Room.find({ hostel: hostelId });
    const totalRooms = rooms.length;
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const availableRoomsCount = rooms.reduce(
      (sum, room) => sum + room.availableRooms,
      0
    );

    // Reviews for this hostel
    const reviews = await Review.find({ hostel: hostelId });
    const avgRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        : 0;

    // Complaints for this hostel
    const complaints = await Complaint.find({ hostel: hostelId });
    const resolvedComplaints = complaints.filter(
      (c) => c.status === "resolved"
    ).length;

    // Occupancy Rate
    const occupiedRooms = totalCapacity - availableRoomsCount;
    const occupancyRate =
      totalCapacity > 0
        ? Math.round((occupiedRooms / totalCapacity) * 100)
        : 0;

    return {
      hostel: {
        name: hostel.name,
        address: hostel.address,
        rating: hostel.averageRating || 0,
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        current: currentBookings,
      },
      revenue: {
        total: totalRevenue,
        transactions: revenueTransactions,
        averagePerBooking:
          revenueTransactions > 0
            ? (totalRevenue / revenueTransactions).toFixed(2)
            : 0,
      },
      rooms: {
        total: totalRooms,
        available: availableRoomsCount,
        occupied: occupiedRooms,
        occupancyRate,
      },
      reviews: {
        total: reviews.length,
        averageRating: parseFloat(avgRating),
      },
      complaints: {
        total: complaints.length,
        resolved: resolvedComplaints,
        pending: complaints.length - resolvedComplaints,
      },
    };
  } catch (error) {
    logger.error(`Error generating host dashboard: ${error.message}`);
    throw error;
  }
};

/**
 * Get staff dashboard statistics
 */
const getStaffDashboard = async (staffId, hostelId = null) => {
  try {
    // Get staff assignments
    const assignedComplaints = await Complaint.countDocuments({
      assignedTo: staffId,
      status: { $in: ["open", "in-progress"] },
    });

    const resolvedComplaints = await Complaint.countDocuments({
      assignedTo: staffId,
      status: "resolved",
    });

    const pendingComplaints = await Complaint.countDocuments({
      assignedTo: staffId,
      status: "pending",
    });

    // Recent activities
    const recentComplaints = await Complaint.find({
      assignedTo: staffId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("filedBy", "name")
      .select("title status priority createdAt");

    // Complaints by priority
    const byPriority = {
      low: await Complaint.countDocuments({
        assignedTo: staffId,
        priority: "low",
      }),
      medium: await Complaint.countDocuments({
        assignedTo: staffId,
        priority: "medium",
      }),
      high: await Complaint.countDocuments({
        assignedTo: staffId,
        priority: "high",
      }),
      critical: await Complaint.countDocuments({
        assignedTo: staffId,
        priority: "critical",
      }),
    };

    return {
      complaints: {
        assigned: assignedComplaints,
        resolved: resolvedComplaints,
        pending: pendingComplaints,
        totalHandled: resolvedComplaints + assignedComplaints,
      },
      byPriority,
      recentActivities: recentComplaints,
      performanceMetrics: {
        resolutionRate:
          resolvedComplaints + assignedComplaints > 0
            ? Math.round(
                (resolvedComplaints / (resolvedComplaints + assignedComplaints)) *
                  100
              )
            : 0,
      },
    };
  } catch (error) {
    logger.error(`Error generating staff dashboard: ${error.message}`);
    throw error;
  }
};

/**
 * Get top performing hostels
 */
const getTopHostels = async (limit = 10) => {
  try {
    const topHostels = await Hostel.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "hostel",
          as: "bookings",
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "hostel",
          as: "reviews",
        },
      },
      {
        $project: {
          name: 1,
          address: 1,
          city: 1,
          bookingCount: { $size: "$bookings" },
          reviewCount: { $size: "$reviews" },
          averageRating: "$averageRating",
        },
      },
      {
        $sort: { bookingCount: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    return topHostels;
  } catch (error) {
    logger.error(`Error fetching top hostels: ${error.message}`);
    throw error;
  }
};

/**
 * Get booking trends
 */
const getBookingTrends = async (days = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, "$totalPrice", 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return trends;
  } catch (error) {
    logger.error(`Error fetching booking trends: ${error.message}`);
    throw error;
  }
};

/**
 * Get revenue trends
 */
const getRevenueTrends = async (days = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: "completed",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return trends;
  } catch (error) {
    logger.error(`Error fetching revenue trends: ${error.message}`);
    throw error;
  }
};

/**
 * Get user growth trends
 */
const getUserGrowthTrends = async (days = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          newUsers: { $sum: 1 },
          byRole: {
            $push: "$role",
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return trends;
  } catch (error) {
    logger.error(`Error fetching user growth trends: ${error.message}`);
    throw error;
  }
};

/**
 * Get system health metrics
 */
const getSystemHealthMetrics = async () => {
  try {
    const metrics = {
      activeBookings: await Booking.countDocuments({ status: "checked-in" }),
      activeUsers: await User.countDocuments({ accountStatus: "active" }),
      suspendedAccounts: await User.countDocuments({
        accountStatus: "suspended",
      }),
      pendingComplaints: await Complaint.countDocuments({
        status: { $in: ["open", "in-progress"] },
      }),
      failedPayments: await Payment.countDocuments({ status: "failed" }),
      lowInventoryRooms: await Room.countDocuments({ availableRooms: { $lte: 2 } }),
    };

    return metrics;
  } catch (error) {
    logger.error(`Error fetching system health metrics: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getAdminDashboard,
  getHostDashboard,
  getStaffDashboard,
  getTopHostels,
  getBookingTrends,
  getRevenueTrends,
  getUserGrowthTrends,
  getSystemHealthMetrics,
};
