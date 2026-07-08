const express = require("express");
const router = express.Router();
const {
  getDashboardSummary,
  getCrmDashboardSummary,
} = require("../controllers/dashboardController");
const {
  getOverview,
  getAnalytics,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");

router.get("/summary", protect, tenantMiddleware, getDashboardSummary);
router.get("/crm-summary", protect, tenantMiddleware, getCrmDashboardSummary);
router.get("/overview", protect, tenantMiddleware, getOverview);
router.get("/analytics", protect, tenantMiddleware, getAnalytics);

module.exports = router;
