const mongoose = require('mongoose');
const tenantPlugin = require('./plugins/tenantPlugin');

const NoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Note text is required'],
    trim: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const LeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    clientCompanyName: {
      type: String,
      trim: true,
      default: ''
    },
    source: {
      type: String,
      required: [true, 'Lead source is required']
    },
    status: {
      type: String,
      required: [true, 'Lead status is required']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    estimatedValue: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    followUpDate: {
      type: Date
    },
    notes: [NoteSchema],
    lostReason: {
      type: String,
      enum: ['Budget', 'No Response', 'Chose Competitor', 'Not a Fit', 'Other'],
      trim: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Apply tenant plugin
LeadSchema.plugin(tenantPlugin);

// Filter out soft-deleted leads by default
LeadSchema.pre(/^find/, function(next) {
  if (this.options && this.options.showDeleted) {
    return next();
  }
  this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Lead', LeadSchema);
