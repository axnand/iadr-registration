require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
import { PCC_DATA } from '@/app/pcc-registration/PCC.js';

const OAuth2 = google.auth.OAuth2;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const GMAIL_ADDRESS = process.env.GMAIL_ADDRESS;

export default async function sendCourseRegistrationEmail(body) {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !REFRESH_TOKEN || !GMAIL_ADDRESS) {
      throw new Error("Missing OAuth configuration. Check your environment variables.");
    }

    const oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    const { token } = await oauth2Client.getAccessToken();
    if (!token) throw new Error("Failed to obtain access token");

    // Find course details by code
    const course = PCC_DATA.find(c => c.code === body.courseCode);
    if (!course) throw new Error("Course not found");

    const formattedCourseDate = new Date(body.courseDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: GMAIL_ADDRESS,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: token
      }
    });

    const mailOptions = {
      from: `IADR APR 2025 <${GMAIL_ADDRESS}>`,
      to: body.email,
      subject: 'PCC Course Registration Confirmation',
      text: `Dear ${body.fullName},

Thank you for registering for the PCC course at IADR APR 2025.

Your registration details are as follows:
Registration ID: ${body.paymentId || 'N/A'}
Course Code: ${body.courseCode}
Course Name: ${course.title}
Course Date: ${formattedCourseDate}
Amount Paid: ${body.currency === 'INR' ? '₹' : '$'}${body.amountPaid}

We look forward to welcoming you to the course.

Best regards,
IADR APR 2025 Organizing Committee`,

      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://iadrapr2025.com/wp-content/uploads/2025/02/logo-1.jpg" alt="IADR APR 2025 Logo" style="max-width: 150px;" />
          </div>

          <h1 style="color: #1063a5; text-align: center;">PCC Course Registration Confirmation</h1>

          <p>Dear ${body.fullName},</p>
          <p>Thank you for registering for the PCC course at IADR APR 2025. Below are your registration details:</p>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <table style="width:100%; border-collapse: collapse;">
              <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Registration ID:</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">${body.paymentId || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Course Code:</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">${body.courseCode}</td>
              </tr>
              <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Course Name:</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">${course.title}</td>
              </tr>
              <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Course Date:</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">${formattedCourseDate}</td>
              </tr>
              <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Amount Paid:</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">${body.currency === 'INR' ? '₹' : '$'}${body.amountPaid}</td>
              </tr>
            </table>
            <p style="color:#555; margin-top:15px;">If you have any questions or need further assistance, please contact at drsmyle@yahoo.com or Phone: +91 9212098363</p>
            <p style="color:#555;">Best regards,<br>IADR-APR Team</p>
          </div>

          <div style="background:#f9f9f9; padding:15px; text-align:center; font-size:12px; color:#777;">
            <p>Company Name | Company Address, City, Country</p>
            <p><a href="https://iadrapr2025.com" style="color:#4287f5; text-decoration:underline;">Visit our website</a></p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Course registration email sent:', result);
    return { success: true, message: 'Course registration email sent successfully' };

  } catch (error) {
    console.error('Error sending course registration email:', error);
    return { success: false, message: error.message };
  }
}
