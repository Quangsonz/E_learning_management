const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER || process.env.EMAIL_USERNAME;
  const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL_FROM || (user ? `"E-Learning System" <${user}>` : '"E-Learning System" <noreply@elearning.com>');

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465, // TLS 465 hoặc STARTTLS 587
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: from,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
