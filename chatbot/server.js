// server.js - Main Node.js Server for AI Chatbot
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const { generateReply } = require('./chatbot');
const { sendWhatsAppMessage, initTwilio } = require('./whatsapp-bot');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Twilio
initTwilio();

// Socket.IO Connections
let connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
  connectedUsers.set(socket.id, { type: 'web', timestamp: Date.now() });

  // Broadcast connection status
  io.emit('user_count', connectedUsers.size);

  socket.on('user_message', async (payload) => {
    console.log(`[Web Message] ${socket.id}: ${payload.text}`);
    try {
      const reply = await generateReply(payload.text, { source: 'web', userId: socket.id });
      socket.emit('bot_message', { text: reply, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('[Error] Failed to generate reply:', err);
      socket.emit('bot_message', { text: 'Maaf, terjadi kesalahan. Coba lagi?' });
    }
  });

  socket.on('settings_update', (data) => {
    console.log(`[Settings] User ${socket.id} updated:`, data);
    socket.emit('settings_confirmed', { status: 'ok' });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
    connectedUsers.delete(socket.id);
    io.emit('user_count', connectedUsers.size);
  });
});

// Twilio WhatsApp Webhook
app.post('/webhook/twilio', async (req, res) => {
  const from = req.body.From || req.body.from || 'unknown';
  const body = req.body.Body || req.body.body || '';
  const messageId = req.body.MessageSid || 'msg_' + Date.now();

  console.log(`[WhatsApp Incoming] From: ${from}, Message: ${body}, ID: ${messageId}`);

  // Generate AI Reply
  try {
    const reply = await generateReply(body, { source: 'whatsapp', from });
    console.log(`[WhatsApp Reply] To: ${from}, Message: ${reply}`);
    
    // Send reply via Twilio
    await sendWhatsAppMessage(from, reply);

    // Broadcast to web dashboard
    io.emit('wa_incoming', {
      from,
      body,
      reply,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Twilio Error]', err);
    try {
      await sendWhatsAppMessage(from, 'Maaf, terjadi kesalahan processing pesan Anda.');
    } catch (e) {
      console.error('[Twilio Send Error]', e);
    }
  }

  // Respond 200 OK to Twilio
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size
  });
});

// API: Chat History (optional)
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    webConnections: connectedUsers.size,
    twilio: { configured: !!process.env.TWILIO_ACCOUNT_SID },
    openai: { configured: !!process.env.OPENAI_API_KEY }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║    AI Chatbot Server Running           ║`);
  console.log(`║    Port: ${PORT}                              ║`);
  console.log(`║    Environment: ${process.env.NODE_ENV || 'development'}           ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 WebSocket: ws://localhost:${PORT}`);
  console.log(`📱 WhatsApp Webhook: POST /webhook/twilio\n`);
});

module.exports = { app, io };