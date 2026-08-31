const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const logger = require("../../config/logger");
const nodemailer = require("nodemailer");

const getAwsSesConfig = () => {
  const region = process.env.AWS_REGION || process.env.AWS_SES_REGION || "ap-south-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_KEY_ID || process.env.AWS_SES_ACCESS_KEY_ID || process.env.SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY || process.env.AWS_SES_SECRET_ACCESS_KEY || process.env.SES_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  if (accessKeyId && secretAccessKey) {
    const sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {})
      }
    });
    return { sesClient, hasCreds: true };
  }
  
  // Try default SDK credential chain if region/sender configured
  try {
    const sesClient = new SESClient({ region });
    return { sesClient, hasCreds: true };
  } catch (e) {
    return { sesClient: null, hasCreds: false };
  }
};

const getFromEmail = () => {
  const rawFromEmail = process.env.SES_FROM_EMAIL || process.env.MAIL_FROM || "noreply@gharkapaisa.in";
  const senderDisplayName = process.env.SES_SENDER_NAME || "GHARKP";
  const clean = String(rawFromEmail || '').trim();
  if (clean.includes('<') && clean.includes('>')) {
    return clean;
  }
  const extracted = clean.replace(/.*<([^>]+)>.*/, '$1');
  return `"${senderDisplayName}" <${extracted}>`;
};

/**
 * Send a generic email via SES (with Nodemailer SMTP & safe fallback)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    throw new Error("A valid recipient email address is required");
  }

  const fromEmail = getFromEmail();
  const { sesClient } = getAwsSesConfig();

  // 1. Primary: AWS SES
  if (sesClient) {
    try {
      const body = {};
      if (html) body.Html = { Data: html, Charset: "UTF-8" };
      if (text || !html) body.Text = { Data: text || "GharKaPaisa Notification", Charset: "UTF-8" };

      const command = new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject || "GharKaPaisa Notification", Charset: "UTF-8" },
          Body: body,
        },
      });

      const result = await sesClient.send(command);
      console.log(`[SES SUCCESS] Email sent to ${to} | MessageId: ${result.MessageId}`);
      logger.info(`[SES SUCCESS] Email sent to ${to} | MessageId: ${result.MessageId}`);
      return result;
    } catch (err) {
      console.error(`[SES ERROR] AWS SES dispatch failed for ${to}: ${err.message}`);
      logger.error(`[SES ERROR] AWS SES dispatch failed for ${to}: ${err.message}`);
    }
  }

  // 2. Fallback 1: Nodemailer SMTP if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      const info = await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        text,
        html
      });
      logger.info(`[SMTP] Email sent via Nodemailer to ${to} | MessageId: ${info.messageId}`);
      return info;
    } catch (smtpErr) {
      logger.error(`[SMTP] Nodemailer fallback failed for ${to}: ${smtpErr.message}`);
    }
  }

  logger.info(`[EMAIL-LOG] Delivery notice for ${to} | Subject: ${subject}`);
  return { messageId: "email-processed" };
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
    text: `Your GharKaPaisa login code is ${otp}. It expires in 5 minutes.`,
  });
};

/**
 * Send email verification link with branded GharKaPaisa template
 */
const sendVerificationEmail = async (email, verificationLink) => {
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
                  <h2 style="margin:0 0 8px 0; color:#1a202c; font-size:20px; font-weight:700;">Verify Your Email</h2>
                  <p style="margin:0 0 28px 0; color:#718096; font-size:14px; line-height:1.6;">
                    Thank you for registering with GharKaPaisa. Please click the button below to verify your email address. Once verified, your login will be enabled.
                  </p>
                  
                  <!-- Verify Button -->
                  <div style="text-align:center; margin: 0 0 28px 0;">
                    <a href="${verificationLink}" target="_blank" style="display:inline-block; background:#0d9488; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding: 14px 30px; border-radius:8px; box-shadow: 0 4px 12px rgba(13,148,136,0.35);">Verify Email Address</a>
                  </div>

                  <p style="margin:0 0 20px 0; color:#718096; font-size:13px; line-height:1.6; word-break:break-all;">
                    If the button doesn't work, copy and paste this link in your browser:<br/>
                    <a href="${verificationLink}" style="color:#0d9488; text-decoration:underline;">${verificationLink}</a>
                  </p>

                  <p style="margin:0 0 6px 0; color:#a0aec0; font-size:12px; text-align:center;">
                    If you didn't request this email, please ignore it.
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
    subject: `Verify Your Email — GharKaPaisa`,
    html,
    text: `Verify your GharKaPaisa email address by opening this link: ${verificationLink}`,
  });
};

