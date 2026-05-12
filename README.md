# 🧠 Rewise AI

**Capture, enhance, and revisit knowledge — powered by AI.**

Rewise AI is a Chrome Extension + Node.js backend system that lets you highlight text on any webpage, save it via right-click, process it with AI (summarization, explanation, examples, tagging), and receive weekly revision digests via email.

---

## 🏗️ Architecture

```
┌──────────────────┐     JWT Auth      ┌──────────────────┐
│  Chrome Extension │ ───────────────── │  Express Backend  │
│  (Manifest V3)    │                   │  (Node.js)        │
└──────────────────┘                   └────────┬─────────┘
                                               │
                                   ┌───────────┴───────────┐
                                   │                       │
                             ┌─────▼─────┐         ┌──────▼──────┐
                             │  MongoDB   │         │  BullMQ +   │
                             │  Atlas     │         │  Redis      │
                             └───────────┘         └──────┬──────┘
                                                          │
                                                   ┌──────▼──────┐
                                                   │  AI Worker   │
                                                   │  (HF/Ollama) │
                                                   └──────┬──────┘
                                                          │
                                                   ┌──────▼──────┐
                                                   │  Cron Job    │
                                                   │  + Email     │
                                                   └─────────────┘
```

---

## 📁 Project Structure

```
ReWiseAI/
├── backend/
│   ├── src/
│   │   ├── __tests__/          # Unit & integration tests
│   │   ├── config/             # Centralized configuration + validation
│   │   ├── middleware/         # Auth, error handling, validation
│   │   ├── models/             # Mongoose schemas (User, Highlight)
│   │   ├── routes/             # Express routes (auth, highlights, summary)
│   │   ├── services/           # AI service, email service
│   │   ├── queue/              # BullMQ queue, worker
│   │   ├── cron/               # Weekly digest cron job
│   │   ├── utils/              # Logger
│   │   └── index.js            # Express app entry point
│   ├── scripts/                # Utility scripts (validate-env, etc)
│   ├── .env.example            # Environment variable template
│   ├── jest.config.js          # Jest test configuration
│   └── package.json
├── extension/
│   ├── manifest.json           # Chrome MV3 manifest
│   ├── config.js               # Dynamic API configuration
│   ├── background.js           # Service worker (context menu)
│   ├── popup.html/css/js       # Extension popup UI
│   ├── auth.html/js            # OAuth callback handler
│   ├── content.js              # Content script (toasts)
│   └── icons/                  # Extension icons
├── .github/
│   └── workflows/              # GitHub Actions CI/CD pipelines
│       ├── test.yml            # Automated testing
│       └── lint.yml            # Code quality checks
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org))
- **MongoDB Atlas** account ([free tier](https://mongodb.com/atlas))
- **Redis** (local or cloud — [Upstash](https://upstash.com) free tier)
- **Google Cloud Console** project with OAuth 2.0 credentials
- **Hugging Face** account (free) OR **Ollama** installed locally
- **Chrome Browser** (for extension testing)

### 1. Clone & Install

```bash
git clone https://github.com/ishaaanfarooq/ReWiseAI.git
cd ReWiseAI/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/rewise-ai` |
| `JWT_SECRET` | Random secure string (use `openssl rand -hex 32`) | `a1b2c3d4e5f6...` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | `GOCSPX-xxx` |
| `GOOGLE_CALLBACK_URL` | OAuth redirect URI | `http://localhost:3000/auth/callback` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` or `redis://user:pass@host:port` |
| `AI_PROVIDER` | AI service provider | `gemini`, `huggingface`, or `ollama` |
| `GEMINI_API_KEY` | Google AI Studio API Key | `AIzaSyD...` |
| `GEMINI_MODEL` | Gemini model version | `gemini-2.0-flash` |
| `HF_ACCESS_TOKEN` | Hugging Face API token (if using HF) | `hf_xxx` |
| `OLLAMA_BASE_URL` | Ollama server URL (if using Ollama) | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model (if using Ollama) | `llama3.2` |
| `SMTP_HOST` | Email SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | Email address | `your-email@gmail.com` |
| `SMTP_PASS` | Gmail app password | (see Email Setup below) |
| `EMAIL_FROM` | Sender name in emails | `Rewise AI <noreply@rewise.ai>` |
| `EXTENSION_ID` | Chrome extension ID | (get from `chrome://extensions`) |
| `FRONTEND_URL` | Frontend URL (for CORS) | `http://localhost:3000` |

### 3. Validate Environment

```bash
npm run test:env
```

This validates that all required environment variables are set correctly.

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project → Enable "Google+ API" / "People API"
3. Go to **Credentials** → Create OAuth 2.0 Client ID
4. Choose "Web application"
5. Add **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)
6. Copy **Client ID** and **Client Secret** to your `.env`

### 5. Start Redis

**Option A: Local Redis**
```bash
# macOS
brew install redis && redis-server

# Ubuntu
sudo apt install redis-server && sudo systemctl start redis-server

# Windows (WSL recommended)
wsl redis-server
```

