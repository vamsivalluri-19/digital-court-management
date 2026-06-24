const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const isConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  if (!isConfigured) {
    console.log('--------------------------------------------');
    console.log(`[SMTP LOG] (Mock Dispatch)`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.text || options.html}`);
    console.log('--------------------------------------------');
    return { mockSent: true };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"CourtConnect Portal" <no-reply@courtconnect.gov.in>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email dispatched: ${info.messageId}`);
  return info;
};

module.exports = { sendEmail };
