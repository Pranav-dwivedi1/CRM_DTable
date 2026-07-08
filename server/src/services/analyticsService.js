const Lead = require("../models/Lead");
const User = require("../models/User");
const Meeting = require("../models/Meeting");
const Company = require("../models/Company");
const ActivityLog = require("../models/ActivityLog");

const normalizeRoleScope = async (user) => {
  const { role, _id } = user;

  if (role === "masterAdmin") {
    return { scope: "company", teamIds: [] };
  }

  if (role === "manager") {
    const teamEmployees = await User.find({ managerId: _id }).select("_id");
    const teamIds = teamEmployees.map((emp) => emp._id);
    teamIds.push(_id);
    return { scope: "team", teamIds };
  }

  return { scope: "personal", teamIds: [_id] };
};

const buildLeadQuery = async (user, extraQuery = {}) => {
  const { role, _id } = user;
  const scope = await normalizeRoleScope(user);

  if (role === "employee") {
    return { ...extraQuery, assignedTo: _id };
  }

  if (role === "manager") {
    return { ...extraQuery, assignedTo: { $in: scope.teamIds } };
  }

  return extraQuery;
};

const buildMeetingQuery = async (user, extraQuery = {}) => {
  const { role, _id } = user;
  const scope = await normalizeRoleScope(user);

  if (role === "employee") {
    const myLeads = await Lead.find({ assignedTo: _id }).select("_id");
    const myLeadIds = myLeads.map((lead) => lead._id);
    return {
      ...extraQuery,
      $or: [
        { createdBy: _id },
        { attendees: _id },
        { leadId: { $in: myLeadIds } },
      ],
    };
  }

  if (role === "manager") {
    const teamLeads = await Lead.find({
      assignedTo: { $in: scope.teamIds },
    }).select("_id");
    const teamLeadIds = teamLeads.map((lead) => lead._id);
    return {
      ...extraQuery,
      $or: [
        { createdBy: { $in: scope.teamIds } },
        { attendees: { $in: scope.teamIds } },
        { leadId: { $in: teamLeadIds } },
      ],
    };
  }

  return extraQuery;
};

