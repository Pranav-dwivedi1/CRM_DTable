const analyticsService = require("../services/analyticsService");

const getOverview = async (req, res) => {
  try {
    const overview = await analyticsService.getOverviewMetrics(req.user);
    res.status(200).json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getAnalyticsBreakdown(req.user);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOverview,
  getAnalytics,
};
