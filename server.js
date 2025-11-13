const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Database = require('better-sqlite3');
const { nanoid } = require('nanoid');
const QRCode = require('qrcode');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database('urls.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    custom_alias TEXT UNIQUE,
    password_hash TEXT,
    expires_at INTEGER,
    created_at INTEGER NOT NULL,
    click_count INTEGER DEFAULT 0,
    last_accessed INTEGER
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code TEXT NOT NULL,
    clicked_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    referer TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
  CREATE INDEX IF NOT EXISTS idx_custom_alias ON urls(custom_alias);
  CREATE INDEX IF NOT EXISTS idx_clicks_short_code ON clicks(short_code);
`);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Helper functions
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateShortCode() {
  return nanoid(7);
}

// API Endpoints

// Create shortened URL
app.post('/api/shorten', (req, res) => {
  const { url, customAlias, password, expiresIn } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  let shortCode = customAlias || generateShortCode();
  const passwordHash = password ? hashPassword(password) : null;
  const expiresAt = expiresIn ? Date.now() + (expiresIn * 24 * 60 * 60 * 1000) : null;

  try {
    const stmt = db.prepare(`
      INSERT INTO urls (short_code, original_url, custom_alias, password_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(shortCode, url, customAlias || null, passwordHash, expiresAt, Date.now());

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      shortUrl: `${baseUrl}/${shortCode}`,
      shortCode,
      originalUrl: url,
      qrCode: `${baseUrl}/api/qr/${shortCode}`
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Custom alias already exists' });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Failed to create short URL' });
    }
  }
});

// Get URL statistics
app.get('/api/stats/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const { password } = req.query;

  const urlData = db.prepare('SELECT * FROM urls WHERE short_code = ? OR custom_alias = ?').get(shortCode, shortCode);

  if (!urlData) {
    return res.status(404).json({ error: 'URL not found' });
  }

  // Check password if protected
  if (urlData.password_hash && (!password || hashPassword(password) !== urlData.password_hash)) {
    return res.status(401).json({ error: 'Password required or incorrect' });
  }

  // Get click history
  const clicks = db.prepare(`
    SELECT clicked_at, ip_address, user_agent, referer
    FROM clicks
    WHERE short_code = ?
    ORDER BY clicked_at DESC
    LIMIT 100
  `).all(shortCode);

  res.json({
    shortCode: urlData.short_code,
    originalUrl: urlData.original_url,
    customAlias: urlData.custom_alias,
    createdAt: urlData.created_at,
    expiresAt: urlData.expires_at,
    clickCount: urlData.click_count,
    lastAccessed: urlData.last_accessed,
    recentClicks: clicks
  });
});

// Generate QR code
app.get('/api/qr/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/${shortCode}`;

  try {
    const qrCode = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    res.json({ qrCode });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Redirect to original URL
app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const { password } = req.query;

  const urlData = db.prepare('SELECT * FROM urls WHERE short_code = ? OR custom_alias = ?').get(shortCode, shortCode);

  if (!urlData) {
    return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }

  // Check if expired
  if (urlData.expires_at && urlData.expires_at < Date.now()) {
    return res.status(410).send('This link has expired');
  }

  // Check password if protected
  if (urlData.password_hash) {
    if (!password || hashPassword(password) !== urlData.password_hash) {
      return res.status(401).sendFile(path.join(__dirname, 'public', 'password.html'));
    }
  }

  // Record click
  try {
    db.prepare(`
      INSERT INTO clicks (short_code, clicked_at, ip_address, user_agent, referer)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      urlData.short_code,
      Date.now(),
      req.ip,
      req.get('user-agent'),
      req.get('referer') || null
    );

    // Update click count
    db.prepare(`
      UPDATE urls
      SET click_count = click_count + 1, last_accessed = ?
      WHERE short_code = ?
    `).run(Date.now(), urlData.short_code);
  } catch (error) {
    console.error('Failed to record click:', error);
  }

  res.redirect(urlData.original_url);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Advanced URL Shortener running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to get started`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});
