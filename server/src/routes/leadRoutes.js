const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  assignLead,
  deleteLead,
  addNote,
  changeLeadStatus
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');
const { leadValidation, noteValidation } = require('../middleware/validation');

// All lead endpoints require authentication and company scoping
router.use(protect);
router.use(tenantMiddleware);

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', leadValidation, createLead);
router.patch('/:id/status', changeLeadStatus);
router.patch('/:id', leadValidation, updateLead);
router.patch('/:id/assign', assignLead);
router.delete('/:id', deleteLead);
router.post('/:id/notes', noteValidation, addNote);

module.exports = router;

