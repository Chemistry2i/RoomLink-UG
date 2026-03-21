const PDFDocument = require("pdfkit");
const json2csv = require("json2csv");
const Booking = require("../booking/booking.model");
const Payment = require("../payment/payment.model");
const Complaint = require("../complaint/complaint.model");
const Review = require("../review/review.model");
const User = require("../user/user.model");
const Room = require("../room/room.model");
const Hostel = require("../hostel/hostel.model");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");

/**
 * Report Service
 * Business logic for generating PDF and CSV reports
 */

/**
 * Generate booking report (PDF)
 */
const generateBookingReportPDF = async (filters = {}) => {
  try {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.hostel) query.hostel = filters.hostel;
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom)
        query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    const bookings = await Booking.find(query)
      .populate("room", "roomNumber roomType")
      .populate("hostel", "name address")
      .populate("guest", "name email phone");

    const doc = new PDFDocument();
    const filename = `booking_report_${Date.now()}.pdf`;

    doc.fontSize(20).text("Booking Report", { align: "center" });
    doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, {
      align: "center",
    });
    doc.moveDown();

    doc.fontSize(14).text("Summary", { underline: true });
    doc.fontSize(11).text(`Total Bookings: ${bookings.length}`);
    doc
      .text(
        `Confirmed: ${bookings.filter((b) => b.status === "confirmed").length}`
      )
      .text(
        `Checked-in: ${bookings.filter((b) => b.status === "checked-in").length}`
      )
      .text(
        `Checked-out: ${bookings.filter((b) => b.status === "checked-out").length}`
      )
      .text(
        `Cancelled: ${bookings.filter((b) => b.status === "cancelled").length}`
      );

    doc.moveDown();
    doc.fontSize(14).text("Detailed Records", { underline: true });

    // Table header
    const x = 50;
    const y = doc.y;
    doc
      .fontSize(10)
      .text("Booking ID", x, y)
      .text("Guest", x + 100)
      .text("Room", x + 200)
      .text("Check-In", x + 270)
      .text("Status", x + 350);

    doc.moveTo(x, y + 15).lineTo(500, y + 15).stroke();

    let currentY = y + 20;
    bookings.forEach((booking) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const bookingId = booking._id.toString().substring(0, 8);
      const guestName = booking.guest?.name || "N/A";
      const roomNum = booking.room?.roomNumber || "N/A";
      const checkIn = new Date(booking.checkInDate)
        .toLocaleDateString();
      const status = booking.status;

      doc
        .fontSize(9)
        .text(bookingId, x, currentY)
        .text(guestName, x + 100)
        .text(roomNum, x + 200)
        .text(checkIn, x + 270)
        .text(status, x + 350);

      currentY += 15;
    });

    logger.info(`Booking report generated: ${filename}`);
    return { doc, filename };
  } catch (error) {
    logger.error(`Error generating booking PDF: ${error.message}`);
    throw error;
  }
};

/**
 * Generate revenue report (PDF)
 */
const generateRevenueReportPDF = async (filters = {}) => {
  try {
    const query = { status: "completed" };
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom)
        query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    const payments = await Payment.find(query)
      .populate("user", "name email")
      .populate("booking", "bookingNumber");

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const revenueByProvider = {};
    payments.forEach((p) => {
      if (!revenueByProvider[p.provider])
        revenueByProvider[p.provider] = 0;
      revenueByProvider[p.provider] += p.amount || 0;
    });

    const doc = new PDFDocument();
    const filename = `revenue_report_${Date.now()}.pdf`;

    doc.fontSize(20).text("Revenue Report", { align: "center" });
    doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, {
      align: "center",
    });
    doc.moveDown();

    doc.fontSize(14).text("Summary", { underline: true });
    doc.fontSize(11).text(`Total Revenue: KES ${totalRevenue.toFixed(2)}`);
    doc.text(`Transaction Count: ${payments.length}`);
    doc.text(
      `Average per Transaction: KES ${(totalRevenue / payments.length).toFixed(2)}`
    );

    doc.moveDown();
    doc.fontSize(14).text("Revenue by Provider", { underline: true });
    Object.entries(revenueByProvider).forEach(([provider, amount]) => {
      doc.fontSize(11).text(`${provider}: KES ${amount.toFixed(2)}`);
    });

    logger.info(`Revenue report generated: ${filename}`);
    return { doc, filename };
  } catch (error) {
    logger.error(`Error generating revenue PDF: ${error.message}`);
    throw error;
  }
};

/**
 * Generate complaint report (PDF)
 */
