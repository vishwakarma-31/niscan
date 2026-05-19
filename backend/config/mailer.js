const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});


async function sendEmail({ to, subject, html }) {
  return transporter.sendMail({
    from: `"Nicsan CRM" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { transporter, sendEmail };
