const express = require('express');
const router = express.Router();
const { sendMessage, getMessageHistory, getRecipients } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

// Require authentication and scoping
router.use(protect);
router.use(tenantMiddleware);

router.get('/recipients', getRecipients);
router.post('/send', sendMessage);
router.get('/logs', getMessageHistory);    // alias used by frontend
router.get('/history', getMessageHistory); // keep old route for backward compat

module.exports = router;
