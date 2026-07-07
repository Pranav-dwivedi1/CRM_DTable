const express = require('express');
const router = express.Router();
const {
  registerCompany,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const {
  registerCompanyValidation,
  loginValidation
} = require('../middleware/validation');

router.post('/register-company', registerCompanyValidation, registerCompany);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
