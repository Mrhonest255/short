# 🚀 Advanced URL Shortener

A next-generation URL shortening service with advanced features including analytics, QR codes, password protection, and custom aliases. Built for the future with modern web technologies.

> **⚠️ Deployment Note:** This app uses SQLite and is **NOT compatible with Vercel** serverless deployments. See [DEPLOYMENT.md](DEPLOYMENT.md) for recommended platforms like Railway, Render, or traditional VPS hosting.

## ✨ Features

- **🔗 Custom Short Links**: Create memorable, branded short URLs with custom aliases
- **📱 QR Code Generation**: Automatically generate QR codes for every shortened link
- **📊 Click Analytics**: Track clicks, view detailed statistics and engagement metrics
- **🔒 Password Protection**: Secure your links with password authentication
- **⏰ Link Expiration**: Set automatic expiration dates for temporary links
- **⚡ Lightning Fast**: Optimized backend with SQLite database for speed
- **🎨 Modern UI**: Beautiful, responsive interface with dark theme
- **🛡️ Security**: Built-in rate limiting and security headers with Helmet.js
- **📈 Real-time Stats**: View click history, timestamps, and referrer information

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Mrhonest255/short.git
cd short
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 📖 Usage

### Shortening a URL

1. Enter your long URL in the input field
2. (Optional) Customize with:
   - **Custom Alias**: Create a memorable short link
   - **Password**: Protect your link with a password
   - **Expiration**: Set when the link should expire
3. Click "Shorten URL"
4. Copy your new short link and QR code

### Viewing Statistics

Click the "View Statistics" button after creating a link to see:
- Total click count
- Creation and last accessed dates
- Expiration date (if set)
- Recent click history with timestamps

## 🔧 API Documentation

### Create Short URL

**POST** `/api/shorten`

Request body:
```json
{
  "url": "https://example.com/very-long-url",
  "customAlias": "my-link",
  "password": "secret123",
  "expiresIn": 7
}
```

Response:
```json
{
  "success": true,
  "shortUrl": "http://localhost:3000/abc123",
  "shortCode": "abc123",
  "originalUrl": "https://example.com/very-long-url",
  "qrCode": "http://localhost:3000/api/qr/abc123"
}
```

### Get Statistics

**POST** `/api/stats/:shortCode`

Request body (for password-protected URLs):
```json
{
  "password": "secret123"
}
```

Response:
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://example.com/very-long-url",
  "customAlias": "my-link",
  "createdAt": 1699887600000,
  "expiresAt": 1700492400000,
  "clickCount": 42,
  "lastAccessed": 1699974000000,
  "recentClicks": [...]
}
```

### Verify Password and Redirect

**POST** `/api/verify/:shortCode`

Request body:
```json
{
  "password": "secret123"
}
```

Response:
```json
{
  "success": true,
  "url": "https://example.com/very-long-url"
}
```

### Get QR Code

**GET** `/api/qr/:shortCode`

Response:
```json
{
  "qrCode": "data:image/png;base64,..."
}
```

### Redirect to Original URL

**GET** `/:shortCode`

Redirects to the original URL after recording the click. If the URL is password-protected, returns a password entry page.

## 🛠️ Technology Stack

- **Backend**: Node.js, Express
- **Database**: SQLite with better-sqlite3
- **Security**: Helmet.js, express-rate-limit
- **QR Codes**: qrcode library
- **ID Generation**: nanoid
- **Frontend**: Vanilla JavaScript, CSS3, HTML5

## 📁 Project Structure

```
short/
├── server.js           # Express server and API endpoints
├── package.json        # Project dependencies
├── urls.db            # SQLite database (auto-generated)
├── public/            # Frontend files
│   ├── index.html     # Main page
│   ├── styles.css     # Styling
│   ├── script.js      # Client-side JavaScript
│   ├── 404.html       # Error page
│   └── password.html  # Password protection page
└── README.md          # Documentation
```

## 🔒 Security Features

- **Rate Limiting**: Prevents abuse with 100 requests per 15 minutes per IP
- **Helmet.js**: Sets security HTTP headers including Content Security Policy
- **Secure Password Hashing**: Uses bcrypt with 10 salt rounds for password-protected links
- **POST for Sensitive Data**: Passwords transmitted via POST body, not GET query parameters
- **Input Validation**: URL validation and sanitization
- **CSP**: Content Security Policy to prevent XSS attacks
- **No Inline Scripts**: All JavaScript in external files to comply with CSP

## 🌐 Deployment

> **⚠️ Important:** This application uses SQLite which requires persistent file storage and is **NOT compatible with Vercel** or other serverless platforms that don't support native modules.

### ✅ Recommended Platforms

1. **Railway** (Recommended) - [Deploy Guide](DEPLOYMENT.md#1-railway-recommended)
   - Supports SQLite out of the box
   - Free tier available
   - One-click deployment

2. **Render** - [Deploy Guide](DEPLOYMENT.md#2-render)
   - Persistent disk support
   - Free tier available

3. **DigitalOcean/VPS** - [Deploy Guide](DEPLOYMENT.md#5-vps-deployment-digitalocean-linode-aws-ec2)
   - Full control
   - Best for production

**📖 See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions and platform comparisons.**

### Environment Variables

- `PORT`: Server port (default: 3000)

### Production Deployment

For production deployment, consider:

1. Using a reverse proxy (nginx, Apache)
2. Setting up HTTPS with SSL certificates
3. Using a production-grade database (PostgreSQL, MySQL)
4. Implementing proper logging and monitoring
5. Setting up automated backups

### Docker Deployment (Optional)

You can containerize the application with Docker:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🎯 Future Enhancements

- User accounts and authentication
- Bulk URL shortening
- Custom domains
- A/B testing for links
- Browser extensions
- Mobile apps
- API rate limiting per user
- Link preview images
- Geolocation tracking
- Integration with marketing tools

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for the future - 2055 and beyond!**