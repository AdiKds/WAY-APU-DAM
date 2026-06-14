# 🤖 AI Chatbot - WhatsApp + Web Dashboard

Aplikasi chatbot AI yang terintegrasi dengan **WhatsApp** (via Twilio) dan **Web Dashboard** (Socket.IO real-time).

## ✨ Fitur

- ✅ **Web Chat Interface** - Dashboard real-time dengan Socket.IO
- ✅ **WhatsApp Integration** - Terima & balas pesan WA otomatis via Twilio
- ✅ **AI Responses** - OpenAI GPT, Hugging Face, atau local rule-based
- ✅ **Conversation History** - Memory & context awareness
- ✅ **Real-time Analytics** - Statistics dashboard
- ✅ **Multi-user Support** - Handle multiple conversations
- ✅ **Easy Setup** - Copy-paste config, langsung jalan

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd chatbot
npm install
```

### 2. Konfigurasi (.env)

Copy `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

# Pilih salah satu untuk AI:
# Option A: OpenAI (terbaik)
OPENAI_API_KEY=sk-...
API_TYPE=openai

# Option B: Hugging Face (free, terbatas)
HUGGINGFACE_API_KEY=hf_...
API_TYPE=huggingface

# Option C: Local mode (tanpa API, demo)
API_TYPE=local

# WhatsApp via Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+1415...
```

### 3. Setup Twilio WhatsApp (Opsional)

Jika ingin WhatsApp integration:

1. Daftar di [Twilio.com](https://www.twilio.com/console)
2. Get **Account SID** & **Auth Token**
3. Setup **WhatsApp Sandbox** atau nomor verified
4. Update `.env` dengan credentials
5. Set **Webhook** di Twilio Console:
   - URL: `https://yourapp.com/webhook/twilio` (gunakan ngrok untuk testing)
   - Method: `POST`

### 4. Jalankan Server

**Development (auto-reload):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Output:

```
╔════════════════════════════════════════╗
║    AI Chatbot Server Running           ║
║    Port: 3000                          ║
║    Environment: development            ║
╚════════════════════════════════════════╝

📊 Dashboard: http://localhost:3000
🔗 WebSocket: ws://localhost:3000
📱 WhatsApp Webhook: POST /webhook/twilio
```

### 5. Akses Dashboard

Buka browser: **http://localhost:3000**

## 📱 Cara Kerja

### Web Dashboard

1. Ketik pesan di input box
2. Tekan "Kirim" atau Enter
3. Bot akan memproses & balasan muncul
4. Lihat statistics di sidebar

### WhatsApp

1. Kirim pesan ke nomor Twilio
2. Server terima di `/webhook/twilio`
3. Chatbot generate jawaban
4. Jawaban dikirim balik otomatis
5. Muncul di dashboard real-time

## 🔧 Konfigurasi AI

### A. OpenAI (Recommended)

1. Get API key: https://platform.openai.com/api-keys
2. Set di `.env`:

```env
OPENAI_API_KEY=sk-...
API_TYPE=openai
```

**Kelebihan:**
- Jawaban paling natural
- Understanding terbaik
- Support multi-language

**Biaya:** ~$0.001 per 1000 tokens

### B. Hugging Face (Free)

1. Get token: https://huggingface.co/settings/tokens
2. Set di `.env`:

```env
HUGGINGFACE_API_KEY=hf_...
API_TYPE=huggingface
```

**Kelebihan:**
- Gratis
- Banyak model tersedia

**Limitasi:**
- Rate limit ketat
- Kualitas lebih rendah

### C. Local Mode (Demo)

```env
API_TYPE=local
```

- No API needed
- Rule-based responses
- Cocok untuk testing

## 📊 API Endpoints

### REST API

```bash
# Health check
GET /health

# Status
GET /api/status
```

### WebSocket Events

**Client → Server:**

```js
socket.emit('user_message', { text: 'Hello' });
socket.emit('settings_update', { apiType: 'openai', ... });
```

**Server → Client:**

```js
socket.on('bot_message', (data) => {...});
socket.on('wa_incoming', (data) => {...});
socket.on('wa_status', (data) => {...});
```

## 🌐 Deployment

### Heroku

```bash
heroku create chatbot-app
git push heroku main
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set TWILIO_ACCOUNT_SID=AC...
```

### Railway/Render

1. Push ke GitHub
2. Connect repo
3. Set environment variables
4. Deploy

### VPS (Ubuntu)

```bash
# Install
sudo apt-get install nodejs npm
git clone <repo>
cd chatbot
npm install

# PM2 for auto-restart
npm install -g pm2
pm2 start server.js --name "chatbot"
pm2 startup
pm2 save

# Nginx reverse proxy
sudo apt-get install nginx
# Config /etc/nginx/sites-available/default
# point to localhost:3000
```

## 🔐 Security

- ❌ Jangan commit `.env` ke GitHub
- ✅ Gunakan `.gitignore`
- ✅ Enable HTTPS (Certbot/Let's Encrypt)
- ✅ Rate limit requests
- ✅ Validate input
- ✅ Encrypt sensitive data

## 📝 Logs

```bash
# View logs (development)
npm run dev

# Production (PM2)
pm2 logs chatbot
```

## 🐛 Troubleshooting

**Twilio webhook tidak trigger:**
- Check ngrok URL di Twilio Console
- Pastikan webhook URL benar
- Cek firewall/port

**OpenAI error:**
- Verify API key
- Check quota/billing
- Pastikan model tersedia

**Socket.IO not connecting:**
- Check CORS settings
- Verify WebSocket port
- Try hard refresh browser

## 📚 File Structure

```
chatbot/
├── public/
│   └── index.html          # Web Dashboard
├── server.js               # Express + Socket.IO
├── chatbot.js              # AI Logic
├── whatsapp-bot.js         # Twilio integration
├── package.json            # Dependencies
├── .env.example            # Config template
└── README.md               # Dokumentasi
```

## 📄 License

MIT © 2024 AdiKds

## 🤝 Support

Pertanyaan/issue? Buka GitHub issue atau hubungi:

- 📧 Email: admin@example.com
- 💬 WhatsApp: +62...
- 🌐 Website: https://example.com

---

**Happy Chatting! 🚀**