const getOverviewMetrics = async (user) => {
  const leadQuery = await buildLeadQuery(user);
  const meetingQuery = await buildMeetingQuery(user);

  const [
    totalLeads,
    newLeads,
    contactedLeads,
    qualifiedLeads,
    proposalSentLeads,
    negotiationLeads,
    wonLeads,
    lostLeads,
    totalEmployees,
    totalManagers,
    totalCompanies,
    totalRevenue,
    monthlyRevenue,
    weeklyRevenue,
    yearlyRevenue,
    meetingsScheduledToday,
    upcomingMeetings,
    completedMeetings,
    leadStatusBreakdown,
    leadSourceBreakdown,
    leadPriorityBreakdown,
    companyBreakdown,
    employeeBreakdown,
    recentMeetings,
    recentActivities,
    teamPerformance,
  ] = await Promise.all([
    Lead.countDocuments(leadQuery),
    Lead.countDocuments({ ...leadQuery, status: "New" }),
    Lead.countDocuments({ ...leadQuery, status: "Contacted" }),
    Lead.countDocuments({ ...leadQuery, status: "Qualified" }),
    Lead.countDocuments({ ...leadQuery, status: "Proposal Sent" }),
    Lead.countDocuments({ ...leadQuery, status: "Negotiation" }),
    Lead.countDocuments({ ...leadQuery, status: "Won" }),
    Lead.countDocuments({ ...leadQuery, status: "Lost" }),
    User.countDocuments(
      user.role === "masterAdmin" ? {} : { managerId: user._id },
    ),
    User.countDocuments(user.role === "masterAdmin" ? { role: "manager" } : {}),
    Company.countDocuments(),
    Lead.aggregate([
      { $match: leadQuery },
      { $group: { _id: null, total: { $sum: "$estimatedValue" } } },
    ]),
    Lead.aggregate([
      {
        $match: {
          ...leadQuery,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$estimatedValue" } } },
    ]),
    Lead.aggregate([
      {
        $match: {
          ...leadQuery,
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$estimatedValue" } } },
    ]),
    Lead.aggregate([
      {
        $match: {
          ...leadQuery,
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) },
        },
      },
      { $group: { _id: null, total: { $sum: "$estimatedValue" } } },
    ]),
    Meeting.countDocuments({
      ...meetingQuery,
      scheduledAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
    Meeting.countDocuments({
      ...meetingQuery,
      scheduledAt: { $gte: new Date() },
      status: "Scheduled",
    }),
    Meeting.countDocuments({ ...meetingQuery, status: "Completed" }),
    Lead.aggregate([
      { $match: leadQuery },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: leadQuery },
      { $group: { _id: "$source", count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: leadQuery },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: leadQuery },
      { $group: { _id: "$clientCompanyName", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: user.role === "masterAdmin" ? {} : { managerId: user._id } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    Meeting.find({ ...meetingQuery })
      .sort({ scheduledAt: 1 })
      .limit(10)
      .populate("leadId", "name clientCompanyName")
      .populate("attendees", "name role"),
    ActivityLog.find({ companyId: user.companyId })
      .sort({ createdAt: -1 })
      .limit(10),
    Lead.aggregate([
      { $match: leadQuery },
      {
        $group: {
          _id: "$assignedTo",
          total: { $sum: 1 },
          won: {
            $sum: { $cond: [{ $eq: ["$status", "Won"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$user.name", "Unassigned"] },
          total: 1,
          won: 1,
          rate: {
            $cond: [
              { $gt: ["$total", 0] },
              { $multiply: [{ $divide: ["$won", "$total"] }, 100] },
              0,
            ],
          },
        },
      },
    ]),
  ]);

  const formatRevenue = (items) => {
    if (!items || items.length === 0) return 0;
    return items[0].total || 0;
  };

  const metrics = {
    totalCompanies: user.role === "masterAdmin" ? totalCompanies : 1,
    totalClients: wonLeads,
    totalLeads,
    newLeads,
    contactedLeads,
    qualifiedLeads,
    proposalSentLeads,
    negotiationLeads,
    wonLeads,
    lostLeads,
    totalEmployees,
    totalManagers,
    totalRevenue: formatRevenue(totalRevenue),
    monthlyRevenue: formatRevenue(monthlyRevenue),
    weeklyRevenue: formatRevenue(weeklyRevenue),
    yearlyRevenue: formatRevenue(yearlyRevenue),
    meetingsScheduledToday,
    upcomingMeetings,
    completedMeetings,
  };

  return {
    metrics,
    breakdowns: {
      leadsByStatus: leadStatusBreakdown,
      leadsBySource: leadSourceBreakdown,
      leadsByPriority: leadPriorityBreakdown,
      leadsByCompany: companyBreakdown,
      employeesByRole: employeeBreakdown,
    },
    meetings: recentMeetings,
    recentActivities,
    teamPerformance,
    leadsByStatus: leadStatusBreakdown,
    leadsBySource: leadSourceBreakdown,
    leadsByPriority: leadPriorityBreakdown,
  };
};

const getAnalyticsBreakdown = async (user) => {
  const leadQuery = await buildLeadQuery(user);

  const [
    statusBreakdown,
    sourceBreakdown,
    priorityBreakdown,
    monthlyTrend,
    weeklyTrend,
    yearlyTrend,
    teamPerformance,
  ] = await Promise.all([
    Lead.aggregate([
      { $match: leadQuery },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: leadQuery },
      { $group: { _id: "$source", count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: leadQuery },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      {
        $match: {
          ...leadQuery,
          createdAt: {
            $gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 5,
              1,
            ),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Lead.aggregate([
      {
        $match: {
          ...leadQuery,
          createdAt: {
            $gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            week: { $isoWeek: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Lead.aggregate([
      {
        $match: {
          ...leadQuery,
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) },
        },
      },
      {
        $group: { _id: { year: { $year: "$createdAt" } }, count: { $sum: 1 } },
      },
    ]),
    Lead.aggregate([
      { $match: leadQuery },
      {
        $group: {
          _id: "$assignedTo",
          total: { $sum: 1 },
          won: { $sum: { $cond: [{ $eq: ["$status", "Won"] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$user.name", "Unassigned"] },
          total: 1,
          won: 1,
          rate: {
            $cond: [
              { $gt: ["$total", 0] },
              { $multiply: [{ $divide: ["$won", "$total"] }, 100] },
              0,
            ],
          },
        },
      },
    ]),
  ]);

  return {
    breakdowns: {
      leadsByStatus: statusBreakdown,
      leadsBySource: sourceBreakdown,
      leadsByPriority: priorityBreakdown,
      monthlyTrend,
      weeklyTrend,
      yearlyTrend,
      teamPerformance,
    },
  };
};

module.exports = {
  getOverviewMetrics,
  getAnalyticsBreakdown,
  buildLeadQuery,
  buildMeetingQuery,
};
