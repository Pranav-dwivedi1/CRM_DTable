const User = require('../models/User');
const Lead = require('../models/Lead');
const Company = require('../models/Company');
const Meeting = require('../models/Meeting');

const globalSearch = async (req, res) => {
  try {
    const { q = '' } = req.query;
    const { role, _id, companyId } = req.user;

    if (!q.trim()) {
      return res.status(200).json({
        success: true,
        data: { leads: [], meetings: [], users: [], companies: [] }
      });
    }

    const regex = new RegExp(q, 'i');
    const searchTasks = [];

    // 1. Setup User Search Query
    let userQuery = null;
    if (role === 'masterAdmin') {
      userQuery = { $or: [{ name: regex }, { email: regex }] };
    } else if (role === 'manager') {
      userQuery = {
        $and: [
          { $or: [{ managerId: _id }, { _id: _id }] },
          { $or: [{ name: regex }, { email: regex }] }
        ]
      };
    }
    // Employees cannot search users

    // 2. Setup Lead Search Query
    let leadQuery = {
      $or: [
        { name: regex },
        { email: regex },
        { phone: regex },
        { clientCompanyName: regex }
      ]
    };
    if (role === 'employee') {
      leadQuery = { $and: [{ assignedTo: _id }, leadQuery] };
    } else if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id);
      teamIds.push(_id);
      leadQuery = { $and: [{ assignedTo: { $in: teamIds } }, leadQuery] };
    }

    // 3. Setup Meeting Search Query
    let meetingQuery = {
      $or: [
        { title: regex },
        { location: regex },
        { notes: regex }
      ]
    };
    if (role === 'employee') {
      const myLeads = await Lead.find({ assignedTo: _id }).select('_id');
      const myLeadIds = myLeads.map(l => l._id);
      meetingQuery = {
        $and: [
          {
            $or: [
              { createdBy: _id },
              { attendees: _id },
              { leadId: { $in: myLeadIds } }
            ]
          },
          meetingQuery
        ]
      };
    } else if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id);
      teamIds.push(_id);
      const teamLeads = await Lead.find({ assignedTo: { $in: teamIds } }).select('_id');
      const teamLeadIds = teamLeads.map(l => l._id);
      meetingQuery = {
        $and: [
          {
            $or: [
              { createdBy: { $in: teamIds } },
              { attendees: { $in: teamIds } },
              { leadId: { $in: teamLeadIds } }
            ]
          },
          meetingQuery
        ]
      };
    }

    // 4. Setup Company Search Query (Master Admin only can search all companies)
    let companyQuery = null;
    if (role === 'masterAdmin') {
      companyQuery = { name: regex };
    }

    // Execute queries in parallel
    const results = {
      leads: [],
      meetings: [],
      users: [],
      companies: []
    };

    const promises = [];

    // Leads search
    promises.push(
      Lead.find(leadQuery)
        .limit(10)
        .populate('assignedTo', 'name email')
        .then(leads => { results.leads = leads; })
    );

    // Meetings search
    promises.push(
      Meeting.find(meetingQuery)
        .limit(10)
        .populate('leadId', 'name clientCompanyName')
        .then(meetings => { results.meetings = meetings; })
    );

    // Users search
    if (userQuery) {
      promises.push(
        User.find(userQuery)
          .limit(10)
          .then(users => { results.users = users; })
      );
    }

    // Companies search
    if (companyQuery) {
      promises.push(
        Company.find(companyQuery)
          .setOptions({ bypassTenant: true }) // Company has no companyId
          .limit(10)
          .then(companies => { results.companies = companies; })
      );
    }

    await Promise.all(promises);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  globalSearch
};
