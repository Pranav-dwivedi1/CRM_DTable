const MessageLog = require('../models/MessageLog');

// Abstract communication provider interface
class StubProvider {
  async send({ to, subject, message, channel }) {
    console.log(`[Messaging Stub] Sending ${channel.toUpperCase()} to: ${to}`);
    if (channel === 'email') {
      console.log(`Subject: ${subject}`);
    }
    console.log(`Body: ${message}`);
    return { success: true, provider: 'stub', status: 'sent' };
  }
}

// Map of providers, easy to switch or extend
const PROVIDERS = {
  stub: new StubProvider(),
  // smtp: new SMTPProvider(),
  // twilio: new TwilioProvider(),
};

const getProvider = (channel) => {
  // Can be configured via environment variables, e.g. process.env.EMAIL_PROVIDER
  const providerKey = process.env.MESSAGING_PROVIDER || 'stub';
  return PROVIDERS[providerKey] || PROVIDERS.stub;
};

const createMessageLog = async ({
  senderId,
  senderName,
  receiverId,
  receiverName,
  channel,
  subject,
  message,
  status
}) => {
  return MessageLog.create({
    senderId,
    senderName,
    receiverId,
    receiverName,
    channel,
    subject,
    message,
    status
  });
};

const sendCommunication = async ({ user, recipient, channel, subject, message }) => {
  const provider = getProvider(channel);
  const toAddress = channel === 'email' ? (recipient.email || recipient.to) : (recipient.phone || recipient.to);

  try {
    const result = await provider.send({
      to: toAddress,
      subject: subject || '',
      message,
      channel
    });

    const log = await createMessageLog({
      senderId: user._id,
      senderName: user.name,
      receiverId: recipient._id || null,
      receiverName: recipient.name || toAddress,
      channel,
      subject: subject || '',
      message,
      status: result.success ? 'sent' : 'failed'
    });

    return { success: true, log };
  } catch (err) {
    console.error(`Messaging delivery error over ${channel}:`, err);
    
    const log = await createMessageLog({
      senderId: user._id,
      senderName: user.name,
      receiverId: recipient._id || null,
      receiverName: recipient.name || toAddress,
      channel,
      subject: subject || '',
      message,
      status: 'failed'
    });

    return { success: false, log, error: err.message };
  }
};

module.exports = {
  sendCommunication
};
