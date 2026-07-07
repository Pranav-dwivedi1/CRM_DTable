const mongoose = require('mongoose');
const tenantPlugin = require('./plugins/tenantPlugin');

const MeetingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead is required']
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled time is required']
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    location: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled'
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Apply tenant plugin
MeetingSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Meeting', MeetingSchema);
