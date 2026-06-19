/**
 * email.service.js — AWS SES Email Service
 * ─────────────────────────────────────────────────────────────────────────
 * Sends transactional emails (OTP codes, notifications) via AWS SES.
 * Uses explicit credentials from .env for reliable authentication.
 */
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const logger = require("../utils/logger");

const ses = new SESClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || process.env.MAIL_FROM || "no-reply@gharkapaisa.in";

/**
 * Send a generic email via SES
 */
const sendEmail = async ({ to, subject, html }) => {
  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: html } },
    },
  });

  try {
    const result = await ses.send(command);
    logger.info(`[SES] Email sent to ${to} | MessageId: ${result.MessageId}`);
    return result;
  } catch (err) {
    logger.error(`[SES] Failed to send email to ${to}: ${err.message}`);
    throw err;
  }
};

/**
 * Send OTP verification email with branded GharKaPaisa template
 */
const sendOtpEmail = async (email, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background:#f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background:#ffffff; border-radius:16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 32px 40px; text-align: center;">
                  <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:800; letter-spacing:-0.5px;">GharKaPaisa</h1>
                  <p style="margin:6px 0 0 0; color:rgba(255,255,255,0.85); font-size:13px; font-weight:500;">Your Financial Companion</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 36px 40px 20px;">
                  <h2 style="margin:0 0 8px 0; color:#1a202c; font-size:20px; font-weight:700;">Verify Your Login</h2>
                  <p style="margin:0 0 28px 0; color:#718096; font-size:14px; line-height:1.6;">
                    Use the following one-time password to complete your sign-in. This code expires in <strong>5 minutes</strong>.
                  </p>
                  
                  <!-- OTP Box -->
                  <div style="text-align:center; margin: 0 0 28px 0;">
                    <div style="display:inline-block; background:#f0fdfa; border: 2px dashed #0d9488; border-radius:12px; padding: 16px 40px;">
                      <span style="font-size:36px; font-weight:800; letter-spacing:12px; color:#0d9488; font-family: 'Courier New', monospace;">${otp}</span>
                    </div>
                  </div>

                  <p style="margin:0 0 6px 0; color:#a0aec0; font-size:12px; text-align:center;">
                    If you didn't request this code, please ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px 28px; border-top: 1px solid #edf2f7; text-align: center;">
                  <p style="margin:0; color:#a0aec0; font-size:11px;">
                    &copy; ${new Date().getFullYear()} GharKaPaisa &middot; All rights reserved<br/>
                    <a href="https://gharkapaisa.in" style="color:#0d9488; text-decoration:none;">gharkapaisa.in</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `${otp} — Your GharKaPaisa Login Code`,
    html,
  });
};

module.exports = { sendEmail, sendOtpEmail };
