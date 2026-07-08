const Company = require('../models/Company');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Meeting = require('../models/Meeting');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// Settings for the logged-in user's company
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

// Global Company CRUD - Master Admin only (bypasses default tenant scopes)
const getCompanies = async (req, res) => {
  try {
    if (req.user.role !== 'masterAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Master Admin only' });
    }

    const companies = await Company.find({});
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCompany = async (req, res) => {
  try {
    if (req.user.role !== 'masterAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Master Admin only' });
    }

    const { name, timezone, leadSources, leadStatuses } = req.body;

    const newCompany = await Company.create({
      name,
      timezone: timezone || 'UTC',
      leadSources: leadSources || ['Website', 'Referral', 'Cold Call', 'Social Media', 'Other'],
      leadStatuses: leadStatuses || ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']
    });

    res.status(201).json({ success: true, data: newCompany });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCompany = async (req, res) => {
  try {
    if (req.user.role !== 'masterAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Master Admin only' });
    }

    const { id } = req.params;
    const { name, timezone, leadSources, leadStatuses } = req.body;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (name) company.name = name;
    if (timezone) company.timezone = timezone;
    if (leadSources) company.leadSources = leadSources;
    if (leadStatuses) company.leadStatuses = leadStatuses;

    await company.save();
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCompany = async (req, res) => {
  try {
    if (req.user.role !== 'masterAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Master Admin only' });
    }

    const { id } = req.params;

    if (id === req.user.companyId.toString()) {
      return res.status(400).json({ success: false, message: 'Access denied: You cannot delete your current company' });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Delete associated data
    await Promise.all([
      User.deleteMany({ companyId: id }).setOptions({ bypassTenant: true }),
      Lead.deleteMany({ companyId: id }).setOptions({ bypassTenant: true }),
      Meeting.deleteMany({ companyId: id }).setOptions({ bypassTenant: true }),
      ActivityLog.deleteMany({ companyId: id }),
      Company.deleteOne({ _id: id })
    ]);

    res.status(200).json({ success: true, message: 'Company and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCompanyDetails = async (req, res) => {
  try {
    if (req.user.role !== 'masterAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Master Admin only' });
    }

    const { id } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Query employees, leads, meetings, and revenue for this company (bypass tenant plugin)
    const [employees, leads, meetings] = await Promise.all([
      User.find({ companyId: id }).setOptions({ bypassTenant: true }).select('name email role status'),
      Lead.find({ companyId: id }).setOptions({ bypassTenant: true }).select('name email status estimatedValue assignedTo'),
      Meeting.find({ companyId: id }).setOptions({ bypassTenant: true }).populate('leadId', 'name')
    ]);

    const revenueAgg = await Lead.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(id), status: 'Won' } },
      { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
    ]).option({ bypassTenant: true });

    const totalRevenue = revenueAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        company,
        employees,
        leads,
        meetings,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCompanySettings,
  updateCompanySettings,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyDetails
};
