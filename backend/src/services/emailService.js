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
        <div style="margin-bottom: 24px;">
          <div style="display: inline-block; padding: 4px 12px; background: #a78bfa; color: #fff; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
            ${tag}
          </div>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            ${highlights
              .map(
                (h) => `
              <li style="margin-bottom: 8px; line-height: 1.5;">
                <strong style="color: #1f2937;">${h.aiEnhanced?.summary || h.text.slice(0, 100)}</strong>
                ${h.sourceUrl ? `<br><a href="${h.sourceUrl}" style="color: #6366f1; font-size: 12px; text-decoration: none;">Source ↗</a>` : ''}
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: 'Inter', 'Segoe UI', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 16px 16px 0 0; padding: 40px 32px; text-align: center;">
          <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 700;">🧠 Rewise AI</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 16px;">Your Weekly Revision Digest</p>
        </div>

        <!-- Body -->
        <div style="background: #fff; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
            Hi <strong>${userName}</strong> 👋
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            You saved <strong style="color: #4f46e5;">${totalHighlights} highlight${totalHighlights !== 1 ? 's' : ''}</strong> this week.
            Here's your personalized revision summary.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

          <!-- AI Digest -->
          ${
            aiDigest
              ? `
            <div style="background: #faf5ff; border-left: 4px solid #a78bfa; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
              <h3 style="margin: 0 0 8px; color: #6d28d9; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">✨ AI Summary</h3>
              <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${aiDigest}</p>
            </div>
          `
              : ''
          }

          <!-- Tag Groups -->
          <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 16px;">📝 By Topic</h3>
          ${tagSections || '<p style="color: #9ca3af;">No tagged highlights this week.</p>'}

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Period: ${new Date(period?.from).toLocaleDateString()} — ${new Date(period?.to).toLocaleDateString()}<br>
            You're receiving this because you have weekly digests enabled in Rewise AI.
          </p>
        </div>

        <!-- Footer -->
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
          &copy; ${new Date().getFullYear()} Rewise AI · Built with ❤️ for learners
        </p>
      </div>
    </body>
    </html>
    `;
  }
}

const emailService = new EmailService();
export default emailService;
