const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const port = Number(process.env.EMAIL_PORT) || 587;
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465, // TLS 465 hoặc STARTTLS 587
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"E-Learning System" <${process.env.EMAIL_USERNAME || 'noreply@elearning.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
