const redis = require("redis");
const logger = require("./logger");

// Create Redis client
const client = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
});

// Event handlers
client.on("connect", () => {
  logger.info("✅ Redis Client Connected");
});

client.on("error", (err) => {
  logger.error(`❌ Redis Client Error: ${err.message}`);
});

client.on("end", () => {
  logger.warn("⚠️ Redis Client Disconnected");
});

// Connect to Redis
client.connect().catch((err) => {
  logger.error(`❌ Redis Connection Error: ${err.message}`);
});

module.exports = client;
