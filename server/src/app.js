const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const clean = require("xss-clean");
const hpp = require("hpp");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger");
const errorHandler = require("./middlewares/error.middleware");
const auditMiddleware = require("./middlewares/audit.middleware");
const { generalLimiter } = require("./middlewares/rateLimit.middleware");
const logger = require("./config/logger");

// Initialize Express app
const app = express();

// Trust proxy
app.set("trust proxy", 1);

// Security Middlewares
app.use(helmet());
app.use(mongoSanitize());
app.use(clean());
app.use(hpp());

// CORS Configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Request Logging
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg) } }));

// Rate Limiting
app.use(generalLimiter);

// Audit Middleware (logs all API requests)
app.use(auditMiddleware);

// Body Parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// API Routes
const apiVersion = process.env.API_VERSION || "v1";
const routes = require("./routes");
app.use(`/api/${apiVersion}`, routes);

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error Handling Middleware (Must be last)
app.use(errorHandler);

module.exports = app;
