const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");

const generateAccessToken = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" },
  );

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[AUTH] Generated Access Token - User: ${user.email}, Expires: ${process.env.JWT_ACCESS_EXPIRES || "15m"}`,
    );
  }

  return accessToken;
};

const generateAndStoreRefreshToken = async (user) => {
  const tokenString = crypto.randomBytes(40).toString("hex");
  const expiresDays = 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresDays);

  const savedToken = await RefreshToken.create({
    userId: user._id,
    token: tokenString,
    expiresAt,
  });

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[AUTH] Generated and Stored Refresh Token - User: ${user.email}, Expires: ${expiresAt.toISOString()}, DB ID: ${savedToken._id}`,
    );
  }

  return tokenString;
};

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
};

const registerCompany = async (req, res) => {
  try {
    const { companyName, adminName, adminEmail, adminPassword } = req.body;

    // Check if email already exists globally
    const existingUser = await User.findOne({ email: adminEmail }).setOptions({
      bypassTenant: true,
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email address is already in use" });
    }

    // 1. Create company
    const company = await Company.create({ name: companyName });

    // 2. Create Master Admin user
    const admin = await User.create({
      companyId: company._id,
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "masterAdmin",
    });

    res.status(201).json({
      success: true,
      message: "Company and admin user successfully registered",
      company: { id: company._id, name: company.name },
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Retrieve user and explicitly include password field
    const user = await User.findOne({ email })
      .select("+password")
      .setOptions({ bypassTenant: true });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ success: false, message: "This account is deactivated" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Update lastLoginAt timestamp
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateAndStoreRefreshToken(user);

    const cookieOptions = getCookieOptions();
    res.cookie("refreshToken", refreshToken, cookieOptions);

    if (process.env.NODE_ENV !== "test") {
      console.log(`[LOGIN] Cookie Options:`, {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: cookieOptions.path,
        maxAge: cookieOptions.maxAge,
        expiresDate: new Date(Date.now() + cookieOptions.maxAge).toISOString(),
      });
      console.log(
        `[LOGIN] Response Headers will include Set-Cookie for refreshToken`,
      );
      console.log(
        `[LOGIN] Refresh Token (last 8 chars): ...${refreshToken.slice(-8)}`,
      );
    }

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error(`[LOGIN] Error:`, error.message);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"];

    if (process.env.NODE_ENV !== "test") {
      console.log(`[REFRESH_TOKEN] Received Request`);
      console.log(`[REFRESH_TOKEN] Cookies:`, {
        hasRefreshToken: !!req.cookies?.refreshToken,
        cookieKeys: Object.keys(req.cookies || {}),
      });
      console.log(`[REFRESH_TOKEN] Body refreshToken:`, {
        hasToken: !!req.body?.refreshToken,
      });
      console.log(
        `[REFRESH_TOKEN] Final Token (last 8 chars): ${token ? "..." + token.slice(-8) : "MISSING"}`,
      );
    }

    if (!token) {
      if (process.env.NODE_ENV !== "test") {
        console.error(
          `[REFRESH_TOKEN] ERROR: No refresh token found in cookies or body`,
        );
      }
      return res
        .status(401)
        .json({ success: false, message: "Refresh token is missing" });
    }

    const dbToken = await RefreshToken.findOne({ token });

    if (process.env.NODE_ENV !== "test") {
      console.log(`[REFRESH_TOKEN] Database Query:`, {
        found: !!dbToken,
        dbId: dbToken?._id,
        expiresAt: dbToken?.expiresAt?.toISOString(),
        now: new Date().toISOString(),
        isExpired: dbToken ? dbToken.expiresAt < new Date() : "N/A",
      });
    }

    if (!dbToken || dbToken.expiresAt < new Date()) {
      if (dbToken) await RefreshToken.deleteOne({ _id: dbToken._id });
      if (process.env.NODE_ENV !== "test") {
        console.error(
          `[REFRESH_TOKEN] ERROR: Token is ${!dbToken ? "not found" : "expired"}`,
        );
      }
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(dbToken.userId).setOptions({
      bypassTenant: true,
    });

    if (process.env.NODE_ENV !== "test") {
      console.log(`[REFRESH_TOKEN] User Lookup:`, {
        found: !!user,
        email: user?.email,
        status: user?.status,
      });
    }

    if (!user || user.status === "inactive") {
      if (process.env.NODE_ENV !== "test") {
        console.error(
          `[REFRESH_TOKEN] ERROR: User ${!user ? "not found" : "is inactive"}`,
        );
      }
      return res
        .status(401)
        .json({ success: false, message: "User not found or is inactive" });
    }

    await RefreshToken.deleteOne({ _id: dbToken._id });

    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[REFRESH_TOKEN] Old token deleted, generating new tokens...`,
      );
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateAndStoreRefreshToken(user);
    const cookieOptions = getCookieOptions();
    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    if (process.env.NODE_ENV !== "test") {
      console.log(`[REFRESH_TOKEN] Setting new cookie with options:`, {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: cookieOptions.path,
      });
    }

    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[REFRESH_TOKEN] SUCCESS: New tokens issued for user ${user.email}`,
      );
    }

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error(`[REFRESH_TOKEN] EXCEPTION:`, error.message);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const token =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"];

    if (process.env.NODE_ENV !== "test") {
      console.log(`[LOGOUT] User logout request`);
      console.log(`[LOGOUT] Has refresh token:`, !!token);
    }

    if (token) {
      const result = await RefreshToken.deleteOne({ token });
      if (process.env.NODE_ENV !== "test") {
        console.log(`[LOGOUT] Token deleted from DB:`, result.deletedCount > 0);
      }
    }

    const cookieOptions = getCookieOptions();
    res.clearCookie("refreshToken", cookieOptions);

    if (process.env.NODE_ENV !== "test") {
      console.log(`[LOGOUT] SUCCESS: Logout completed`);
    }

    res.status(200).json({ success: true, message: "Successfully logged out" });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error(`[LOGOUT] Error:`, error.message);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).setOptions({
      bypassTenant: true,
    });

    if (!user) {
      // Avoid user enumeration
      return res.status(200).json({
        success: true,
        message:
          "If that email exists, a password reset link has been generated.",
      });
    }

    // Create reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Build reset link
    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    // Log link to terminal console
    console.log(`\n================ PASSWORD RESET LINK ================`);
    console.log(`For User: ${email}`);
    console.log(`Link:     ${resetUrl}`);
    console.log(`=====================================================\n`);

    res.status(200).json({
      success: true,
      message: "Password reset link generated and printed to server console.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).setOptions({ bypassTenant: true });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. You may now login.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerCompany,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