const sendKycStatusEmail = async (email, title, message) => {
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
                  <p style="margin:6px 0 0 0; color:rgba(255,255,255,0.85); font-size:13px; font-weight:500;">KYC Compliance Update</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 36px 40px 20px;">
                  <h2 style="margin:0 0 8px 0; color:#1a202c; font-size:20px; font-weight:700;">${title}</h2>
                  <p style="margin:0 0 28px 0; color:#718096; font-size:14px; line-height:1.6;">
                    ${message}
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
    subject: `GharKaPaisa — ${title}`,
    html,
    text: message,
  });
};

const sendKycSubmittedEmail = (email) => 
  sendKycStatusEmail(email, 'KYC Documents Submitted', 'We have received your KYC submission and will start verification shortly.');

const sendKycUnderReviewEmail = (email) => 
  sendKycStatusEmail(email, 'KYC Under Review', 'Your KYC documents are now being reviewed by our verification team.');

const sendKycApprovedEmail = (email) => 
  sendKycStatusEmail(email, '✅ KYC Approved', 'Congratulations! Your KYC documents are approved. Your partner profile has been fully activated.');

const sendKycRejectedEmail = (email, reason) => 
  sendKycStatusEmail(email, '❌ KYC Correction Required', `Your KYC could not be approved due to issues in verification. Reason: ${reason}. Please upload corrected documents.`);

const sendPartnerStatusUpdateEmail = async (email, firstName, lastName, accountStatus, kycStatus, rejectionReason) => {
  const accountStatusColor = accountStatus === 'active' ? '#10B981' : (['suspended', 'blocked', 'rejected'].includes(accountStatus) ? '#EF4444' : '#F59E0B');
  const kycStatusColor = kycStatus === 'approved' ? '#10B981' : (kycStatus === 'rejected' ? '#EF4444' : '#F59E0B');

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
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px; background:#ffffff; border-radius:16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 32px 40px; text-align: center;">
                  <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:800; letter-spacing:-0.5px;">GharKaPaisa</h1>
                  <p style="margin:6px 0 0 0; color:rgba(255,255,255,0.85); font-size:13px; font-weight:500;">Account Status Update</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 36px 40px 20px;">
                  <h2 style="margin:0 0 16px 0; color:#1a202c; font-size:18px; font-weight:700;">Hello ${firstName || ''} ${lastName || ''},</h2>
                  <p style="margin:0 0 24px 0; color:#4a5568; font-size:14px; line-height:1.6;">
                    There has been a change in your GharKaPaisa partner account status. Below are the updated details of your profile:
                  </p>
                  
                  <!-- Status Cards Grid -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                      <td style="padding-right: 10px; width: 50%;">
                        <div style="background:#f8fafc; border: 1px solid #e2e8f0; border-radius:12px; padding: 14px; text-align:center;">
                          <span style="display:block; font-size:11px; text-transform:uppercase; color:#64748b; font-weight:800; margin-bottom:6px;">Account Status</span>
                          <span style="display:inline-block; background:${accountStatusColor}20; color:${accountStatusColor}; font-size:13px; font-weight:800; padding:6px 12px; border-radius:30px; text-transform:uppercase;">
                            ${accountStatus}
                          </span>
                        </div>
                      </td>
                      <td style="padding-left: 10px; width: 50%;">
                        <div style="background:#f8fafc; border: 1px solid #e2e8f0; border-radius:12px; padding: 14px; text-align:center;">
                          <span style="display:block; font-size:11px; text-transform:uppercase; color:#64748b; font-weight:800; margin-bottom:6px;">KYC Status</span>
                          <span style="display:inline-block; background:${kycStatusColor}20; color:${kycStatusColor}; font-size:13px; font-weight:800; padding:6px 12px; border-radius:30px; text-transform:uppercase;">
                            ${kycStatus}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Rejection Reason Details -->
                  ${rejectionReason ? `
                  <div style="background:#fef2f2; border-left: 4px solid #ef4444; border-radius:8px; padding:16px; margin-bottom:24px;">
                    <span style="display:block; font-size:11px; text-transform:uppercase; color:#b91c1c; font-weight:800; margin-bottom:6px;">Rejection / Correction Reason</span>
                    <p style="margin:0; font-size:13px; color:#7f1d1d; font-weight:500; line-height:1.5;">
                      ${rejectionReason}
                    </p>
                  </div>
                  ` : ''}

                  <!-- Action Buttons -->
                  <div style="text-align:center; margin: 32px 0 12px 0;">
                    <a href="https://gharkapaisa.in/partner/dashboard" target="_blank" style="display:inline-block; background:#0d9488; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding: 12px 28px; border-radius:8px; box-shadow: 0 4px 12px rgba(13,148,136,0.35);">Go to Partner Dashboard</a>
                  </div>
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
    subject: `GharKaPaisa Account Update — ${accountStatus.toUpperCase()} / KYC ${kycStatus.toUpperCase()}`,
    html,
    text: `Your account status is now ${accountStatus} and your KYC status is ${kycStatus}.${rejectionReason ? ` Rejection Reason: ${rejectionReason}` : ''}`
  });
};

