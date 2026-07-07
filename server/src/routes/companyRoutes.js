const express = require('express');
const router = express.Router();
const { getCompanySettings, updateCompanySettings } = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

router.use(protect);
router.use(tenantMiddleware);

router.get('/settings', getCompanySettings);
router.patch('/settings', authorize('masterAdmin'), updateCompanySettings);

module.exports = router;
