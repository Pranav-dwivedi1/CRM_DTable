const express = require('express');
const router = express.Router();
const { getDashboardSummary, getCrmDashboardSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

router.get('/summary', protect, tenantMiddleware, getDashboardSummary);
router.get('/crm-summary', protect, tenantMiddleware, getCrmDashboardSummary);

module.exports = router;
