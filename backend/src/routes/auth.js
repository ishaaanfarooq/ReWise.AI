import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const router = Router();

// ─── Configure Passport Google Strategy ──────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value || null,
          });
          logger.info(`New user created: ${user.email}`);
        }

        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// ─── Routes ──────────────────────────────────────────────────

/**
 * GET /auth/google
 * Initiates Google OAuth flow
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

/**
 * GET /auth/callback
 * Google OAuth callback — generates JWT and redirects to extension
 */
router.get(
  '/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/failure',
  }),
  (req, res) => {
    try {
      // Generate JWT
      const token = jwt.sign(
        {
          userId: req.user._id,
          email: req.user.email,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiry }
      );

      const params = new URLSearchParams({
        token,
        name: req.user.name || '',
        email: req.user.email || '',
        avatar: req.user.avatar || '',
      });

      // Redirect to the extension's own auth.html page so chrome.storage works
      if (config.extensionId) {
        const extensionAuthUrl = `chrome-extension://${config.extensionId}/auth.html?${params.toString()}`;
        res.redirect(extensionAuthUrl);
      } else {
        // Fallback to server-hosted success page
        res.redirect(`/auth/success?${params.toString()}`);
      }
    } catch (error) {
      logger.error('JWT generation error:', error);
      res.redirect('/auth/failure');
    }
  }
);

/**
 * GET /auth/success
 * Fallback success page (used when EXTENSION_ID isn't set)
 */
router.get('/success', (req, res) => {
  const { token, name, email, avatar } = req.query;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rewise AI — Login Successful</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: linear-gradient(145deg, #fdf8f0 0%, #f5e6d3 35%, #e8d5b7 70%, #dfc9a0 100%);
          color: #3d2b1f;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .container {
          max-width: 520px;
          width: 100%;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(184, 134, 11, 0.15);
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow: 0 8px 40px rgba(139, 90, 43, 0.1), 0 1px 3px rgba(139, 90, 43, 0.06);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #b8860b, #d4a574);
          color: #fff;
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.3px;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 28px;
          font-weight: 700;
          color: #2c1810;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .subtitle {
          font-size: 15px;
          color: #7a6652;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .subtitle strong { color: #4a3425; }
        .steps {
          list-style: none;
          padding: 0;
          margin-bottom: 28px;
        }
        .steps li {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(184, 134, 11, 0.08);
          font-size: 14px;
          color: #5c4a3a;
          line-height: 1.5;
        }
        .steps li:last-child { border-bottom: none; }
        .step-num {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f5e6d3, #e8d5b7);
          color: #8b5a2b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }
        .notice {
          background: linear-gradient(135deg, #fef9f0, #fdf3e4);
          border: 1px solid rgba(184, 134, 11, 0.12);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 13px;
          color: #7a6652;
          line-height: 1.5;
          margin-bottom: 28px;
        }
        .notice-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .close-msg {
          text-align: center;
          font-size: 13px;
          color: #a0917e;
          font-weight: 500;
        }
        .close-msg .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #d4a574;
          border-radius: 50%;
          margin: 0 2px;
          animation: pulse 1.4s ease-in-out infinite;
        }
        .close-msg .dot:nth-child(2) { animation-delay: 0.2s; }
        .close-msg .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="badge">✓ Authenticated</div>
          <h1>Welcome to Rewise AI</h1>
          <p class="subtitle">You're signed in as <strong>${name || email}</strong>. Your knowledge capture system is ready.</p>
          
          <ul class="steps">
            <li>
              <span class="step-num">1</span>
              <span><strong>Highlight text</strong> on any webpage and right-click → <em>"📚 Add to Rewise AI"</em></span>
            </li>
            <li>
              <span class="step-num">2</span>
              <span><strong>AI processes</strong> your highlights — generating summaries, explanations, examples, and tags automatically</span>
            </li>
            <li>
              <span class="step-num">3</span>
              <span><strong>Weekly email digest</strong> arrives every Sunday at 9 AM with a curated revision of everything you captured</span>
            </li>
          </ul>

          <div class="notice">
            <span class="notice-icon">📬</span>
            <span>Your digest will be sent to <strong>${email}</strong>. If you don't see it, check your <strong>Spam</strong> or <strong>Promotions</strong> folder and mark it as "Not Spam".</span>
          </div>

          <p class="close-msg">Closing this tab <span class="dot"></span><span class="dot"></span><span class="dot"></span></p>
        </div>
      </div>
      <script>
        const data = {
          token: ${JSON.stringify(token)},
          name: ${JSON.stringify(name)},
          email: ${JSON.stringify(email)},
          avatar: ${JSON.stringify(avatar)}
        };

        // Try sending to extension via external messaging
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          try {
            const extensionId = new URLSearchParams(window.location.search).get('ext');
            if (extensionId) {
              chrome.runtime.sendMessage(extensionId, { type: 'AUTH_SUCCESS', data });
            }
          } catch(e) {}
        }

        localStorage.setItem('rewise_auth', JSON.stringify(data));

        const bc = new BroadcastChannel('rewise_auth');
        bc.postMessage({ type: 'AUTH_SUCCESS', data });

        setTimeout(() => window.close(), 4000);
      </script>
    </body>
    </html>
  `);
});

/**
 * GET /auth/failure
 * OAuth failure page
 */
router.get('/failure', (req, res) => {
  res.status(401).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rewise AI — Login Failed</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: linear-gradient(145deg, #fdf8f0, #f5e6d3, #e8d5b7);
          color: #3d2b1f;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }
        .card {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(184, 134, 11, 0.15);
          border-radius: 24px;
          padding: 48px 40px;
          text-align: center;
          max-width: 420px;
          box-shadow: 0 8px 40px rgba(139, 90, 43, 0.1);
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .icon { font-size: 56px; margin-bottom: 20px; }
        h1 { font-size: 24px; font-weight: 700; color: #8b3a3a; margin-bottom: 12px; }
        p { color: #7a6652; font-size: 15px; line-height: 1.6; }
        a {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 28px;
          background: linear-gradient(135deg, #b8860b, #d4a574);
          color: #fff;
          text-decoration: none;
          border-radius: 100px;
          font-weight: 600;
          font-size: 14px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        a:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(184, 134, 11, 0.3); }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">⚠️</div>
        <h1>Authentication Failed</h1>
        <p>Something went wrong during sign-in. Please try again.</p>
        <a href="/auth/google">Try Again</a>
      </div>
    </body>
    </html>
  `);
});

/**
 * GET /auth/me
 * Returns current user info (requires JWT)
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId).select('-__v').lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

export default router;