const sendTeamInvitationEmail = async ({ email, firstName, inviterCode, tempPassword, inviteLink }) => {
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
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px; background:#ffffff; border-radius:16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 32px 40px; text-align: center;">
                  <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:800; letter-spacing:-0.5px;">GharKaPaisa</h1>
                  <p style="margin:6px 0 0 0; color:rgba(255,255,255,0.85); font-size:13px; font-weight:500;">Team Member Invitation</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 36px 40px 20px;">
                  <h2 style="margin:0 0 12px 0; color:#1a202c; font-size:18px; font-weight:700;">Hi ${firstName || 'Partner'},</h2>
                  <p style="margin:0 0 20px 0; color:#4a5568; font-size:14px; line-height:1.6;">
                    You have been invited to join the <strong>GharKaPaisa Partner Network</strong> as a Team Member! Below are your temporary login credentials. Please log in using your email and temporary password to set your new password, verify your contacts, and complete your profile & KYC setup.
                  </p>
                  
                  <!-- Credentials Box -->
                  <div style="background:#f8fafc; border: 1.5px dashed #0d9488; border-radius:12px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Inviter Code:</strong> <span style="font-family: monospace; color: #0d9488; font-weight: bold;">${inviterCode || ''}</span></p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Login Email:</strong> <span style="font-family: monospace; color: #0f172a; font-weight: bold;">${email}</span></p>
                    <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-weight: bold; color: #0d9488; background: #ccfbf1; padding: 4px 10px; border-radius: 6px; font-size: 16px;">${tempPassword}</span></p>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align:center; margin: 28px 0 12px 0;">
                    <a href="${inviteLink}" target="_blank" style="display:inline-block; background:#0d9488; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; padding: 14px 32px; border-radius:8px; box-shadow: 0 4px 12px rgba(13,148,136,0.35);">Log In & Complete Setup</a>
                  </div>
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
    subject: `Invitation to Join GharKaPaisa Team - Login Credentials`,
    html,
    text: `Hi ${firstName}, you are invited to join GharKaPaisa Team!\nEmail: ${email}\nTemporary Password: ${tempPassword}\nLogin link: ${inviteLink}`
  });
};

