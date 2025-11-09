// backend/utils/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  // Configure with your email service
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: `"EDO RMS" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <p><a href="${resetUrl}" style="background-color: #1a56db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>The link will expire in 1 hour.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message from EDO RMS. Please do not reply.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendPasswordChangedNotification(email) {
  const mailOptions = {
    from: `"EDO RMS" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Changed Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Password Changed Successfully</h2>
        <p>Your password has been successfully changed.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message from EDO RMS. Please do not reply.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}