**Option B: Cloud Redis (Upstash)**
- Sign up at [upstash.com](https://upstash.com)
- Create a Redis database
- Copy the connection URL to `REDIS_URL` in `.env`

### 6. Start the Backend

```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: Queue Worker (in new terminal)
npm run worker

# Terminal 3: Cron Jobs (optional, in new terminal)
npm run cron
```

You should see:
```
✅ Connected to MongoDB
🚀 Rewise AI backend running on port 3000
🤖 AI Provider: gemini
```

### 7. Install the Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **"Load unpacked"** → Select the `extension/` folder from this repo
4. Copy the **Extension ID** from the extensions page
5. Add it to your `.env` as `EXTENSION_ID`

### 8. Use It!

1. Navigate to any webpage
2. **Select/highlight** some text
3. **Right-click** → Click **"📚 Add to Rewise AI"**
4. See a toast notification confirming save
5. Click the extension icon to view your stats!

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Watch Mode (Re-run on file changes)
```bash
npm run test:watch
```

### Run with Coverage Report
```bash
npm test -- --coverage
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Validate Environment Variables
```bash
npm run test:env
```

---

## 🔍 Code Quality

### Lint Check
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

---

## 📧 Email Setup (Gmail)

To enable weekly digest emails:

1. Enable 2-Factor Authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows Computer"
4. Google generates a 16-character password
5. Use your email as `SMTP_USER` and the generated password as `SMTP_PASS`

Example:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

> [!TIP]
> **Premium Dark-Themed Digests**: The system automatically generates elegant, dark-themed HTML emails with tag-based grouping and AI insights for a superior revision experience.

---

## 🤖 AI Providers

### Google Gemini (Recommended — Best Quality) ⭐

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-2.0-flash
```

**Why Gemini?**
- High-quality summarization and tagging
- Fast inference with generous free tier via [Google AI Studio](https://aistudio.google.com)
- No credit card required
- Excellent for production workloads

### Hugging Face (Cloud — Free)

```env
AI_PROVIDER=huggingface
HF_ACCESS_TOKEN=hf_your_token
```

- Uses `facebook/bart-large-cnn` for summarization
- Uses `mistralai/Mistral-7B-Instruct-v0.3` for text generation
- Free tier: ~300 requests/hour
- Get token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### Ollama (Local — Unlimited & Free)

```bash
# 1. Install Ollama from https://ollama.ai
# 2. Pull a model
ollama pull llama3.2

# 3. Set in .env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# 4. In another terminal, start Ollama
ollama serve
```

---

## 🚢 Deployment

### Backend (Render.com)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repository
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node src/index.js`
6. Add all environment variables from `.env` (Settings → Environment)
7. Deploy!

**For the Worker Service** (handles AI processing):
1. Create a new "Background Worker"
2. Set **Start Command**: `npm run worker`

### Backend (Railway.app)

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add a **Redis** plugin from the Railway Marketplace
5. Set environment variables (Variables tab)
6. Railway auto-detects `package.json` and deploys

### MongoDB Atlas (Database)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a Free Cluster
3. Create a database user (Security → Database Access)
4. Whitelist your IP address (Network Access)
   - For development: Add your current IP
   - For production: Add your deployment platform's IP or `0.0.0.0/0`
5. Get your connection string (Deployment → Drivers)
6. Add to `.env` as `MONGODB_URI`

### Extension (Chrome Web Store)

To distribute your extension:

1. Create a Google Play Developer account
2. Create extension package: `zip -r rewise-ai.zip extension/`
3. Upload to Chrome Web Store
4. Update `manifest.json` with your production domain
5. Set up auto-updates via Chrome Web Store

---

## 📊 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/auth/google` | ❌ | Start Google OAuth flow |
| GET | `/auth/callback` | ❌ | OAuth callback handler |
| GET | `/auth/me` | ✅ | Get current user profile |

### Highlights
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/highlights` | ✅ | Save a new highlight |
| GET | `/highlights` | ✅ | List all highlights (paginated) |
| GET | `/highlights/:id` | ✅ | Get single highlight details |
| DELETE | `/highlights/:id` | ✅ | Delete a highlight |
| POST | `/highlights/:id/reprocess` | ✅ | Re-queue failed highlight for AI processing |

### Summary & Stats
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/summary/stats` | ✅ | Get user statistics (total, processed, pending) |
| GET | `/summary/weekly` | ✅ | Get weekly digest data |
| GET | `/summary/weekly?email=true` | ✅ | Send weekly digest email |

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ | Health check endpoint |

### Pagination Example
```bash
GET /highlights?page=1&limit=20&status=processed&tag=javascript
```

Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `status` - Filter by status: `pending`, `processing`, `processed`, `failed`
- `tag` - Filter by AI-generated tag
- `sort` - Sort by: `createdAt`, `updatedAt` (add `-` prefix for descending)

---

## 🔐 Security

✅ **Security Features Implemented:**

- **JWT Authentication** with 7-day token expiry
- **Rate Limiting**
  - API: 100 requests/15 minutes per IP
  - Auth: 20 login attempts/15 minutes per IP
- **Input Validation & Sanitization** via express-validator
- **Helmet Security Headers** (CSP, X-Frame-Options, etc)
- **CORS Configuration** - Extension origin only
- **No Secrets in Client Code** - All API keys stored server-side
- **Password Hashing** with bcryptjs (for future user auth)
- **Environment Validation** - Warns if using default secrets in production

**Production Checklist:**
- [ ] Change `JWT_SECRET` to a random 32-character string
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS everywhere
- [ ] Enable MongoDB IP whitelist (not `0.0.0.0/0`)
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Enable CORS with specific domain only
- [ ] Rotate API keys regularly

---

## 📈 Scalability

| Concern | Solution |
|---------|----------|
| AI processing bottleneck | BullMQ job queue with configurable concurrency |
| Concurrent users | Stateless JWT auth, horizontal scaling ready |
| Database performance | Compound indexes on userId+status, userId+createdAt |
| Redis memory | Automatic job cleanup (keep last 100 completed, 50 failed) |
| API abuse | Express rate limiting per IP + request validation |
| Worker isolation | Queue worker runs as separate process |

### Scaling AI Processing

1. **Increase worker concurrency** (adjust `concurrency` in worker config)
2. **Run multiple worker instances** on separate servers
3. **Use Ollama cluster** with load balancing for self-hosted
4. **Upgrade to HuggingFace Pro** for higher rate limits
5. **Add Redis Cluster** for queue reliability
6. **Use AI API caching** to reduce redundant calls

---

## 🛠️ Development Workflow

### Using Antigravity (Google's AI Code Editor)

1. Open Antigravity with your repository
2. All new production files are auto-synced from GitHub
3. Edit `.env` locally (not committed to GitHub for security)
4. Run tests: `npm test`
5. Validate environment: `npm run test:env`
6. Push changes: Use Antigravity's git integration

```bash
# Pull latest changes
git pull origin main

# Create local .env (won't be committed)
cp .env.example .env
# Edit .env with your credentials

# Validate environment
npm run test:env

# Run tests
npm test

# Start development
npm run dev
```

---

## 🎯 Bonus Features (Included)

- ✅ **Tagging System** — AI auto-generates relevant topic tags
- ✅ **Difficulty Scoring** — Labels highlights as beginner/intermediate/advanced
- ✅ **Reprocess Failed Items** — Retry mechanism for failed AI processing
- ✅ **Stats Dashboard** — Real-time stats in extension popup
- ✅ **Visual Feedback** — Toast notifications on capture
- ✅ **Premium Email Templates** — Dark-themed, tag-grouped weekly digests
- ✅ **Job Queue System** — Async AI processing with BullMQ + Redis
- ✅ **Environment Validation** — Startup checks for all required configs
- ✅ **CI/CD Pipeline** — GitHub Actions for automated testing & linting
- 🔜 **Spaced Repetition** — Future feature (schema ready)
- 🔜 **Browser Sync** — Cross-device highlight sync
- 🔜 **Offline Support** — Service Worker caching

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Check MongoDB URI format and network access
# Visit MongoDB Atlas → Network Access → Add Your IP
```

### "Redis connection refused"
```bash
# Make sure Redis is running
redis-server

# Or use Upstash (cloud Redis)
```

### "Extension not loading"
```bash
# 1. Check Extension ID matches EXTENSION_ID in .env
# 2. Go to chrome://extensions and reload
# 3. Check console for errors (click "Errors")
```

### "AI processing fails"
```bash
# Validate AI provider configuration
npm run test:env

# Check API key validity:
# - Gemini: https://aistudio.google.com
# - HuggingFace: https://huggingface.co/settings/tokens
```

### "Emails not sending"
```bash
# 1. Verify Gmail app password (not regular password)
# 2. Check SMTP_USER and SMTP_PASS in .env
# 3. Ensure 2FA is enabled on Gmail account
# 4. Test: npm run test:email (if available)
```

---

## 📚 Learning Resources

- [Express.js Documentation](https://expressjs.com)
- [MongoDB Query Language](https://docs.mongodb.com/manual)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions)
- [BullMQ Queue Documentation](https://docs.bullmq.io)
- [Jest Testing Framework](https://jestjs.io)

---

## 🤝 Contributing

We welcome contributions! Please:

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m "Add my feature"`
3. Push to GitHub: `git push origin feature/my-feature`
4. Open a Pull Request with description

---

## 📄 License

MIT — Built with ❤️ for learners everywhere.

---

## 📞 Support

- **Issues**: Open a [GitHub Issue](https://github.com/ishaaanfarooq/ReWise.AI/issues)
- **Discussions**: Start a [GitHub Discussion](https://github.com/ishaaanfarooq/ReWise.AI/discussions)
- **Email**: [Contact](mailto:contact@rewise.ai)
