require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const GMAIL_ADDRESS = process.env.GMAIL_ADDRESS;

const oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendConfirmationEmail(recipientEmail, fullName) {
  try {
    const accessTokenResponse = await oauth2Client.getAccessToken();
    if (accessTokenResponse.token === null) {
      throw new Error("Failed to generate access token");
    }
    const accessToken = accessTokenResponse.token;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: GMAIL_ADDRESS,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: `Event Team <${GMAIL_ADDRESS}>`,
      to: recipientEmail,
      subject: 'Registration Confirmation',
      text: `Dear ${fullName},\n\nThank you for registering! Your payment was successful.\n\nRegards,\nEvent Team`,
      html: `<p>Dear <b>${fullName}</b>,</p><p>Thank you for registering! Your payment was successful.</p><p>Regards,<br>Event Team</p>`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: error.message };
  }
}

module.exports = sendConfirmationEmail;
