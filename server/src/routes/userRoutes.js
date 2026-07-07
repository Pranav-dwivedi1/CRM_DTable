const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');
const { userValidation } = require('../middleware/validation');

// All routes require authentication and company scoping
router.use(protect);
router.use(tenantMiddleware);

router.get('/', authorize('masterAdmin', 'manager'), getUsers);
router.post('/', authorize('masterAdmin', 'manager'), userValidation, createUser);
router.patch('/:id', authorize('masterAdmin', 'manager'), userValidation, updateUser);
router.patch('/:id/status', authorize('masterAdmin', 'manager'), updateUserStatus);
router.delete('/:id', authorize('masterAdmin'), deleteUser);

module.exports = router;