const generateComplaintReportPDF = async (filters = {}) => {
  try {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.hostel) query.hostel = filters.hostel;

    const complaints = await Complaint.find(query)
      .populate("filedBy", "name email")
      .populate("hostel", "name");

    const doc = new PDFDocument();
    const filename = `complaint_report_${Date.now()}.pdf`;

    doc.fontSize(20).text("Complaint Report", { align: "center" });
    doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, {
      align: "center",
    });
    doc.moveDown();

    doc.fontSize(14).text("Summary", { underline: true });
    doc.fontSize(11).text(`Total Complaints: ${complaints.length}`);
    doc.text(
      `Resolved: ${complaints.filter((c) => c.status === "resolved").length}`
    );
    doc.text(
      `Pending: ${complaints.filter((c) => c.status !== "resolved").length}`
    );

    // By Priority
    const byPriority = {}["low"] = 0;
    byPriority["medium"] = 0;
    byPriority["high"] = 0;
    byPriority["critical"] = 0;
    complaints.forEach((c) => {
      byPriority[c.priority]++;
    });

    doc.moveDown();
    doc.fontSize(12).text("By Priority:", { underline: true });
    Object.entries(byPriority).forEach(([priority, count]) => {
      doc.fontSize(10).text(`${priority}: ${count}`);
    });

    logger.info(`Complaint report generated: ${filename}`);
    return { doc, filename };
  } catch (error) {
    logger.error(`Error generating complaint PDF: ${error.message}`);
    throw error;
  }
};

/**
 * Generate bookings CSV
 */
const generateBookingsCSV = async (filters = {}) => {
  try {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.hostel) query.hostel = filters.hostel;

    const bookings = await Booking.find(query)
      .populate("room", "roomNumber roomType pricePerNight")
      .populate("hostel", "name address")
      .populate("guest", "name email phone")
      .lean();

    const csvData = bookings.map((booking) => ({
      "Booking ID": booking._id.toString(),
      "Guest Name": booking.guest?.name || "N/A",
      "Guest Email": booking.guest?.email || "N/A",
      "Hostel": booking.hostel?.name || "N/A",
      "Room": booking.room?.roomNumber || "N/A",
      "Room Type": booking.room?.roomType || "N/A",
      "Check-In": new Date(booking.checkInDate).toLocaleDateString(),
      "Check-Out": new Date(booking.checkOutDate).toLocaleDateString(),
      "Total Price": booking.totalPrice || 0,
      "Status": booking.status,
      "Created": new Date(booking.createdAt).toLocaleString(),
    }));

    const csv = json2csv.parse(csvData);
    const filename = `bookings_${Date.now()}.csv`;

    logger.info(`Bookings CSV generated: ${filename}`);
    return { csv, filename };
  } catch (error) {
    logger.error(`Error generating bookings CSV: ${error.message}`);
    throw error;
  }
};

/**
 * Generate payments/revenue CSV
 */
const generatePaymentsCSV = async (filters = {}) => {
  try {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.provider) query.provider = filters.provider;

    const payments = await Payment.find(query)
      .populate("user", "name email")
      .populate("booking", "bookingNumber")
      .lean();

    const csvData = payments.map((payment) => ({
      "Transaction ID": payment.transactionId,
      "User": payment.user?.name || "N/A",
      "Email": payment.user?.email || "N/A",
      "Amount": payment.amount,
      "Provider": payment.provider,
      "Status": payment.status,
      "Currency": payment.currency,
      "Created": new Date(payment.createdAt).toLocaleString(),
    }));

    const csv = json2csv.parse(csvData);
    const filename = `payments_${Date.now()}.csv`;

    logger.info(`Payments CSV generated: ${filename}`);
    return { csv, filename };
  } catch (error) {
    logger.error(`Error generating payments CSV: ${error.message}`);
    throw error;
  }
};

/**
 * Generate complaints CSV
 */
const generateComplaintsCSV = async (filters = {}) => {
  try {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;

    const complaints = await Complaint.find(query)
      .populate("filedBy", "name email")
      .populate("hostel", "name")
      .populate("assignedTo", "name")
      .lean();

    const csvData = complaints.map((complaint) => ({
      "Complaint ID": complaint._id.toString(),
      "Title": complaint.title,
      "Category": complaint.category,
      "Priority": complaint.priority,
      "Status": complaint.status,
      "Filed By": complaint.filedBy?.name || "N/A",
      "Assigned To": complaint.assignedTo?.name || "Unassigned",
      "Hostel": complaint.hostel?.name || "N/A",
      "Description": complaint.description,
      "Created": new Date(complaint.createdAt).toLocaleString(),
      "Resolved": complaint.resolvedAt
        ? new Date(complaint.resolvedAt).toLocaleString()
        : "N/A",
    }));

    const csv = json2csv.parse(csvData);
    const filename = `complaints_${Date.now()}.csv`;

    logger.info(`Complaints CSV generated: ${filename}`);
    return { csv, filename };
  } catch (error) {
    logger.error(`Error generating complaints CSV: ${error.message}`);
    throw error;
  }
};

/**
 * Generate reviews CSV
 */
const generateReviewsCSV = async (filters = {}) => {
  try {
    const query = {};
    if (filters.room) query.room = filters.room;
    if (filters.minRating) query.rating = { $gte: filters.minRating };

    const reviews = await Review.find(query)
      .populate("guest", "name email")
      .populate("room", "roomNumber")
      .populate("hostel", "name")
      .lean();

    const csvData = reviews.map((review) => ({
      "Review ID": review._id.toString(),
      "Guest": review.guest?.name || "N/A",
      "Hostel": review.hostel?.name || "N/A",
      "Room": review.room?.roomNumber || "N/A",
      "Overall Rating": review.rating,
      "Cleanliness": review.cleanliness || "N/A",
      "Comfort": review.comfort || "N/A",
      "Value for Money": review.valueForMoney || "N/A",
      "Title": review.title || "",
      "Comment": review.comment || "",
      "Created": new Date(review.createdAt).toLocaleString(),
    }));

    const csv = json2csv.parse(csvData);
    const filename = `reviews_${Date.now()}.csv`;

    logger.info(`Reviews CSV generated: ${filename}`);
    return { csv, filename };
  } catch (error) {
    logger.error(`Error generating reviews CSV: ${error.message}`);
    throw error;
  }
};

