const Joi = require("joi");
const ApiError = require("../utils/ApiError");

/**
 * Validation Middleware Factory
 * Validates request body, query, or params against a schema
 */
const validate = (schema, options = {}) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
        ...options,
      }
    );

    if (error) {
      const messages = error.details.map((detail) => detail.message).join(", ");
      throw new ApiError(400, messages);
    }

    // Attach validated value to request
    req.validated = value;
    next();
  };
};

module.exports = validate;
