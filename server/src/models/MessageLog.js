const mongoose = require("mongoose");

const MessageLogSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderName: { type: String, required: true },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  receiverName: { type: String, default: "" },
  channel: { type: String, enum: ["email", "whatsapp"], required: true },
  subject: { type: String, default: "" },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["sent", "failed", "queued"],
    default: "queued",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MessageLog", MessageLogSchema);
