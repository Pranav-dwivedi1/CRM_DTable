const express = require('express');
const router = express.Router();
const { getReport, exportReportCSV } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

router.get('/', protect, tenantMiddleware, getReport);
router.get('/export', protect, tenantMiddleware, exportReportCSV);

module.exports = router;
