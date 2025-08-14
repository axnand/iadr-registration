
import nodemailer from "nodemailer";
import { google } from "googleapis";

export default async function sendPaymentRequestEmail(data) {
  const OAuth2 = google.auth.OAuth2;
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
  const { token } = await oauth2Client.getAccessToken();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_ADDRESS,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: token
    }
  });

  const mailOptions = {
    from: `Payments <${process.env.GMAIL_ADDRESS}>`,
    to: data.email,
    subject: "Payment Request",
    html: `
      <p>Dear ${data.fullName},</p>
      <p>Please complete your payment for <strong>${data.description}</strong> by clicking the link below:</p>
      <p><a href="${data.paymentLink}" style="color: blue; font-weight: bold;">Pay Now</a></p>
      <p>Amount: ₹${data.amount}</p>
      <p>Thank you.</p>
    `
  };

  await transporter.sendMail(mailOptions);
}
