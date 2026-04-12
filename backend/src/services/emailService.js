import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this._init();
  }

  _init() {
    if (!config.email.user || !config.email.pass) {
      logger.warn('Email credentials not configured — email service disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    logger.info('Email service initialized');
  }

  /**
   * Send the weekly revision digest email
   */
  async sendWeeklyDigest(userEmail, userName, digest) {
    if (!this.transporter) {
      logger.warn('Email service not configured, skipping email send');
      return false;
    }

    const { totalHighlights, tagGroups, aiDigest, period } = digest;

    // Build HTML email
    const html = this._buildDigestEmail(userName, totalHighlights, tagGroups, aiDigest, period);

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to: userEmail,
        subject: `📚 Your Weekly Revision Digest — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
        html,
      });

      logger.info(`Weekly digest sent to ${userEmail}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${userEmail}:`, error.message);
      return false;
    }
  }

  /**
   * Build a premium HTML email template
   */
  _buildDigestEmail(userName, totalHighlights, tagGroups, aiDigest, period) {
    const tagSections = Object.entries(tagGroups || {})
      .map(
        ([tag, highlights]) => `
        <div style="margin-bottom: 32px;">
          <div style="display: inline-block; padding: 6px 16px; background: rgba(212, 165, 116, 0.15); color: #e2b781; border: 1px solid rgba(212, 165, 116, 0.3); border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">
            ${tag}
          </div>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${highlights
              .map((h) => {
                const title = h.pageTitle || 'Saved Note';
                const content = h.aiEnhanced?.summary || h.text.substring(0, 200) + '...';
                return `
              <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; text-align: left;">
                <h4 style="margin: 0 0 12px; color: #ffffff; font-size: 18px; font-weight: 600; line-height: 1.4;">${title}</h4>
                <p style="margin: 0 0 20px; color: #a1a1aa; font-size: 15px; line-height: 1.6;">${content}</p>
                ${h.sourceUrl ? `<a href="${h.sourceUrl}" style="display: inline-block; color: #d4a574; font-size: 14px; font-weight: 600; text-decoration: none; border-bottom: 1px solid transparent;">Source ↗</a>` : ''}
              </div>
            `;
              })
              .join('')}
          </div>
        </div>
      `
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1f1f1f, #141414); border: 1px solid #2a2a2a; border-radius: 16px 16px 0 0; border-bottom: none; padding: 48px 32px; text-align: center;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(212, 165, 116, 0.1); border-radius: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px;">🧠</span>
          </div>
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Rewise AI</h1>
          <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 16px;">Your Weekly Revision Digest</p>
        </div>

        <!-- Body -->
        <div style="background: #111111; padding: 40px 32px; border-radius: 0 0 16px 16px; border: 1px solid #2a2a2a; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          
          <div style="margin-bottom: 32px;">
            <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 8px;">
              Hi ${userName} 👋
            </p>
            <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0;">
              You saved <strong style="color: #d4a574; font-weight: 600;">${totalHighlights} highlight${totalHighlights !== 1 ? 's' : ''}</strong> this week. 
              Here's your personalized revision summary.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #2a2a2a; margin: 0 0 32px;">

          <!-- AI Digest -->
          ${
            aiDigest
              ? `
            <div style="background: linear-gradient(to right, rgba(212, 165, 116, 0.05), transparent); border-left: 3px solid #d4a574; padding: 24px; border-radius: 0 12px 12px 0; margin-bottom: 40px;">
              <h3 style="margin: 0 0 12px; color: #d4a574; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">✨ AI Summary</h3>
              <p style="margin: 0; color: #e4e4e7; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${aiDigest}</p>
            </div>
          `
              : ''
          }

          <!-- Tag Groups -->
          <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 24px;">📝 By Topic</h3>
          <div style="margin-bottom: 40px;">
            ${tagSections || '<div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 32px; text-align: center;"><p style="color: #52525b; font-size: 15px; font-style: italic; margin: 0;">No tagged highlights this week.</p></div>'}
          </div>

          <hr style="border: none; border-top: 1px solid #2a2a2a; margin: 0 0 32px;">

          <div style="text-align: center;">
            <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 0;">
              Period: ${new Date(period?.from).toLocaleDateString()} — ${new Date(period?.to).toLocaleDateString()}<br>
              You're receiving this because you have weekly digests enabled in Rewise AI.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 24px;">
          <p style="color: #52525b; font-size: 13px; margin: 0;">
            &copy; ${new Date().getFullYear()} Rewise AI &middot; Built with ❤️ for learners
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

const emailService = new EmailService();
export default emailService;
