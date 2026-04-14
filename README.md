# 🧠 Rewise AI

**Capture, enhance, and revisit knowledge — powered by AI.**

Rewise AI is a Chrome Extension + Node.js backend system that lets you highlight text on any webpage, save it via right-click, process it with AI (summarization, explanation, examples, tagging), and receive weekly revision digest emails.

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
│   │   ├── config/          # Centralized configuration
│   │   ├── middleware/       # Auth, error handling, validation
│   │   ├── models/           # Mongoose schemas (User, Highlight)
│   │   ├── routes/           # Express routes (auth, highlights, summary)
│   │   ├── services/         # AI service, email service
│   │   ├── queue/            # BullMQ queue, worker
│   │   ├── cron/             # Weekly digest cron job
│   │   ├── utils/            # Logger
│   │   └── index.js          # Express app entry point
│   ├── .env.example          # Environment variable template
│   └── package.json
├── extension/
│   ├── manifest.json         # Chrome MV3 manifest
│   ├── background.js         # Service worker (context menu)
│   ├── popup.html/css/js     # Extension popup UI
│   ├── auth.html/js          # OAuth callback handler
│   └── icons/                # Extension icons
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **MongoDB Atlas** account (free tier works)
- **Redis** (local or cloud — [Upstash](https://upstash.com) free tier)
- **Google Cloud Console** project with OAuth 2.0 credentials
- **Hugging Face** account (free) OR **Ollama** installed locally

### 1. Clone & Install

```bash
git clone https://github.com/your-username/ReWiseAI.git
cd ReWiseAI/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random secure string (use `openssl rand -hex 32`) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `REDIS_URL` | Redis connection URL |
| `AI_PROVIDER` | `gemini`, `huggingface`, or `ollama` |
| `GEMINI_API_KEY` | Your Google AI Studio API Key |
| `GEMINI_MODEL` | Preferred model (e.g., `gemini-1.5-flash`) |
| `HF_ACCESS_TOKEN` | Hugging Face API token (if using HF) |
| `SMTP_USER` / `SMTP_PASS` | Email credentials (Gmail app password) |

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project → Enable "Google+ API" / "People API"
3. Go to **Credentials** → Create OAuth 2.0 Client ID
4. Set **Authorized redirect URIs**: `http://localhost:3000/auth/callback`
5. Copy Client ID and Secret to your `.env`

### 4. Start Redis

**Option A: Local Redis**
```bash
# macOS
brew install redis && redis-server

# Ubuntu
sudo apt install redis-server && sudo systemctl start redis
```

**Option B: Cloud Redis (Upstash)**
- Sign up at [upstash.com](https://upstash.com) → Create a Redis database
- Copy the connection URL to `REDIS_URL` in `.env`

### 5. Start the Backend

```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: Queue Worker
npm run worker

# Terminal 3: Cron Jobs (optional, for weekly emails)
npm run cron
```

### 6. Install the Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **"Load unpacked"** → Select the `extension/` folder
4. Copy the **Extension ID** from the extensions page
5. Add it to your `.env` as `EXTENSION_ID`

### 7. Use It!

1. Navigate to any webpage
2. **Select/highlight** some text
3. **Right-click** → Click **"📚 Add to Rewise AI"**
4. Click the extension icon to see your stats!

---

---

## 🤖 AI Providers

### Google Gemini (Recommended — Best Quality)

Set in `.env`:
```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-1.5-flash
```

- High-quality summarization, explanation, and tagging.
- Fast inference with generous free tier via Google AI Studio.

### Hugging Face (Cloud — Free)

Set in `.env`:
```
AI_PROVIDER=huggingface
HF_ACCESS_TOKEN=hf_your_token
```

- Uses `facebook/bart-large-cnn` for summarization
- Uses `mistralai/Mistral-7B-Instruct-v0.3` for text generation
- Free tier: ~300 requests/hour

### Ollama (Local — Unlimited)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# Set in .env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

---

---

## 📧 Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use your email as `SMTP_USER` and the app password as `SMTP_PASS`

> [!TIP]
> **Premium Dark-Themed Digests**: The system automatically generates elegant, dark-themed HTML emails with tag-based grouping and AI insights for a superior revision experience.

---

## 🚢 Deployment

### Backend (Render)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo → Set build command: `npm install`
4. Set start command: `node src/index.js`
5. Add all environment variables from `.env`
6. Deploy!

> **Note**: For the worker, create a separate "Background Worker" service with start command `npm run worker`.

### Backend (Railway)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add a Redis plugin from the Railway marketplace
4. Set environment variables
5. Deploy!

### MongoDB Atlas

1. [mongodb.com/atlas](https://mongodb.com/atlas) → Free Cluster
2. Create a database user
3. Whitelist your deployment IP (or `0.0.0.0/0` for any)
4. Copy the connection string to `MONGODB_URI`

---

## 📊 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/auth/google` | ❌ | Start Google OAuth |
| GET | `/auth/callback` | ❌ | OAuth callback |
| GET | `/auth/me` | ✅ | Get current user |
| POST | `/highlights` | ✅ | Save a highlight |
| GET | `/highlights` | ✅ | List highlights (paginated) |
| GET | `/highlights/:id` | ✅ | Get single highlight |
| DELETE | `/highlights/:id` | ✅ | Delete highlight |
| POST | `/highlights/:id/reprocess` | ✅ | Re-queue failed highlight |
| GET | `/summary/weekly` | ✅ | Get weekly digest |
| GET | `/summary/stats` | ✅ | Get user stats |
| GET | `/health` | ❌ | Health check |

### Pagination

```
GET /highlights?page=1&limit=20&status=processed&tag=javascript
```

---

## 🔐 Security

- **JWT authentication** with expiry
- **Rate limiting** (100 req/15min for API, 20 req/15min for auth)
- **Input validation & sanitization** via express-validator
- **Helmet** security headers
- **CORS** configured for extension origin only
- **No secrets in client code** — all API keys on the server

---

## 📈 Scalability

| Concern | Solution |
|---------|----------|
| AI processing bottleneck | BullMQ queue with 3x concurrency + rate limiting |
| Concurrent users | Stateless JWT auth, horizontal scaling |
| Database performance | Compound indexes on userId+status, userId+createdAt |
| Redis memory | Job cleanup policies (keep last 100 completed, 50 failed) |
| API abuse | Express rate limiting per IP |
| Worker isolation | Runs as separate process from API server |

### Scaling AI Processing

1. **Increase worker concurrency** (adjust `concurrency` in worker config)
2. **Run multiple worker instances** on separate servers
3. **Use Ollama cluster** with load balancing for self-hosted
4. **Upgrade to HuggingFace Pro** for higher rate limits
5. **Add Redis Cluster** for queue reliability

---

## 🎯 Bonus Features (Included)

- ✅ **Tagging system** — AI auto-generates topic tags
- ✅ **Difficulty scoring** — beginner/intermediate/advanced
- ✅ **Reprocess failed highlights** — retry mechanism
- ✅ **Stats dashboard** — in extension popup
- ✅ **Visual Feedback** — Real-time toast notifications on capture
- ✅ **Premium Templates** — Dark-themed, grouped weekly digests
- 🔜 **Spaced repetition** — future feature (schema ready)

---

## 📄 License

MIT — Built with ❤️ for learners everywhere.
