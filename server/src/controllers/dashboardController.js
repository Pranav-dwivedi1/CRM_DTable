const Lead = require('../models/Lead');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Meeting = require('../models/Meeting');
const mongoose = require('mongoose');

const getDashboardSummary = async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (role === 'masterAdmin') {
      const totalLeads = await Lead.countDocuments();
      const wonLeads = await Lead.countDocuments({ status: 'Won' });
      const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

      const leadsByStatus = await Lead.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const leadsBySource = await Lead.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]);

      // Team performance aggregation
      const teamPerformance = await Lead.aggregate([
        { $group: {
            _id: '$assignedTo',
            total: { $sum: 1 },
            won: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } }
        } },
        { $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
        } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: {
            name: { $ifNull: ['$user.name', 'Unassigned'] },
            total: 1,
            won: 1,
            rate: {
              $cond: [
                { $gt: ['$total', 0] },
                { $multiply: [{ $divide: ['$won', '$total'] }, 100] },
                0
              ]
            }
        } }
      ]);

      const recentActivities = await ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(10);

      return res.status(200).json({
        success: true,
        data: {
          role,
          metrics: {
            totalLeads,
            wonLeads,
            conversionRate: parseFloat(conversionRate)
          },
          leadsByStatus,
          leadsBySource,
          teamPerformance,
          recentActivities
        }
      });
    }

    if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id);
      teamIds.push(_id);

      const totalLeads = await Lead.countDocuments({ assignedTo: { $in: teamIds } });
      const wonLeads = await Lead.countDocuments({ assignedTo: { $in: teamIds }, status: 'Won' });
      const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

      const leadsByStatus = await Lead.aggregate([
        { $match: { assignedTo: { $in: teamIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const leadsBySource = await Lead.aggregate([
        { $match: { assignedTo: { $in: teamIds } } },
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]);

      const teamPerformance = await Lead.aggregate([
        { $match: { assignedTo: { $in: teamIds } } },
        { $group: {
            _id: '$assignedTo',
            total: { $sum: 1 },
            won: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } }
        } },
        { $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
        } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: {
            name: { $ifNull: ['$user.name', 'Unassigned'] },
            total: 1,
            won: 1,
            rate: {
              $cond: [
                { $gt: ['$total', 0] },
                { $multiply: [{ $divide: ['$won', '$total'] }, 100] },
                0
              ]
            }
        } }
      ]);

      const leadIds = await Lead.find({ assignedTo: { $in: teamIds } }).distinct('_id');

      const recentActivities = await ActivityLog.find({
        $or: [
          { userId: { $in: teamIds } },
          { targetType: 'Lead', targetId: { $in: leadIds } }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(10);

      return res.status(200).json({
        success: true,
        data: {
          role,
          metrics: {
            totalLeads,
            wonLeads,
            conversionRate: parseFloat(conversionRate)
          },
          leadsByStatus,
          leadsBySource,
          teamPerformance,
          recentActivities
        }
      });
    }

    if (role === 'employee') {
      const totalLeads = await Lead.countDocuments({ assignedTo: _id });
      const wonLeads = await Lead.countDocuments({ assignedTo: _id, status: 'Won' });
      const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

      const leadsByStatus = await Lead.aggregate([
        { $match: { assignedTo: _id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);

      const followUpsToday = await Lead.find({
        assignedTo: _id,
        followUpDate: { $gte: todayStart, $lte: todayEnd }
      }).select('name email clientCompanyName followUpDate status');

      const followUpsThisWeek = await Lead.find({
        assignedTo: _id,
        followUpDate: { $gt: todayEnd, $lte: weekEnd }
      }).select('name email clientCompanyName followUpDate status');

      const leadIds = await Lead.find({ assignedTo: _id }).distinct('_id');

      const recentActivities = await ActivityLog.find({
        $or: [
          { userId: _id },
          { targetType: 'Lead', targetId: { $in: leadIds } }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(10);

      return res.status(200).json({
        success: true,
        data: {
          role,
          metrics: {
            totalLeads,
            wonLeads,
            conversionRate: parseFloat(conversionRate)
          },
          leadsByStatus,
          followUpsToday,
          followUpsThisWeek,
          recentActivities
        }
      });
    }

    res.status(400).json({ success: false, message: 'Invalid role encountered for dashboard summary generation' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCrmDashboardSummary = async (req, res) => {
  try {
    const { role, _id } = req.user;

    let leadQuery = {};
    let meetingQuery = {};
    let activityQuery = { targetType: 'Lead' };

    if (role === 'employee') {
      leadQuery.assignedTo = _id;
      
      const myLeads = await Lead.find({ assignedTo: _id }).select('_id');
      const myLeadIds = myLeads.map(l => l._id);
      
      meetingQuery.$or = [
        { createdBy: _id },
        { attendees: _id },
        { leadId: { $in: myLeadIds } }
      ];
      
      activityQuery.$or = [
        { userId: _id },
        { targetId: { $in: myLeadIds } }
      ];
    } else if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id);
      teamIds.push(_id); // Include manager

      leadQuery.assignedTo = { $in: teamIds };

      const teamLeads = await Lead.find({ assignedTo: { $in: teamIds } }).select('_id');
      const teamLeadIds = teamLeads.map(l => l._id);

      meetingQuery.$or = [
        { createdBy: { $in: teamIds } },
        { attendees: { $in: teamIds } },
        { leadId: { $in: teamLeadIds } }
      ];

      activityQuery.$or = [
        { userId: { $in: teamIds } },
        { targetId: { $in: teamLeadIds } }
      ];
    }

    // Filter meetings to only show scheduled/completed meetings from today onwards (upcoming)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    meetingQuery.scheduledAt = { $gte: today };
    meetingQuery.status = 'Scheduled';

    const totalLeads = await Lead.countDocuments(leadQuery);
    
    // Status distribution
    let leadsByStatus = [];
    if (Object.keys(leadQuery).length > 0) {
      leadsByStatus = await Lead.aggregate([
        { $match: leadQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
    } else {
      leadsByStatus = await Lead.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
    }

    const upcomingMeetings = await Meeting.find(meetingQuery)
      .populate('leadId', 'name clientCompanyName status priority')
      .populate('attendees', 'name email role')
      .sort({ scheduledAt: 1 })
      .limit(5);

    const recentActivities = await ActivityLog.find(activityQuery)
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        role,
        metrics: {
          totalLeads
        },
        leadsByStatus,
        upcomingMeetings,
        recentActivities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardSummary,
  getCrmDashboardSummary
};
