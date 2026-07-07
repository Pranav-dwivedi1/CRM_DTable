const express = require('express');
const router = express.Router();
const {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');
const { meetingValidation } = require('../middleware/validation');

// Require authentication and scoping
router.use(protect);
router.use(tenantMiddleware);

router.get('/', getMeetings);
router.post('/', meetingValidation, createMeeting);
router.patch('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);

module.exports = router;
