// chatbot.js - AI Logic & Natural Language Processing
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const API_TYPE = process.env.API_TYPE || 'local';

// Conversation Context (simple memory)
const conversationHistory = new Map();
const MAX_HISTORY = 10;

// Rule-based responses (fallback)
const responseRules = {
  greeting: [
    { patterns: ['halo', 'hi', 'hello', 'pagi', 'siang', 'malam'], responses: [
      'Halo! Apa kabar? Ada yang bisa saya bantu?',
      'Selamat datang! Apa yang bisa saya lakukan untuk Anda?'
    ]},
  ] ,
  weather: [
    { patterns: ['cuaca', 'weather', 'hujan', 'panas'], responses: [
      'Untuk informasi cuaca, silakan kunjungi weather.com atau beri tahu lokasi Anda.',
      'Saya tidak punya akses real-time cuaca. Coba cek aplikasi cuaca atau meteorologi.'
    ]}
  ],
  help: [
    { patterns: ['bantuan', 'help', 'cara', 'bagaimana'], responses: [
      'Saya bisa membantu dengan:\n1. Menjawab pertanyaan umum\n2. Memberikan informasi\n3. Berbincang santai\nAda yang ingin Anda tanya?',
      'Tanyakan apa saja! Saya di sini untuk membantu.'
    ]}
  ],
  thanks: [
    { patterns: ['terima kasih', 'thanks', 'makasih', 'tq'], responses: [
      'Sama-sama! Senang membantu. Ada lagi yang bisa saya bantu?',
      'Dengan senang hati! Hubungi saya lagi kapan saja.'
    ]}
  ]
};

/**
 * Main function to generate AI reply
 * @param {string} message - User message
 * @param {object} meta - Metadata (source, userId, from)
 * @returns {string} AI-generated reply
 */
async function generateReply(message, meta = {}) {
  if (!message || message.trim() === '') {
    return 'Maaf, saya tidak menerima pesan kosong. Bisa ulangi?';
  }

  const userId = meta.userId || meta.from || 'anonymous';
  const source = meta.source || 'unknown';

  // Get conversation history for context
  let context = conversationHistory.get(userId) || [];

  try {
    let reply;

    // 1. Try rule-based first (faster)
    const ruleReply = checkRulesAndRespond(message);
    if (ruleReply) {
      reply = ruleReply;
    } else {
      // 2. Use API-based AI
      if (OPENAI_API_KEY && API_TYPE === 'openai') {
        reply = await getOpenAIReply(message, context);
      } else if (HUGGINGFACE_API_KEY && API_TYPE === 'huggingface') {
        reply = await getHuggingFaceReply(message);
      } else {
        // Fallback: local smart response
        reply = getLocalResponse(message);
      }
    }

    // Update history
    context.push({ role: 'user', content: message });
    context.push({ role: 'assistant', content: reply });
    if (context.length > MAX_HISTORY) context = context.slice(-MAX_HISTORY);
    conversationHistory.set(userId, context);

    console.log(`[${source}] Q: ${message.substring(0, 50)}... => A: ${reply.substring(0, 50)}...`);
    return reply;
  } catch (err) {
    console.error('[Error generating reply]', err);
    return 'Maaf, terjadi kesalahan saat memproses pesan Anda. Coba lagi?';
  }
}

/**
 * Check rule-based patterns
 */
function checkRulesAndRespond(message) {
  const lower = message.toLowerCase();

  for (const category in responseRules) {
    const rules = responseRules[category];
    for (const rule of rules) {
      if (rule.patterns.some(p => lower.includes(p))) {
        return rule.responses[Math.floor(Math.random() * rule.responses.length)];
      }
    }
  }
  return null;
}

/**
 * OpenAI Chat Completion
 */
async function getOpenAIReply(message, context) {
  try {
    const systemPrompt = `Anda adalah asisten AI profesional yang ramah, berbahasa Indonesia. 
Berikan jawaban singkat, jelas, dan membantu. Hindari jawaban panjang atau teknis kecuali diminta.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...context,
      { role: 'user', content: message }
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 300,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('[OpenAI Error]', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Hugging Face Inference
 */
async function getHuggingFaceReply(message) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/openai-community/gpt2',
      { inputs: message },
      {
        headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
        timeout: 10000
      }
    );

    if (response.data && response.data[0] && response.data[0].generated_text) {
      return response.data[0].generated_text.trim();
    }
    return 'Maaf, tidak bisa generate jawaban saat ini.';
  } catch (err) {
    console.error('[HuggingFace Error]', err.message);
    throw err;
  }
}

/**
 * Local Smart Response (no API needed)
 */
function getLocalResponse(message) {
  const lower = message.toLowerCase();
  const length = message.length;

  // Analyze intent by keywords
  if (lower.includes('siapa') || lower.includes('nama')) {
    return 'Saya adalah AI Assistant. Nama saya Bot Cerdas. Senang berkenalan!';
  }
  if (lower.includes('apa')) {
    return 'Itu pertanyaan menarik! Bisa jelaskan lebih spesifik?';
  }
  if (lower.includes('berapa')) {
    return 'Untuk info numerik, butuh konteks lebih jelas. Coba ulangi pertanyaannya!';
  }
  if (lower.includes('bagaimana')) {
    return 'Tergantung situasinya. Bisa jelaskan lebih detail?';
  }
  if (lower.includes('kapan')) {
    return 'Waktu adalah relative. Lebih spesifik dong!';
  }
  if (length > 100) {
    return 'Wow, pertanyaan panjang! Saya mencoba memahami... Bisa disederhanakan?';
  }
  if (length < 3) {
    return 'Hmm, pesan sangat singkat. Bisa lebih jelas?';
  }

  // Generic response
  return `Anda mengatakan: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}". Menarik! Bisa jelaskan lebih lanjut?`;
}

/**
 * Clear conversation history for a user
 */
function clearHistory(userId) {
  conversationHistory.delete(userId);
}

/**
 * Get conversation history
 */
function getHistory(userId) {
  return conversationHistory.get(userId) || [];
}

module.exports = {
  generateReply,
  checkRulesAndRespond,
  clearHistory,
  getHistory,
  getOpenAIReply,
  getHuggingFaceReply,
  getLocalResponse
};