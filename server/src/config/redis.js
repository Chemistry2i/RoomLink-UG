const redis = require("redis");
const logger = require("./logger");

// Build Redis connection URL for redis v4+
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD;
const redisDb = process.env.REDIS_DB || 0;

let redisUrl;
if (redisPassword) {
  redisUrl = `redis://default:${redisPassword}@${redisHost}:${redisPort}/${redisDb}`;
} else {
  redisUrl = `redis://${redisHost}:${redisPort}/${redisDb}`;
}

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
