import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config(); 
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

export const sendpasswordresetEmail = (email, resetToken) => {
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Password Reset Request",
    html: `
      <p>You requested a password reset.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};
