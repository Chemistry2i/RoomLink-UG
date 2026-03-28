const mongoose = require("mongoose");
const logger = require("./logger");
const { config } = require("./env");
/**
 * Connect to MongoDB Atlas
 * Handles connection pooling and error scenarios
 */
const connectDB = async () => {
  try {
    const mongoURI = config.database.mongoURI;

    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      logger.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("error", (err) => {
      logger.error(`❌ MongoDB connection error: ${err.message}`);
    });

    return conn;
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
