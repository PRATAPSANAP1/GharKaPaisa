const { Resend } = require('resend');
const config = require('../config/env');

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!config.resendApiKey) {
      console.warn(`[Mock Email] To: ${to} | Subject: ${subject}`);
      console.warn(`[Mock Email] Content: \n${html}`);
      return { id: 'mock-id-1234' };
    }

    const resend = new Resend(config.resendApiKey);

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error(`Resend API error:`, error);
      throw new Error(error.message);
    }

    console.log(`Email sent via Resend: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`Email sending failed: ${error.message}`);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;

