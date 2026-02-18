const redisClient = require("../config/redis");
const { CACHE_TTL } = require("../utils/constants");

/**
 * Cache Middleware
 * Caches GET responses in Redis
 */
const cache = (ttl = CACHE_TTL.MEDIUM) => {
  return async (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    try {
      const cacheKey = `${req.originalUrl}`;
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Store original send function
      const originalSend = res.json;

      // Override json method to cache response
      res.json = function (data) {
        void redisClient.setEx(cacheKey, ttl, JSON.stringify(data));
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      // If cache fails, continue without caching
      next();
    }
  };
};

/**
 * Invalidate Cache Middleware
 * Clears relevant cache entries when data changes
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.json;

    // Override json method to invalidate cache after response
    res.json = function (data) {
      if (res.statusCode < 400) {
        void invalidateCachePattern(pattern);
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Helper function to invalidate cache by pattern
 */
const invalidateCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    // Log error but don't throw
    console.error("Cache invalidation error:", error);
  }
};

module.exports = {
  cache,
  invalidateCache,
  invalidateCachePattern,
};
