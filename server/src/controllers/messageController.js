const User = require('../models/User');
const Lead = require('../models/Lead');
const MessageLog = require('../models/MessageLog');
const { sendCommunication } = require('../services/messagingService');

const sendMessage = async (req, res) => {
  try {
    const { recipientId, recipientType, to, channel, subject, body, message } = req.body;
    const msgContent = body || message; // accept both field names
    const { role, _id } = req.user;

    if (!['email', 'whatsapp'].includes(channel)) {
      return res.status(400).json({ success: false, message: 'Invalid channel. Must be email or whatsapp' });
    }

    if (!msgContent) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    let recipientDoc = null;

    // 1. Role-based recipient permission checks
    if (role === 'masterAdmin') {
      // Master Admin can message anyone
      if (recipientId) {
        if (recipientType === 'User') {
          recipientDoc = await User.findById(recipientId).setOptions({ bypassTenant: true });
        } else {
          recipientDoc = await Lead.findById(recipientId);
        }
      } else if (to) {
        recipientDoc = { name: to, to };
      } else {
        return res.status(400).json({ success: false, message: 'Recipient details are required' });
      }
    } else if (role === 'manager') {
      if (!recipientId) {
        return res.status(403).json({ success: false, message: 'Access Denied: Managers cannot send messages to arbitrary addresses' });
      }

      if (recipientType === 'User') {
        recipientDoc = await User.findById(recipientId);
        if (!recipientDoc || (recipientDoc.managerId?.toString() !== _id.toString() && recipientDoc._id.toString() !== _id.toString())) {
          return res.status(403).json({ success: false, message: 'Access Denied: You can only message employees in your team' });
        }
      } else if (recipientType === 'Lead') {
        recipientDoc = await Lead.findById(recipientId);
        if (!recipientDoc) {
          return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // Check if lead is assigned to someone in manager's team
        const teamEmployees = await User.find({ managerId: _id }).select('_id');
        const teamIds = teamEmployees.map(emp => emp._id.toString());
        teamIds.push(_id.toString());

        if (!recipientDoc.assignedTo || !teamIds.includes(recipientDoc.assignedTo.toString())) {
          return res.status(403).json({ success: false, message: 'Access Denied: This lead is outside your team scope' });
        }
      } else {
        return res.status(400).json({ success: false, message: 'Invalid recipient type' });
      }
    } else if (role === 'employee') {
      if (!recipientId || recipientType !== 'Lead') {
        return res.status(403).json({ success: false, message: 'Access Denied: Employees can only message assigned leads' });
      }

      recipientDoc = await Lead.findById(recipientId);
      if (!recipientDoc) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }

      if (recipientDoc.assignedTo?.toString() !== _id.toString()) {
        return res.status(403).json({ success: false, message: 'Access Denied: You can only message leads assigned to you' });
      }
    }

    if (!recipientDoc) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    // 2. Perform message delivery
    const finalRecipient = {
      _id: recipientDoc._id,
      name: recipientDoc.name || to,
      email: recipientDoc.email || to,
      phone: recipientDoc.phone || to,
      to: to
    };

    const deliveryResult = await sendCommunication({
      user: req.user,
      recipient: finalRecipient,
      channel,
      subject,
      message: msgContent
    });

    if (deliveryResult.success) {
      res.status(200).json({ success: true, message: `${channel} sent successfully`, data: deliveryResult.log });
    } else {
      res.status(500).json({ success: false, message: `Failed to deliver ${channel}`, data: deliveryResult.log });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMessageHistory = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { page = 1, limit = 20, channel } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};

    if (channel) {
      query.channel = channel;
    }

    // Role-based scoping of message history logs
    if (role === 'employee') {
      query.senderId = _id;
    } else if (role === 'manager') {
      const teamEmployees = await User.find({ managerId: _id }).select('_id');
      const teamIds = teamEmployees.map(emp => emp._id);
      teamIds.push(_id); // Include manager's own messages
      query.senderId = { $in: teamIds };
    } else if (role === 'masterAdmin') {
      // Master Admin sees all message logs (tenant scoping is handled by default)
      query = query;
    }

    const messages = await MessageLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MessageLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRecipients = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let recipients = [];

    if (role === 'masterAdmin') {
      // All users + won leads (clients)
      const users = await User.find({}).select('name email phone role').setOptions({ bypassTenant: true });
      const clients = await Lead.find({ status: 'Won' }).select('name email phone');
      recipients = [
        ...users.map(u => ({ _id: u._id, name: `${u.name} (${u.role})`, email: u.email, phone: u.phone, type: 'User' })),
        ...clients.map(c => ({ _id: c._id, name: `${c.name} (Client)`, email: c.email, phone: c.phone, type: 'Lead' }))
      ];
    } else if (role === 'manager') {
      // Team employees + assigned clients
      const teamEmployees = await User.find({ managerId: _id }).select('name email phone');
      const teamIds = teamEmployees.map(e => e._id);
      const clients = await Lead.find({ assignedTo: { $in: teamIds }, status: 'Won' }).select('name email phone');
      recipients = [
        ...teamEmployees.map(u => ({ _id: u._id, name: `${u.name} (Employee)`, email: u.email, phone: u.phone, type: 'User' })),
        ...clients.map(c => ({ _id: c._id, name: `${c.name} (Client)`, email: c.email, phone: c.phone, type: 'Lead' }))
      ];
    } else if (role === 'employee') {
      // Only assigned clients (won leads)
      const clients = await Lead.find({ assignedTo: _id, status: 'Won' }).select('name email phone');
      recipients = clients.map(c => ({ _id: c._id, name: `${c.name} (Client)`, email: c.email, phone: c.phone, type: 'Lead' }));
    }

    res.status(200).json({ success: true, data: recipients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessageHistory,
  getRecipients
};
