const redis = require("redis");
const logger = require("./logger");

// Build Redis connection URL for redis v4+
const redisUrl = `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB}`;

const client = redis.createClient({ url: redisUrl });

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
