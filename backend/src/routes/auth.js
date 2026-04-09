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

      // Redirect to the extension's auth callback page with the token
      const authCallbackUrl = `${config.frontendUrl}/auth/success?token=${encodeURIComponent(token)}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&avatar=${encodeURIComponent(req.user.avatar || '')}`;
      
      res.redirect(authCallbackUrl);
    } catch (error) {
      logger.error('JWT generation error:', error);
      res.redirect('/auth/failure');
    }
  }
);

/**
 * GET /auth/success
 * Page that the extension reads the token from
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
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
          color: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .card {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 48px;
          text-align: center;
          max-width: 420px;
          width: 90%;
          animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .icon { font-size: 64px; margin-bottom: 16px; }
        h1 { font-size: 24px; color: #a78bfa; margin-bottom: 8px; }
        p { color: #9ca3af; margin-bottom: 24px; line-height: 1.6; }
        .close-text { font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">✅</div>
        <h1>Welcome to Rewise AI!</h1>
        <p>You're now logged in as <strong>${name || email}</strong>.<br>
        You can close this tab and start highlighting text!</p>
        <p class="close-text">This tab will close automatically...</p>
      </div>
      <script>
        // Send credentials to the extension
        const data = {
          token: ${JSON.stringify(token)},
          name: ${JSON.stringify(name)},
          email: ${JSON.stringify(email)},
          avatar: ${JSON.stringify(avatar)}
        };

        // Try sending message to extension
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          // Try to send directly to extension
          try {
            const extensionId = new URLSearchParams(window.location.search).get('ext');
            if (extensionId) {
              chrome.runtime.sendMessage(extensionId, { type: 'AUTH_SUCCESS', data });
            }
          } catch(e) { /* Extension messaging not available */ }
        }

        // Store in localStorage as fallback for the extension to read
        localStorage.setItem('rewise_auth', JSON.stringify(data));

        // Broadcast via BroadcastChannel for same-origin communication
        const bc = new BroadcastChannel('rewise_auth');
        bc.postMessage({ type: 'AUTH_SUCCESS', data });

        // Auto-close after a delay
        setTimeout(() => window.close(), 3000);
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
      <title>Rewise AI — Login Failed</title>
      <style>
        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
          color: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .card {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 48px;
          text-align: center;
          max-width: 420px;
        }
        .icon { font-size: 64px; margin-bottom: 16px; }
        h1 { color: #f87171; margin-bottom: 8px; }
        p { color: #9ca3af; }
        a { color: #a78bfa; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">❌</div>
        <h1>Login Failed</h1>
        <p>Something went wrong during authentication.<br>
        <a href="/auth/google">Try again</a></p>
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
