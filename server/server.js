require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { validateEnv, config } = require("./src/config/env");
const logger = require("./src/config/logger");

// Validate environment variables at startup
try {
  validateEnv();
  logger.info("✅ Environment variables validated");
} catch (error) {
  logger.error(`❌ Environment validation failed: ${error.message}`);
  process.exit(1);
}

// Connect to database
connectDB().then(() => {
  logger.info("✅ Database connection established");
});

// Create server
const server = http.createServer(app);
const PORT = config.app.port;

// Start server
server.listen(PORT, () => {
  logger.info(
    `🚀 Server running on http://localhost:${PORT} in ${config.app.env} mode`
  );
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  logger.info("⚠️ SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("⚠️ SIGINT received. Shutting down gracefully...");
  server.close(() => {
    logger.info("✅ Server closed");
    process.exit(0);
  });
});

// Unhandled Exception Handler
process.on("uncaughtException", (error) => {
  logger.error(`❌ Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Unhandled Promise Rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`❌ Unhandled Rejection at ${promise}: ${reason}`);
});

module.exports = server;
