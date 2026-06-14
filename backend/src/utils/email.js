const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Cấu hình transporter (sử dụng Mailtrap cho dev hoặc Gmail/SendGrid cho prod)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USERNAME || 'username',
      pass: process.env.EMAIL_PASSWORD || 'password',
    },
  });

  // 2) Định nghĩa email options
  const mailOptions = {
    from: 'E-Learning Admin <noreply@elearning.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: options.html
  };

  // 3) Thực hiện gửi email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
