# Deployment Guide

This guide explains how to deploy the Advanced URL Shortener to various platforms.

## ⚠️ Important Note about Vercel

**This application uses SQLite (better-sqlite3) which is NOT compatible with Vercel's serverless architecture.**

Vercel runs on serverless functions that:
- Don't have persistent file storage
- Don't support native Node.js modules like better-sqlite3
- Spin up and down dynamically

### Alternatives for Vercel Deployment

If you want to deploy to Vercel, you'll need to:

1. **Replace SQLite with a cloud database:**
   - PostgreSQL (recommended: Vercel Postgres, Neon, Supabase)
   - MongoDB (MongoDB Atlas)
   - MySQL (PlanetScale)

2. **Use Vercel KV (Redis)** for simple key-value storage
   - Good for the URL shortener functionality
   - Limited analytics capabilities

3. **Switch to a traditional hosting platform** (see below)

## ✅ Recommended Deployment Platforms

### 1. Railway (Recommended)

Railway supports SQLite and persistent storage.

**Steps:**
1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js and deploy
5. Your app will be live with a railway.app domain

**Pros:**
- Works with SQLite out of the box
- Free tier available
- Easy deployment
- Persistent storage

### 2. Render

Render also supports SQLite with persistent disks.

**Steps:**
1. Create account at [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add a persistent disk (for SQLite database)
6. Deploy

**Pros:**
- Free tier available
- Persistent disk for SQLite
- Auto-deploy on git push

### 3. DigitalOcean App Platform

**Steps:**
1. Create account at [digitalocean.com](https://digitalocean.com)
2. Go to App Platform
3. Connect GitHub repository
4. Configure build and run commands
5. Deploy

**Cost:** Starting at $5/month

### 4. Heroku

**Steps:**
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create`
4. Deploy: `git push heroku main`

**Note:** You'll need the Heroku Postgres add-on (requires migration from SQLite)

### 5. VPS Deployment (DigitalOcean, Linode, AWS EC2)

For full control, deploy on a VPS:

**Steps:**
1. Get a VPS (Ubuntu recommended)
2. SSH into your server
3. Install Node.js and npm
4. Clone your repository
5. Run `npm install`
6. Set up PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js
   pm2 startup
   pm2 save
   ```
7. Configure nginx as reverse proxy (optional)
8. Set up SSL with Let's Encrypt

## 🔧 Environment Variables

Set these environment variables on your deployment platform:

```
PORT=3000
NODE_ENV=production
```

## 📦 For Production

Before deploying:

1. **Update dependencies:**
   ```bash
   npm update
   npm audit fix
   ```

2. **Test locally:**
   ```bash
   npm start
   ```

3. **Set NODE_ENV:**
   ```bash
   export NODE_ENV=production
   ```

## 🗄️ Database Migration (If needed for Vercel)

If you decide to migrate from SQLite to PostgreSQL for Vercel:

1. **Update package.json:**
   ```json
   {
     "dependencies": {
       "pg": "^8.11.0",
       "pg-promise": "^11.5.4"
     }
   }
   ```

2. **Create PostgreSQL schema:**
   ```sql
   CREATE TABLE urls (
     id SERIAL PRIMARY KEY,
     short_code VARCHAR(20) UNIQUE NOT NULL,
     original_url TEXT NOT NULL,
     custom_alias VARCHAR(50) UNIQUE,
     password_hash VARCHAR(255),
     expires_at BIGINT,
     created_at BIGINT NOT NULL,
     click_count INTEGER DEFAULT 0,
     last_accessed BIGINT
   );

   CREATE TABLE clicks (
     id SERIAL PRIMARY KEY,
     short_code VARCHAR(20) NOT NULL,
     clicked_at BIGINT NOT NULL,
     ip_address VARCHAR(45),
     user_agent TEXT,
     referer TEXT
   );

   CREATE INDEX idx_short_code ON urls(short_code);
   CREATE INDEX idx_custom_alias ON urls(custom_alias);
   CREATE INDEX idx_clicks_short_code ON clicks(short_code);
   ```

3. **Update server.js** to use PostgreSQL instead of SQLite

## 🚀 Quick Deploy Commands

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render
```bash
# Just push to GitHub
git push origin main
# Then connect via Render dashboard
```

## 🔗 Domain Setup

After deployment, you can add a custom domain:

1. Go to your platform's dashboard
2. Navigate to custom domains
3. Add your domain (e.g., short.yourdomain.com)
4. Update DNS records with provided values
5. Wait for DNS propagation (usually < 1 hour)

## 📊 Monitoring

Consider adding monitoring:
- **Uptime monitoring:** UptimeRobot, Pingdom
- **Error tracking:** Sentry
- **Analytics:** Google Analytics, Plausible

## 💡 Tips

- Always use HTTPS in production
- Set up regular database backups
- Monitor disk usage (SQLite database will grow)
- Use a CDN for static files if needed
- Consider adding rate limiting adjustments for production traffic

---

**Need help?** Open an issue on GitHub or check platform-specific documentation.
