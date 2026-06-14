// whatsapp-bot.js - Twilio WhatsApp Integration
const Twilio = require('twilio');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

let twilioClient = null;
let isConfigured = false;

/**
 * Initialize Twilio Client
 */
function initTwilio() {
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    isConfigured = true;
    console.log('✓ Twilio WhatsApp configured');
    console.log(`  Account: ${TWILIO_ACCOUNT_SID.substring(0, 10)}...`);
    console.log(`  From: ${TWILIO_WHATSAPP_NUMBER}`);
  } else {
    console.warn('⚠ Twilio WhatsApp NOT configured. Set env vars to enable.');
  }
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsAppMessage(toNumber, body) {
  if (!isConfigured) {
    console.warn('Twilio not configured. Message not sent.');
    return null;
  }

  if (!body || body.trim() === '') {
    console.warn('Empty message body. Not sending.');
    return null;
  }

  try {
    // Ensure to has whatsapp: prefix
    let recipient = toNumber;
    if (!recipient.startsWith('whatsapp:')) {
      recipient = `whatsapp:${toNumber}`;
    }

    console.log(`[Twilio] Sending to: ${recipient}, Body length: ${body.length}`);

    const message = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: recipient,
      body: body.substring(0, 4096) // Twilio limit
    });

    console.log(`[Twilio] Message sent. SID: ${message.sid}`);
    return message;
  } catch (err) {
    console.error('[Twilio Send Error]', {
      code: err.code,
      message: err.message,
      details: err.details
    });
    throw err;
  }
}

/**
 * Send batch WhatsApp messages
 */
async function sendBatchMessages(recipients, body) {
  const results = [];
  for (const to of recipients) {
    try {
      const result = await sendWhatsAppMessage(to, body);
      results.push({ to, status: 'success', sid: result.sid });
    } catch (err) {
      results.push({ to, status: 'failed', error: err.message });
    }
  }
  return results;
}

/**
 * Get Twilio message status
 */
async function getMessageStatus(messageSid) {
  if (!isConfigured) return null;

  try {
    const message = await twilioClient.messages(messageSid).fetch();
    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      dateCreated: message.dateCreated
    };
  } catch (err) {
    console.error('[Twilio Status Error]', err.message);
    return null;
  }
}

/**
 * Check if Twilio is configured
 */
function isTwilioConfigured() {
  return isConfigured;
}

module.exports = {
  initTwilio,
  sendWhatsAppMessage,
  sendBatchMessages,
  getMessageStatus,
  isTwilioConfigured
};