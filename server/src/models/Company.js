const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    logoUrl: {
      type: String,
      default: ''
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    leadSources: {
      type: [String],
      default: ['Website', 'Referral', 'Cold Call', 'Social Media', 'Other']
    },
    leadStatuses: {
      type: [String],
      default: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Company', CompanySchema);
