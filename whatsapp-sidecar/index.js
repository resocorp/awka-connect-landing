const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const express = require('express');
const qrcode = require('qrcode');
const pino = require('pino');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;
const HOST = '127.0.0.1';

const logger = pino({ level: 'silent' });

let sock = null;
let currentQRDataURL = null;
let connectionState = 'disconnected';
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger,
    browser: ['PHSWEB CRM', 'Chrome', '1.0.0'],
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        currentQRDataURL = await qrcode.toDataURL(qr);
        connectionState = 'qr_pending';
        console.log('[WhatsApp] QR code ready — scan via CRM Settings > WhatsApp');
      } catch (e) {
        console.error('[WhatsApp] QR generation error:', e.message);
      }
    }

    if (connection === 'close') {
      currentQRDataURL = null;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        connectionState = 'logged_out';
        console.log('[WhatsApp] Logged out. Delete auth_info_baileys/ and restart to re-pair.');
      } else if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        connectionState = 'reconnecting';
        reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        console.log(`[WhatsApp] Connection closed (${statusCode}). Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);
        setTimeout(connectToWhatsApp, delay);
      } else {
        connectionState = 'disconnected';
        console.error('[WhatsApp] Max reconnect attempts reached. Manual restart required.');
      }
    }

    if (connection === 'open') {
      connectionState = 'connected';
      currentQRDataURL = null;
      reconnectAttempts = 0;
      console.log('[WhatsApp] Connected successfully');
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// POST /send-message — { phone: "2348066137843", message: "Hello" }
app.post('/send-message', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message are required' });
  }

  if (connectionState !== 'connected' || !sock) {
    return res.status(503).json({ error: `WhatsApp not connected (state: ${connectionState})` });
  }

  try {
    const digits = phone.replace(/[^0-9]/g, '');
    const jid = `${digits}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    res.json({ success: true, to: jid });
  } catch (error) {
    console.error('[WhatsApp] Send error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /status — connection health check
app.get('/status', (req, res) => {
  res.json({ status: connectionState, hasQR: !!currentQRDataURL });
});

// GET /qr — returns base64 QR data URL for scanning
app.get('/qr', (req, res) => {
  if (!currentQRDataURL) {
    return res.status(404).json({ error: connectionState === 'connected' ? 'Already connected' : 'No QR code available yet — wait a moment and retry' });
  }
  res.json({ qr: currentQRDataURL });
});

app.listen(PORT, HOST, () => {
  console.log(`[WhatsApp] Sidecar listening on ${HOST}:${PORT}`);
  connectToWhatsApp().catch((e) => {
    console.error('[WhatsApp] Startup error:', e.message);
  });
});
