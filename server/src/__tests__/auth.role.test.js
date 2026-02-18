/**
 * Auth & Role-Based Access Control Tests
 * Tests role hierarchy, permissions, and account status checks
 */

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { ROLES, ACCOUNT_STATUS, STAFF_TYPES } = require("../utils/constants");

// Mock app - replace with actual app instance
const app = require("../../server");
const User = require("../modules/user/user.model");

describe("Auth & Role-Based Access Control", () => {
  let adminToken, hostToken, staffToken, userToken;
  let adminUser, hostUser, staffUser, regularUser;

  beforeAll(async () => {
    // Connect to test database
    // Note: This assumes you have a TEST_MONGODB_URI in your .env or test config
  });

  afterAll(async () => {
    // Clean up and disconnect
    await User.deleteMany({});
    // await mongoose.disconnect();
  });

  // ============================================================
  // USER REGISTRATION TESTS
  // ============================================================

  describe("User Registration", () => {
    it("should register a regular user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "1234567890",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe("john@example.com");
      expect(res.body.data.user.role).toBe(ROLES.USER);
    });

    it("should register a host user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Jane Host",
        email: "host@example.com",
        password: "password123",
        role: ROLES.HOST,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe(ROLES.HOST);
    });

    it("should require staffType when registering staff", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Staff User",
        email: "staff@example.com",
        password: "password123",
        role: ROLES.STAFF,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("staffType");
    });

    it("should validate staffType enum values", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Staff User",
        email: "staff@example.com",
        password: "password123",
        role: ROLES.STAFF,
        staffType: "INVALID_TYPE",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid staffType");
    });

    it("should register staff with valid staffType", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Manager Staff",
        email: "manager@example.com",
        password: "password123",
        role: ROLES.STAFF,
        staffType: STAFF_TYPES.MANAGER,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe(ROLES.STAFF);
    });

    it("should prevent duplicate email registration", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "John Doe 2",
        email: "john@example.com",
        password: "password123",
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("Email already registered");
    });
  });

  // ============================================================
  // LOGIN & ACCOUNT STATUS TESTS
  // ============================================================

  describe("User Login & Account Status", () => {
    beforeAll(async () => {
      // Create test users
      regularUser = await User.create({
        name: "Regular User",
        email: "user@example.com",
        password: "password123",
        role: ROLES.USER,
        isEmailVerified: true,
        accountStatus: "active",
      });

      staffUser = await User.create({
        name: "Staff Member",
        email: "staff@example.com",
        password: "password123",
        role: ROLES.STAFF,
        staffType: STAFF_TYPES.MANAGER,
        isEmailVerified: true,
        accountStatus: "active",
      });

      hostUser = await User.create({
        name: "Host User",
        email: "host@example.com",
        password: "password123",
        role: ROLES.HOST,
        isEmailVerified: true,
        accountStatus: "active",
      });

      adminUser = await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: ROLES.ADMIN,
        isEmailVerified: true,
        accountStatus: "active",
      });
    });

    it("should not allow login with unverified email", async () => {
      const unverifiedUser = await User.create({
        name: "Unverified User",
        email: "unverified@example.com",
        password: "password123",
        role: ROLES.USER,
        isEmailVerified: false,
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "unverified@example.com",
        password: "password123",
      });

      expect(res.status).toBe(403);
    });

    it("should successfully login active user and return token", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "user@example.com",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe("user@example.com");

      userToken = res.body.data.token;
    });

    it("should reject suspended accounts", async () => {
      const suspendedUser = await User.create({
        name: "Suspended User",
        email: "suspended@example.com",
        password: "password123",
        role: ROLES.USER,
        isEmailVerified: true,
        accountStatus: "suspended",
        suspendedAt: new Date(),
        suspendReason: "Violation of terms",
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "suspended@example.com",
        password: "password123",
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("suspended");
    });

    it("should reject locked accounts", async () => {
      const lockedUser = await User.create({
        name: "Locked User",
        email: "locked@example.com",
        password: "password123",
        role: ROLES.USER,
        isEmailVerified: true,
        accountStatus: "locked",
        lockoutUntil: new Date(Date.now() + 30 * 60 * 1000),
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "locked@example.com",
        password: "password123",
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("locked");
    });

    it("should implement brute force protection (5 failed login attempts)", async () => {
      // First 4 failed attempts
      for (let i = 0; i < 4; i++) {
        await request(app).post("/api/auth/login").send({
          email: "user@example.com",
          password: "wrongpassword",
        });
      }

      // 5th failed attempt should lock account
      const res = await request(app).post("/api/auth/login").send({
        email: "user@example.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("locked");

      // Verify user is actually locked
      const user = await User.findById(regularUser._id);
      expect(user.accountStatus).toBe("locked");
    });
  });

  // ============================================================
  // ROLE-BASED ACCESS CONTROL TESTS
  // ============================================================

  describe("Role-Based Access Control", () => {
    it("user should not access admin endpoints", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("staff user should have assigned hostels array", async () => {
      const staff = await User.findOne({ role: ROLES.STAFF });
      expect(Array.isArray(staff.assignedHostels)).toBe(true);
    });

    it("regular user should not have staffType", async () => {
      const user = await User.findOne({ role: ROLES.USER });
      expect(user.staffType).toBeNull();
    });
  });

  // ============================================================
  // ACCOUNT MANAGEMENT TESTS
  // ============================================================

  describe("User Account Management", () => {
    it("admin should suspend user", async () => {
      const res = await request(app)
        .post(`/api/users/${regularUser._id}/suspend`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reason: "Violation of community guidelines",
        });

      expect(res.status).toBe(200);

      const user = await User.findById(regularUser._id);
      expect(user.accountStatus).toBe("suspended");
      expect(user.suspendReason).toBe("Violation of community guidelines");
    });

    it("admin should unsuspend user", async () => {
      const res = await request(app)
        .post(`/api/users/${regularUser._id}/unsuspend`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const user = await User.findById(regularUser._id);
      expect(user.accountStatus).toBe("active");
    });

    it("should prevent suspending admin users", async () => {
      const res = await request(app)
        .post(`/api/users/${adminUser._id}/suspend`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reason: "Test",
        });

      expect(res.status).toBe(403);
    });
  });

  // ============================================================
  // STAFF MANAGEMENT TESTS
  // ============================================================

  describe("Staff Management", () => {
    let hostelId = new mongoose.Types.ObjectId();

    it("should assign staff to hostel", async () => {
      const res = await request(app)
        .post(`/api/users/${staffUser._id}/assign-hostel`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          hostelId: hostelId.toString(),
          startDate: new Date(),
        });

      expect(res.status).toBe(200);

      const user = await User.findById(staffUser._id);
      expect(user.assignedHostels.length).toBeGreaterThan(0);
      expect(user.assignedHostels[0].hostelId.toString()).toBe(hostelId.toString());
    });

    it("should prevent assigning non-staff users to hostels", async () => {
      const res = await request(app)
        .post(`/api/users/${regularUser._id}/assign-hostel`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          hostelId: hostelId.toString(),
        });

      expect(res.status).toBe(400);
    });

    it("should remove staff from hostel", async () => {
      const res = await request(app)
        .post(`/api/users/${staffUser._id}/remove-hostel`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          hostelId: hostelId.toString(),
        });

      expect(res.status).toBe(200);

      const user = await User.findById(staffUser._id);
      expect(user.assignedHostels.length).toBe(0);
    });
  });

  // ============================================================
  // 2FA TESTS
  // ============================================================

  describe("Two-Factor Authentication", () => {
    it("user should setup 2FA", async () => {
      const res = await request(app)
        .post("/api/auth/2fa/setup")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.secret).toBeDefined();
      expect(res.body.data.qrCode).toBeDefined();
    });

    it("should prevent enabling 2FA twice", async () => {
      const user = await User.findByIdAndUpdate(
        regularUser._id,
        { twoFactorEnabled: true, twoFactorSecret: "test-secret" },
        { new: true }
      );

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "your-secret-key"
      );

      const res = await request(app)
        .post("/api/auth/2fa/setup")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  // ============================================================
  // PASSWORD MANAGEMENT TESTS
  // ============================================================

  describe("Password Management", () => {
    it("user should change password", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          oldPassword: "password123",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        });

      expect(res.status).toBe(200);
    });

    it("should reject incorrect old password", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          oldPassword: "wrongpassword",
          newPassword: "anotherpassword123",
          confirmPassword: "anotherpassword123",
        });

      expect(res.status).toBe(401);
    });
  });
});
