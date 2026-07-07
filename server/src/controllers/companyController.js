const Company = require('../models/Company');
const ActivityLog = require('../models/ActivityLog');

const getCompanySettings = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCompanySettings = async (req, res) => {
  try {
    const { name, logoUrl, timezone, leadSources, leadStatuses } = req.body;

    if (req.user.role !== 'masterAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Only Master Admin can modify company settings' });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (name) company.name = name;
    if (logoUrl !== undefined) company.logoUrl = logoUrl;
    if (timezone) company.timezone = timezone;
    if (leadSources) company.leadSources = leadSources;
    if (leadStatuses) company.leadStatuses = leadStatuses;

    await company.save();

    // Log this company settings change
    await ActivityLog.create({
      companyId: req.user.companyId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'COMPANY_SETTINGS_UPDATED',
      targetType: 'Company',
      targetId: company._id,
      metadata: { name: company.name }
    });

    res.status(200).json({ success: true, message: 'Company settings updated successfully', data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCompanySettings,
  updateCompanySettings
};
