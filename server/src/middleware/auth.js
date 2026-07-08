const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (process.env.NODE_ENV !== "test") {
    console.log(`[PROTECT] Incoming request to ${req.path}`, {
      hasAuthHeader: !!req.headers.authorization,
      hasToken: !!token,
      tokenLastChars: token ? "..." + token.slice(-8) : "N/A",
      secret: process.env.JWT_ACCESS_SECRET ? "***configured***" : "NOT_SET",
    });
  }

  if (!token) {
    if (process.env.NODE_ENV !== "test") {
      console.error(`[PROTECT] ERROR: No token found in Authorization header`);
    }
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, token missing" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (process.env.NODE_ENV !== "test") {
      console.log(`[PROTECT] Token verified successfully`, {
        userId: decoded.id,
        role: decoded.role,
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
      });
    }

    // Fetch user - bypass tenant plugin lookup since store context isn't running yet
    const user = await User.findById(decoded.id).setOptions({
      bypassTenant: true,
    });

    if (!user) {
      if (process.env.NODE_ENV !== "test") {
        console.error(
          `[PROTECT] ERROR: User not found for token ID ${decoded.id}`,
        );
      }
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    if (user.status === "inactive") {
      if (process.env.NODE_ENV !== "test") {
        console.error(`[PROTECT] ERROR: User ${user.email} is inactive`);
      }
      return res
        .status(403)
        .json({
          success: false,
          message: "Account is inactive. Please contact your administrator.",
        });
    }

    if (process.env.NODE_ENV !== "test") {
      console.log(`[PROTECT] SUCCESS: User authenticated - ${user.email}`);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error(`[PROTECT] JWT Verification Error:`, {
        message: error.message,
        name: error.name,
        expiredAt: error.expiredAt?.toISOString(),
      });
    }
    return res
      .status(401)
      .json({
        success: false,
        message: "Not authorized, token invalid or expired",
      });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user?.role || "Guest"}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
