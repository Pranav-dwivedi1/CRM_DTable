const express = require('express');
const router = express.Router();
const {
  getCompanySettings,
  updateCompanySettings,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyDetails
} = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

router.use(protect);
router.use(tenantMiddleware);

// User Settings endpoints
router.get('/settings', getCompanySettings);
router.patch('/settings', authorize('masterAdmin'), updateCompanySettings);

// Global Company Administration CRUD
router.get('/', authorize('masterAdmin'), getCompanies);
router.post('/', authorize('masterAdmin'), createCompany);
router.get('/:id/details', authorize('masterAdmin'), getCompanyDetails);
router.patch('/:id', authorize('masterAdmin'), updateCompany);
router.delete('/:id', authorize('masterAdmin'), deleteCompany);

module.exports = router;
