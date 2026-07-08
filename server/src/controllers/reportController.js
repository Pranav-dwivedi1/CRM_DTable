const Lead = require('../models/Lead');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { buildLeadQuery, buildMeetingQuery } = require('../services/analyticsService');

const getPeriodDateRange = (period) => {
  const now = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case 'Daily':
      // From 00:00 today to now
      break;
    case 'Weekly':
      start.setDate(now.getDate() - 7);
      break;
    case 'Monthly':
      start.setDate(now.getDate() - 30);
      break;
    case 'Quarterly':
      start.setDate(now.getDate() - 90);
      break;
    case 'Yearly':
      start.setDate(now.getDate() - 365);
      break;
    default:
      start.setDate(now.getDate() - 30); // default monthly
  }
  return { start, end: now };
};

const getReportData = async (user, period) => {
  const { start, end } = getPeriodDateRange(period);
  const baseLeadQuery = await buildLeadQuery(user);
  const baseMeetingQuery = await buildMeetingQuery(user);

  // Scoped to period
  const leadQuery = {
    ...baseLeadQuery,
    createdAt: { $gte: start, $lte: end }
  };

  const meetingQuery = {
    ...baseMeetingQuery,
    scheduledAt: { $gte: start, $lte: end }
  };

  // Queries
  const [
    totalLeads,
    wonLeads,
    lostLeads,
    revenueAgg,
    meetingsCount,
    meetingsList,
    leadsList
  ] = await Promise.all([
    Lead.countDocuments(leadQuery),
    Lead.countDocuments({ ...leadQuery, status: 'Won' }),
    Lead.countDocuments({ ...leadQuery, status: 'Lost' }),
    Lead.aggregate([
      { $match: { ...leadQuery, status: 'Won' } },
      { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
    ]),
    Meeting.countDocuments(meetingQuery),
    Meeting.find(meetingQuery).populate('leadId', 'name clientCompanyName').populate('createdBy', 'name').limit(10),
    Lead.find(leadQuery).populate('assignedTo', 'name').limit(10)
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

  return {
    period,
    dateRange: { start, end },
    metrics: {
      totalLeads,
      wonLeads,
      lostLeads,
      totalRevenue,
      conversionRate: parseFloat(conversionRate),
      meetingsCount
    },
    recentLeads: leadsList,
    recentMeetings: meetingsList
  };
};

const getReport = async (req, res) => {
  try {
    const { period = 'Monthly' } = req.query;
    const report = await getReportData(req.user, period);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const exportReportCSV = async (req, res) => {
  try {
    const { period = 'Monthly' } = req.query;
    const report = await getReportData(req.user, period);

    // Build CSV Content
    let csv = `CRM REPORT - ${period.toUpperCase()}\n`;
    csv += `Period: ${report.dateRange.start.toLocaleDateString()} to ${report.dateRange.end.toLocaleDateString()}\n\n`;
    
    csv += `METRIC,VALUE\n`;
    csv += `Total Leads Created,${report.metrics.totalLeads}\n`;
    csv += `Won Leads,${report.metrics.wonLeads}\n`;
    csv += `Lost Leads,${report.metrics.lostLeads}\n`;
    csv += `Revenue Generated,$${report.metrics.totalRevenue}\n`;
    csv += `Conversion Rate,${report.metrics.conversionRate}%\n`;
    csv += `Meetings Conducted,${report.metrics.meetingsCount}\n\n`;

    csv += `RECENT LEADS LIST\n`;
    csv += `Lead Name,Email,Company,Value,Status,Assigned To\n`;
    report.recentLeads.forEach(l => {
      csv += `"${l.name}","${l.email || ''}","${l.clientCompanyName || ''}",$${l.estimatedValue || 0},"${l.status}","${l.assignedTo?.name || 'Unassigned'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=CRM_Report_${period}_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReport,
  exportReportCSV
};
