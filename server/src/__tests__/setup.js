/**
 * Jest Setup File
 * Configure test environment and global variables
 */

// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.MONGODB_URI = "mongodb://localhost:27017/roomlink-test";
process.env.REDIS_URL = "redis://localhost:6379";

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock external services
jest.mock("../services/uploadService");
jest.mock("../services/paymentService");
jest.mock("../services/emailService");

// Suppress console logs during tests
if (process.env.DEBUG !== "true") {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

// Global test utilities
global.testUtils = {
  generateTestToken: (userId, role = "user") => {
    const jwt = require("jsonwebtoken");
    return jwt.sign(
      { id: userId, role, email: "test@example.com" },
      process.env.JWT_SECRET
    );
  },
};