/**
 * Generate users/member report CSV
 */
const generateUsersCSV = async (filters = {}) => {
  try {
    const query = {};
    if (filters.role) query.role = filters.role;
    if (filters.accountStatus) query.accountStatus = filters.accountStatus;

    const users = await User.find(query).lean();

    const csvData = users.map((user) => ({
      "User ID": user._id.toString(),
      "Name": user.name,
      "Email": user.email,
      "Phone": user.phone || "N/A",
      "Role": user.role,
      "Staff Type": user.staffType || "N/A",
      "Account Status": user.accountStatus,
      "Email Verified": user.isEmailVerified ? "Yes" : "No",
      "Created": new Date(user.createdAt).toLocaleString(),
    }));

    const csv = json2csv.parse(csvData);
    const filename = `users_${Date.now()}.csv`;

    logger.info(`Users CSV generated: ${filename}`);
    return { csv, filename };
  } catch (error) {
    logger.error(`Error generating users CSV: ${error.message}`);
    throw error;
  }
};

/**
 * Generate hostel performance report CSV
 */
const generateHostelPerformanceCSV = async () => {
  try {
    const hostels = await Hostel.find().lean();

    const csvData = await Promise.all(
      hostels.map(async (hostel) => {
        const bookings = await Booking.countDocuments({ hostel: hostel._id });
        const revenue = await Payment.aggregate([
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
              "booking.hostel": hostel._id,
              status: "completed",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]);

        const reviews = await Review.countDocuments({ hostel: hostel._id });
        const avgRating = await Review.aggregate([
          { $match: { hostel: hostel._id } },
          {
            $group: {
              _id: null,
              avg: { $avg: "$rating" },
            },
          },
        ]);

        return {
          "Hostel Name": hostel.name,
          "City": hostel.city,
          "Total Bookings": bookings,
          "Total Revenue": revenue.length > 0 ? revenue[0].total : 0,
          "Average Rating": avgRating.length > 0 ? avgRating[0].avg.toFixed(1) : "N/A",
          "Total Reviews": reviews,
          "Created": new Date(hostel.createdAt).toLocaleString(),
        };
      })
    );

    const csv = json2csv.parse(csvData);
    const filename = `hostel_performance_${Date.now()}.csv`;

    logger.info(`Hostel performance CSV generated: ${filename}`);
    return { csv, filename };
  } catch (error) {
    logger.error(`Error generating hostel performance CSV: ${error.message}`);
    throw error;
  }
};

/**
 * Generate combined dashboard report
 */
const generateDashboardReportPDF = async (adminStats) => {
  try {
    const doc = new PDFDocument();
    const filename = `dashboard_report_${Date.now()}.pdf`;

    doc.fontSize(20).text("System Dashboard Report", { align: "center" });
    doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, {
      align: "center",
    });
    doc.moveDown();

    doc.fontSize(14).text("Key Metrics", { underline: true });
    doc.fontSize(11);
    doc.text(`Total Users: ${adminStats.users.total}`);
    doc.text(`Active Hostels: ${adminStats.hostels.active}`);
    doc.text(`Total Bookings: ${adminStats.bookings.total}`);
    doc.text(`Total Revenue: KES ${adminStats.revenue.total.toFixed(2)}`);
    doc.text(`Occupancy Rate: ${adminStats.bookings.occupancyRate}%`);
    doc.text(`Total Reviews: ${adminStats.reviews.total}`);
    doc.text(
      `Average Rating: ${adminStats.reviews.averageRating.toFixed(1)}`
    );

    doc.moveDown();
    doc.fontSize(14).text("Complaint Metrics", { underline: true });
    doc.fontSize(11);
    doc.text(`Total Complaints: ${adminStats.complaints.total}`);
    doc.text(`Resolved: ${adminStats.complaints.resolved}`);
    doc.text(`Pending: ${adminStats.complaints.pending}`);
    doc.text(
      `Resolution Rate: ${adminStats.complaints.resolutionRate}%`
    );

    logger.info(`Dashboard report generated: ${filename}`);
    return { doc, filename };
  } catch (error) {
    logger.error(`Error generating dashboard PDF: ${error.message}`);
    throw error;
  }
};

module.exports = {
  generateBookingReportPDF,
  generateRevenueReportPDF,
  generateComplaintReportPDF,
  generateBookingsCSV,
  generatePaymentsCSV,
  generateComplaintsCSV,
  generateReviewsCSV,
  generateUsersCSV,
  generateHostelPerformanceCSV,
  generateDashboardReportPDF,
};
