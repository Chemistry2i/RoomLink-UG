/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors automatically
 * Eliminates need for try-catch in every route
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

module.exports = asyncHandler;
