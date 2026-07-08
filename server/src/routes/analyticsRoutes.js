const express = require("express");
const router = express.Router();
const {
  getOverview,
  getAnalytics,
} = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");

router.use(protect);
router.use(tenantMiddleware);

router.get(
  "/overview",
  authorize("masterAdmin", "manager", "employee"),
  getOverview,
);
router.get(
  "/analytics",
  authorize("masterAdmin", "manager", "employee"),
  getAnalytics,
);

module.exports = router;
