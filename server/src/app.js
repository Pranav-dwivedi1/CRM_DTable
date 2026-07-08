require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const leadRoutes = require("./routes/leadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const companyRoutes = require("./routes/companyRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

const app = express();

// Security middle-tier
app.use(helmet());

// CORS Configuration - CRITICAL: Must be before routes for cookie handling
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true, // Allow credentials (cookies, auth headers)
};

if (process.env.NODE_ENV !== "test") {
  console.log(`[APP_INIT] CORS Configuration:`, {
    origin: corsOptions.origin,
    credentials: corsOptions.credentials,
  });
}

app.use(cors(corsOptions));
app.use(mongoSanitize());
app.use(express.json());

// Cookie Parser - CRITICAL: Must be before routes for cookie parsing
if (process.env.NODE_ENV !== "test") {
  console.log(`[APP_INIT] Cookie Parser enabled`);
}
app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  console.log(`[APP_INIT] Environment:`, {
    nodeEnv: process.env.NODE_ENV,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET
      ? "***configured***"
      : "NOT_SET",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET
      ? "***configured***"
      : "NOT_SET",
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  });
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CRM Backend Running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
  });
});


// Route mapping
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/meetings", meetingRoutes);

// Fallback 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Resource not found" });
});

// Centralized error boundary
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.error(err.stack);
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
