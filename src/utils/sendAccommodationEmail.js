require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const GMAIL_ADDRESS = process.env.GMAIL_ADDRESS;

export default async function sendAccommodationEmail(body) {
  try {
    // Check if all required env variables are present
    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !REFRESH_TOKEN || !GMAIL_ADDRESS) {
      console.error("Missing required environment variables for email sending");
      throw new Error("Missing OAuth configuration. Check your environment variables.");
    }

    // Create OAuth2 client
    const oauth2Client = new OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );
    
    oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN
    });

    // Get new access token
    try {
      const { token } = await oauth2Client.getAccessToken();
      if (!token) {
        throw new Error("Failed to obtain access token");
      }
      
      // Format dates for display
      const formattedCheckIn = new Date(body.checkInDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const formattedCheckOut = new Date(body.checkOutDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create transporter with OAuth2 authentication
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

      // Email options
      const mailOptions = {
        from: `IADR APR 2025 <${GMAIL_ADDRESS}>`,
        to: body.email,
        subject: 'Hotel Leela Accommodation Booking Confirmation',
        text: `Dear ${body.fullName},
        
Thank you for booking your accommodation at Hotel Leela for the upcoming event. Your booking details are as follows:

Booking ID: ${body.paymentId}
Delegate Type: ${body.delegateType}
Room Type: ${body.roomType}
Check-in Date: ${formattedCheckIn}
Check-out Date: ${formattedCheckOut}
Amount Paid: ${body.currency === 'INR' ? '₹' : '$'}${body.amountPaid}

If you have any questions or need to make changes to your booking, please contact our support team at support@iadrapr2025.com.

We look forward to welcoming you to Hotel Leela.

Best regards,
IADR APR 2025 Organizing Committee`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://iadrapr2025.com/wp-content/uploads/2025/02/logo-1.jpg" alt="IADR APR 2025 Logo" style="max-width: 150px;" />
            </div>
            
            <h1 style="color: #1063a5; text-align: center;">Accommodation Booking Confirmation</h1>
            
            <p>Dear ${body.fullName},</p>
            
            <p>Thank you for booking your accommodation at Hotel Leela for the upcoming event. Your booking details are as follows:</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #374151; font-size: 18px;">Booking Details</h2>
              <table style="width:100%; border-collapse:collapse; margin-top:15px;">
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Booking ID:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.paymentId}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Delegate Type:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.delegateType}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Room Type:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.roomType}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Check-in Date:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${formattedCheckIn}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Check-out Date:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${formattedCheckOut}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Amount Paid:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.currency === 'INR' ? '₹' : '$'}${body.amountPaid}</td>
                </tr>
              </table>
           <p style="color:#555; margin-top:15px;">If you have any questions or need further assistance, please contact at drsmyle@yahoo.com or Phone: +91 9212098363</p>
              <p style="color:#555;">Best regards,<br>IADR-APR Team</p>
            </div>
            
            <!-- Footer -->
            <div style="background:#f9f9f9; padding:15px; text-align:center; font-size:12px; color:#777;">
              <p>Company Name | Company Address, City, Country</p>
              <p><a href="https://iadrapr2025.com" style="color:#4287f5; text-decoration:underline  ;">Visit our website</a></p>
            </div>
          </div>
        `
      };

      // Send email
      const result = await transporter.sendMail(mailOptions);
      console.log('Accommodation email sent:', result);
      return { success: true, message: 'Accommodation email sent successfully' };
    } catch (oauthError) {
      console.error('OAuth error:', oauthError);
      throw new Error(`OAuth authentication failed: ${oauthError.message}`);
    }
  } catch (error) {
    console.error('Error sending accommodation email:', error);
    return { success: false, message: error.message };
  }
}