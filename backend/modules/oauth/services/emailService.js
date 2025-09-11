const nodemailer = require("nodemailer");
require("dotenv").config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "duckcode145@gmail.com",
        pass: process.env.APP_PASS,
      },
    });
  }
  
  async sendWelcomeEmail(email, password) {
    const mailOptions = {
      from: "duckcode145@gmail.com",
      to: email,
      subject: 'Welcome to Our Service',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4285f4;">Welcome to Our Service!</h2>
          <p>Your account has been created successfully.</p>
          <p>Your temporary password is: <strong>${password}</strong></p>
          <p>Please log in and change your password as soon as possible.</p>
          <p>If you didn't create this account, please contact our support team.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">This is an automated email, please do not reply.</p>
          </div>
        </div>
      `,
    };

    return this.transporter.sendMail(mailOptions);
  }
  
  // Add more email methods as needed
}

// Export as singleton
module.exports = new EmailService();