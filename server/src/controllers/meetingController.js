const Meeting = require('../models/Meeting');
const Lead = require('../models/Lead');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const getMeetings = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { status, startDate, endDate } = req.query;

    let query = {};

    // Role-scoped query
    if (role === 'employee') {
      const myLeads = await Lead.find({ assignedTo: _id }).select('_id');
      const myLeadIds = myLeads.map(l => l._id);
      query.$or = [
        { createdBy: _id },
        { attendees: _id },
        { leadId: { $in: myLeadIds } }
      ];
    } else if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id);
      teamIds.push(_id); // Include manager

      const teamLeads = await Lead.find({ assignedTo: { $in: teamIds } }).select('_id');
      const teamLeadIds = teamLeads.map(l => l._id);
      query.$or = [
        { createdBy: { $in: teamIds } },
        { attendees: { $in: teamIds } },
        { leadId: { $in: teamLeadIds } }
      ];
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.scheduledAt = {};
      if (startDate) query.scheduledAt.$gte = new Date(startDate);
      if (endDate) query.scheduledAt.$lte = new Date(endDate);
    }

    const meetings = await Meeting.find(query)
      .populate('leadId', 'name clientCompanyName status priority')
      .populate('attendees', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ scheduledAt: 1 });

    res.status(200).json({
      success: true,
      data: meetings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createMeeting = async (req, res) => {
  try {
    const { leadId, title, scheduledAt, attendees, location, notes } = req.body;
    const { _id, companyId } = req.user;

    // Verify the lead exists and belongs to the company
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const meeting = await Meeting.create({
      companyId,
      leadId,
      title,
      scheduledAt,
      attendees: attendees || [],
      location: location || '',
      notes: notes || '',
      createdBy: _id
    });

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      action: 'MEETING_SCHEDULED',
      targetType: 'Lead',
      targetId: leadId,
      metadata: {
        meetingId: meeting._id,
        title: meeting.title,
        scheduledAt: meeting.scheduledAt
      },
      companyId
    });

    res.status(201).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, scheduledAt, attendees, location, status, notes } = req.body;
    const { role, _id } = req.user;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Check write permissions
    if (role === 'employee' && meeting.createdBy.toString() !== _id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only edit meetings created by you' });
    }

    if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id.toString());
      teamIds.push(_id.toString());

      if (!teamIds.includes(meeting.createdBy.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only edit meetings scheduled by your team' });
      }
    }

    const originalStatus = meeting.status;

    if (title !== undefined) meeting.title = title;
    if (scheduledAt !== undefined) meeting.scheduledAt = scheduledAt;
    if (attendees !== undefined) meeting.attendees = attendees;
    if (location !== undefined) meeting.location = location;
    if (status !== undefined) meeting.status = status;
    if (notes !== undefined) meeting.notes = notes;

    await meeting.save();

    // Log activity under Lead
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      action: status === 'Cancelled' ? 'MEETING_CANCELLED' : 'MEETING_UPDATED',
      targetType: 'Lead',
      targetId: meeting.leadId,
      metadata: {
        meetingId: meeting._id,
        title: meeting.title,
        status: meeting.status,
        scheduledAt: meeting.scheduledAt,
        statusChange: originalStatus !== meeting.status ? { from: originalStatus, to: meeting.status } : undefined
      },
      companyId: req.user.companyId
    });

    res.status(200).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, _id } = req.user;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Scoped permissions
    if (role === 'employee' && meeting.createdBy.toString() !== _id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only delete meetings created by you' });
    }

    if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id.toString());
      teamIds.push(_id.toString());

      if (!teamIds.includes(meeting.createdBy.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only delete meetings scheduled by your team' });
      }
    }

    await Meeting.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Meeting successfully deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting
};
