const Lead = require('../models/Lead');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Meeting = require('../models/Meeting');
const Company = require('../models/Company');
const { getIO } = require('../socket');
const { createNotification } = require('../services/notificationService');

const logLeadActivity = async (req, leadId, action, metadata) => {
  try {
    await ActivityLog.create({
      companyId: req.user.companyId,
      userId: req.user._id,
      userName: req.user.name,
      action,
      targetType: 'Lead',
      targetId: leadId,
      metadata
    });
  } catch (error) {
    console.error('Failed to log lead activity:', error);
  }
};

const getLeads = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { status, source, assignedTo, startDate, endDate, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let query = {};

    // 1. Role-based scoping
    if (role === 'employee') {
      query.assignedTo = _id;
    } else if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id);
      teamIds.push(_id); // Include manager

      if (assignedTo) {
        if (teamIds.map(id => id.toString()).includes(assignedTo)) {
          query.assignedTo = assignedTo;
        } else {
          query.assignedTo = { $in: [] }; // enforce empty results if scoping out of team
        }
      } else {
        query.assignedTo = { $in: teamIds };
      }
    } else if (role === 'masterAdmin') {
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }
    }

    // 2. Filters
    if (status) query.status = status;
    if (source) query.source = source;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { clientCompanyName: searchRegex },
        { phone: searchRegex }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 3. Execution
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalLeads = await Lead.countDocuments(query);

    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalLeads,
        pages: Math.ceil(totalLeads / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, _id } = req.user;

    const lead = await Lead.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Scoping validation
    if (role === 'employee' && (!lead.assignedTo || lead.assignedTo._id.toString() !== _id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this lead' });
    }

    if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id.toString());
      teamIds.push(_id.toString());

      if (!lead.assignedTo || !teamIds.includes(lead.assignedTo._id.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied: This lead is outside your team' });
      }
    }

    const timeline = await ActivityLog.find({ targetType: 'Lead', targetId: id }).sort({ createdAt: -1 });
    const meetings = await Meeting.find({ leadId: id })
      .populate('attendees', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ scheduledAt: 1 });

    res.status(200).json({ success: true, data: lead, timeline, meetings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createLead = async (req, res) => {
  try {
    const { name, email, phone, clientCompanyName, source, status, priority, estimatedValue, tags, followUpDate, assignedTo, lostReason, notes } = req.body;
    const { role, _id, companyId } = req.user;

    let targetAssignedTo = assignedTo;

    if (role === 'employee') {
      // Employees must assign leads to themselves
      targetAssignedTo = _id;
    } else if (role === 'manager') {
      // Managers can assign to themselves or team members
      if (assignedTo) {
        const teamEmployees = await User.find({ managerId: _id }).select('_id');
        const teamIds = teamEmployees.map(emp => emp._id.toString());
        teamIds.push(_id.toString());

        if (!teamIds.includes(assignedTo.toString())) {
          return res.status(400).json({ success: false, message: 'Managers can only assign leads to themselves or team employees' });
        }
      } else {
        targetAssignedTo = _id; // Default to manager
      }
    } else {
      // Admin can assign to anyone. If not specified, default to admin
      if (!targetAssignedTo) {
        targetAssignedTo = _id;
      }
    }

    const leadNotes = [];
    if (notes && typeof notes === 'string' && notes.trim()) {
      leadNotes.push({
        text: notes.trim(),
        authorId: _id,
        authorName: req.user.name
      });
    }

    const newLead = await Lead.create({
      companyId,
      name,
      email,
      phone,
      clientCompanyName,
      source,
      status,
      priority,
      estimatedValue,
      tags,
      followUpDate,
      assignedTo: targetAssignedTo,
      createdBy: _id,
      lostReason,
      notes: leadNotes
    });

    await logLeadActivity(req, newLead._id, 'LEAD_CREATED', {
      name: newLead.name,
      status: newLead.status,
      assignedTo: targetAssignedTo
    });

    // Notify assignee
    if (newLead.assignedTo && newLead.assignedTo.toString() !== _id.toString()) {
      await createNotification({
        companyId,
        userId: newLead.assignedTo,
        title: 'New Lead Assigned',
        message: `You have been assigned a new lead: ${newLead.name}`,
        type: 'lead_assignment'
      });
    }

    res.status(201).json({ success: true, data: newLead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, clientCompanyName, source, status, priority, estimatedValue, tags, followUpDate, lostReason } = req.body;
    const { role, _id } = req.user;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Role-based write validations
    if (role === 'employee' && (!lead.assignedTo || lead.assignedTo.toString() !== _id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this lead' });
    }

    if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id.toString());
      teamIds.push(_id.toString());

      if (!lead.assignedTo || !teamIds.includes(lead.assignedTo.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied: This lead is outside your team' });
      }
    }

    // Capture changes for log
    const changes = {};
    if (name && name !== lead.name) { changes.name = { from: lead.name, to: name }; lead.name = name; }
    if (email !== undefined && email !== lead.email) { changes.email = { from: lead.email, to: email }; lead.email = email; }
    if (phone !== undefined && phone !== lead.phone) { changes.phone = { from: lead.phone, to: phone }; lead.phone = phone; }
    if (clientCompanyName !== undefined && clientCompanyName !== lead.clientCompanyName) {
      changes.clientCompanyName = { from: lead.clientCompanyName, to: clientCompanyName };
      lead.clientCompanyName = clientCompanyName;
    }
    if (source && source !== lead.source) { changes.source = { from: lead.source, to: source }; lead.source = source; }
    if (status && status !== lead.status) { changes.status = { from: lead.status, to: status }; lead.status = status; }
    if (priority && priority !== lead.priority) { changes.priority = { from: lead.priority, to: priority }; lead.priority = priority; }
    if (estimatedValue !== undefined && estimatedValue !== lead.estimatedValue) {
      changes.estimatedValue = { from: lead.estimatedValue, to: estimatedValue };
      lead.estimatedValue = estimatedValue;
    }
    if (tags !== undefined) { changes.tags = { from: lead.tags, to: tags }; lead.tags = tags; }
    if (followUpDate !== undefined) { changes.followUpDate = { from: lead.followUpDate, to: followUpDate }; lead.followUpDate = followUpDate; }
    if (lostReason !== undefined) { changes.lostReason = { from: lead.lostReason, to: lostReason }; lead.lostReason = lostReason; }

    if (Object.keys(changes).length > 0) {
      await lead.save();
      await logLeadActivity(req, lead._id, 'LEAD_UPDATED', changes);

      // Trigger notification if status changed to Won
      if (changes.status && changes.status.to === 'Won' && changes.status.from !== 'Won') {
        if (lead.assignedTo) {
          await createNotification({
            companyId: lead.companyId,
            userId: lead.assignedTo,
            title: 'Revenue Achieved!',
            message: `Congratulations! Deal won for lead: ${lead.name} ($${lead.estimatedValue || 0})`,
            type: 'revenue_achievement'
          });

          const assignedUser = await User.findById(lead.assignedTo).setOptions({ bypassTenant: true });
          if (assignedUser && assignedUser.managerId) {
            await createNotification({
              companyId: lead.companyId,
              userId: assignedUser.managerId,
              title: 'Team Revenue Achievement!',
              message: `${assignedUser.name} won a deal: ${lead.name} ($${lead.estimatedValue || 0})`,
              type: 'revenue_achievement'
            });
          }
        }
      }
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const { role, _id } = req.user;

    if (!assignedTo) {
      return res.status(400).json({ success: false, message: 'assignedTo user ID is required' });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Role-based reassignment checks
    if (role === 'employee') {
      return res.status(403).json({ success: false, message: 'Access denied: Employees cannot reassign leads' });
    }

    if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id.toString());
      teamIds.push(_id.toString());

      // Confirm lead belongs to manager's team
      if (!lead.assignedTo || !teamIds.includes(lead.assignedTo.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied: This lead is outside your team' });
      }

      // Confirm target assignee belongs to manager's team
      if (!teamIds.includes(assignedTo.toString())) {
        return res.status(400).json({ success: false, message: 'Managers can only assign leads to themselves or team employees' });
      }
    }

    const previousAssignee = lead.assignedTo;
    lead.assignedTo = assignedTo;
    await lead.save();

    await logLeadActivity(req, lead._id, 'LEAD_ASSIGNED', {
      from: previousAssignee,
      to: assignedTo
    });

    if (assignedTo.toString() !== previousAssignee?.toString()) {
      await createNotification({
        companyId: lead.companyId,
        userId: assignedTo,
        title: 'Lead Reassigned',
        message: `You have been assigned the lead: ${lead.name}`,
        type: 'lead_assignment'
      });
    }

    res.status(200).json({ success: true, message: 'Lead successfully reassigned', data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, _id } = req.user;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Permissions check
    if (role === 'employee') {
      return res.status(403).json({ success: false, message: 'Access denied: Employees cannot delete leads' });
    }

    if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id.toString());
      teamIds.push(_id.toString());

      if (!lead.assignedTo || !teamIds.includes(lead.assignedTo.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied: This lead is outside your team' });
      }
    }

    lead.isDeleted = true;
    await lead.save();

    await logLeadActivity(req, lead._id, 'LEAD_DELETED', { name: lead.name });

    res.status(200).json({ success: true, message: 'Lead successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const { role, _id, name } = req.user;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Scoping validation
    if (role === 'employee' && (!lead.assignedTo || lead.assignedTo.toString() !== _id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this lead' });
    }

    if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id.toString());
      teamIds.push(_id.toString());

      if (!lead.assignedTo || !teamIds.includes(lead.assignedTo.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied: This lead is outside your team' });
      }
    }

    const note = {
      text,
      authorId: _id,
      authorName: name,
      createdAt: new Date()
    };

    lead.notes.push(note);
    await lead.save();

    await logLeadActivity(req, lead._id, 'LEAD_NOTE_ADDED', { noteText: text });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/leads/:id/status
 * Dedicated status-change endpoint with strict RBAC, lostReason validation,
 * ActivityLog write, and Socket.io real-time broadcast.
 */
const changeLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, lostReason } = req.body;
    const { role, _id, companyId, name } = req.user;

    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    // Validate status against company configuration
    const company = await Company.findById(companyId);
    const allowedStatuses = company?.leadStatuses || ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    // Require lostReason when marking Lost
    const LOST_REASONS = ['Budget', 'No Response', 'Chose Competitor', 'Not a Fit', 'Other'];
    if (status === 'Lost' && (!lostReason || !LOST_REASONS.includes(lostReason))) {
      return res.status(400).json({
        success: false,
        message: 'lostReason is required when status is Lost. Must be one of: ' + LOST_REASONS.join(', ')
      });
    }

    // Fetch lead
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // RBAC scope checks
    if (role === 'employee') {
      if (lead.assignedTo?.toString() !== _id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only update leads assigned to you' });
      }
    } else if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(e => e._id.toString());
      teamIds.push(_id.toString());
      if (lead.assignedTo && !teamIds.includes(lead.assignedTo.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied: Lead not in your team' });
      }
    }

    const oldStatus = lead.status;

    // Apply changes
    lead.status = status;
    if (status === 'Lost') {
      lead.lostReason = lostReason;
    } else {
      lead.lostReason = undefined;
    }
    await lead.save();

    // Log activity
    await ActivityLog.create({
      companyId,
      userId: _id,
      userName: name,
      action: 'LEAD_STATUS_CHANGED',
      targetType: 'Lead',
      targetId: lead._id,
      metadata: { status: { from: oldStatus, to: status }, lostReason: lostReason || undefined }
    });

    // Trigger notification if status changed to Won
    if (status === 'Won' && oldStatus !== 'Won') {
      if (lead.assignedTo) {
        await createNotification({
          companyId: lead.companyId,
          userId: lead.assignedTo,
          title: 'Revenue Achieved!',
          message: `Congratulations! Deal won for lead: ${lead.name} ($${lead.estimatedValue || 0})`,
          type: 'revenue_achievement'
        });

        const assignedUser = await User.findById(lead.assignedTo).setOptions({ bypassTenant: true });
        if (assignedUser && assignedUser.managerId) {
          await createNotification({
            companyId: lead.companyId,
            userId: assignedUser.managerId,
            title: 'Team Revenue Achievement!',
            message: `${assignedUser.name} won a deal: ${lead.name} ($${lead.estimatedValue || 0})`,
            type: 'revenue_achievement'
          });
        }
      }
    }

    // Emit real-time event to all clients in the company room
    try {
      const io = getIO();
      io.to(`company:${companyId}`).emit('lead:statusChanged', {
        leadId: lead._id,
        oldStatus,
        newStatus: status,
        lostReason: lostReason || null,
        updatedBy: { _id, name }
      });
    } catch (_) {
      // Socket.io not critical — do not fail the request
    }

    res.status(200).json({
      success: true,
      data: lead,
      message: `Lead status updated from "${oldStatus}" to "${status}"`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  assignLead,
  deleteLead,
  addNote,
  changeLeadStatus
};
