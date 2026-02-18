const swaggerJsdoc = require("swagger-jsdoc");

/**
 * Swagger/OpenAPI Configuration
 * API Documentation
 */

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RoomLink API",
      description: "Hostel Booking and Management System API",
      version: "1.0.0",
      contact: {
        name: "RoomLink Team",
        email: "support@roomlink.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Development Server",
      },
      {
        url: "https://api.roomlink.com/api/v1",
        description: "Production Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.routes.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
