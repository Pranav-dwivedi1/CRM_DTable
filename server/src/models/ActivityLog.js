const mongoose = require('mongoose');
const tenantPlugin = require('./plugins/tenantPlugin');

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      enum: ['Lead', 'User', 'Company'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Map,
      of: mongoose.Schema.Types.Mixed
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  }
);

// Apply tenant plugin
ActivityLogSchema.plugin(tenantPlugin);

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
