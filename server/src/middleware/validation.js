const { body, validationResult } = require('express-validator');

// Generic validation check middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

const registerCompanyValidation = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('adminName').trim().notEmpty().withMessage('Admin name is required'),
  body('adminEmail').isEmail().withMessage('Valid admin email is required').normalizeEmail(),
  body('adminPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const userValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['masterAdmin', 'manager', 'employee']).withMessage('Invalid role'),
  body('managerId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Manager ID must be a valid Mongo ID')
    .custom((value, { req }) => {
      if (req.body.role === 'employee' && !value) {
        throw new Error('Manager is required for employee role');
      }
      return true;
    }),
  validate
];

const leadValidation = [
  body('name').trim().notEmpty().withMessage('Lead name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('clientCompanyName').optional().trim(),
  body('source').trim().notEmpty().withMessage('Lead source is required'),
  body('status').trim().notEmpty().withMessage('Lead status is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('estimatedValue').optional().isNumeric().withMessage('Estimated value must be a number'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('followUpDate').optional({ checkFalsy: true }).isISO8601().withMessage('Follow-up date must be a valid date'),
  body('assignedTo').optional({ checkFalsy: true }).isMongoId().withMessage('Assigned representative must be a valid Mongo ID'),
  body('lostReason').optional({ checkFalsy: true }).isIn(['Budget', 'No Response', 'Chose Competitor', 'Not a Fit', 'Other']).withMessage('Invalid lost reason'),
  validate
];

const noteValidation = [
  body('text').trim().notEmpty().withMessage('Note text is required'),
  validate
];

const meetingValidation = [
  body('leadId').isMongoId().withMessage('Valid Lead ID is required'),
  body('title').trim().notEmpty().withMessage('Meeting title is required'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date and time is required'),
  body('attendees').optional().isArray().withMessage('Attendees must be an array of User IDs'),
  body('attendees.*').optional().isMongoId().withMessage('Each attendee must be a valid User ID'),
  body('location').optional().trim(),
  body('status').optional().isIn(['Scheduled', 'Completed', 'Cancelled']).withMessage('Invalid status'),
  body('notes').optional().trim(),
  validate
];

module.exports = {
  registerCompanyValidation,
  loginValidation,
  userValidation,
  leadValidation,
  noteValidation,
  meetingValidation
};