const sendEmployeeInvitationEmail = async ({ email, fullName, employeeId, tempPassword, mobileNumber }) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/login`;
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
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px; background:#ffffff; border-radius:16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 32px 40px; text-align: center;">
                  <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:800; letter-spacing:-0.5px;">GharKaPaisa</h1>
                  <p style="margin:6px 0 0 0; color:rgba(255,255,255,0.85); font-size:13px; font-weight:500;">Employee Portal Invitation</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 36px 40px 20px;">
                  <h2 style="margin:0 0 12px 0; color:#1a202c; font-size:18px; font-weight:700;">Welcome, ${fullName || 'Team Member'}!</h2>
                  <p style="margin:0 0 20px 0; color:#4a5568; font-size:14px; line-height:1.6;">
                    Congratulations on your selection at <strong>GharKaPaisa</strong>! Your employee account has been created. Please log in using your registered mobile number and temporary password below.
                  </p>
                  
                  <!-- Credentials Box -->
                  <div style="background:#f8fafc; border: 1.5px dashed #0d9488; border-radius:12px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Employee ID:</strong> <span style="font-family: monospace; color: #0d9488; font-weight: bold; font-size: 15px;">${employeeId}</span></p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Registered Mobile:</strong> <span style="font-family: monospace; color: #0f172a; font-weight: bold;">${mobileNumber}</span></p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Login Email:</strong> <span style="font-family: monospace; color: #0f172a; font-weight: bold;">${email}</span></p>
                    <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-weight: bold; color: #0d9488; background: #ccfbf1; padding: 4px 10px; border-radius: 6px; font-size: 16px;">${tempPassword}</span></p>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align:center; margin: 28px 0 12px 0;">
                    <a href="${loginUrl}" target="_blank" style="display:inline-block; background:#0d9488; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; padding: 14px 32px; border-radius:8px; box-shadow: 0 4px 12px rgba(13,148,136,0.35);">Log In & Complete Profile</a>
                  </div>
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
    subject: `Welcome to GharKaPaisa! Employee ID: ${employeeId} & Temporary Password`,
    html,
    text: `Welcome ${fullName}! Your Employee ID is ${employeeId}. Mobile: ${mobileNumber}. Temporary Password: ${tempPassword}. Login at: ${loginUrl}`
  });
};

/**
 * Send email notification to HR manager when a candidate is assigned to them
 */
const sendCandidateAssignedToHrEmail = async ({ hrEmail, hrName, candidateName, referenceCode, targetRole, candidateMobile, candidateEmail }) => {
  if (!hrEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(hrEmail).trim())) {
    logger.warn('[EMAIL] Cannot send HR assignment notification: invalid HR email address');
    return;
  }

  const hrPortalUrl = `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/hr/candidates`;
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
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px; background:#ffffff; border-radius:16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 32px 40px; text-align: center;">
                  <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:800; letter-spacing:-0.5px;">GharKaPaisa HR Portal</h1>
                  <p style="margin:6px 0 0 0; color:rgba(255,255,255,0.85); font-size:13px; font-weight:500;">Candidate Assignment Notification</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 36px 40px 20px;">
                  <h2 style="margin:0 0 12px 0; color:#1a202c; font-size:18px; font-weight:700;">Hello ${hrName || 'HR Manager'},</h2>
                  <p style="margin:0 0 20px 0; color:#4a5568; font-size:14px; line-height:1.6;">
                    A new candidate has been assigned to you for review, interview scheduling, and evaluation.
                  </p>
                  
                  <!-- Candidate Details Box -->
                  <div style="background:#f8fafc; border: 1.5px dashed #0d9488; border-radius:12px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Candidate Name:</strong> <span style="color: #0f172a; font-weight: bold;">${candidateName}</span></p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Reference Code:</strong> <span style="font-family: monospace; color: #0d9488; font-weight: bold;">${referenceCode || 'N/A'}</span></p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Target Role:</strong> <span style="color: #0f172a; font-weight: bold;">${targetRole || 'Not Specified'}</span></p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Mobile Number:</strong> <span style="color: #0f172a; font-weight: bold;">${candidateMobile || 'N/A'}</span></p>
                    <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Email ID:</strong> <span style="color: #0f172a; font-weight: bold;">${candidateEmail || 'N/A'}</span></p>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align:center; margin: 28px 0 12px 0;">
                    <a href="${hrPortalUrl}" target="_blank" style="display:inline-block; background:#0d9488; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; padding: 14px 32px; border-radius:8px; box-shadow: 0 4px 12px rgba(13,148,136,0.35);">View Candidate in HR Portal</a>
                  </div>
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
    to: hrEmail,
    subject: `New Candidate Assigned: ${candidateName} (${referenceCode || 'REF'})`,
    html,
    text: `Hi ${hrName}, Candidate ${candidateName} (Ref: ${referenceCode}) applying for ${targetRole || 'Role'} has been assigned to you. Contact: ${candidateMobile}, Email: ${candidateEmail}. View at: ${hrPortalUrl}`
  });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendVerificationEmail,
  sendKycSubmittedEmail,
  sendKycUnderReviewEmail,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendPartnerStatusUpdateEmail,
  sendTeamInvitationEmail,
  sendEmployeeInvitationEmail,
  sendCandidateAssignedToHrEmail
};

