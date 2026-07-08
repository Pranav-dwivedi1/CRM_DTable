const mongoose = require('mongoose');
const tenantPlugin = require('./plugins/tenantPlugin');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['new_lead', 'meeting_reminder', 'lead_assignment', 'followup_reminder', 'revenue_achievement'],
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Apply tenant plugin to automatically scope notifications by company
NotificationSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Notification', NotificationSchema);
