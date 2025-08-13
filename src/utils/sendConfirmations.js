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

export default async function sendConfirmationEmail(body) {
    
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


    const amountText = body.paymentMode === "offline" ? `\nAmount: ${body.amount}` : "";
    const amountHTML = body.paymentMode === "offline" 
      ? `<tr>
          <td style="padding:8px; border:1px solid #ddd;"><strong>Amount:</strong></td>
          <td style="padding:8px; border:1px solid #ddd;">${body.amount}</td>
        </tr>` 
      : "";


    const mailOptions = {
        from: `IADR-APR Team <${GMAIL_ADDRESS}>`,
        to: body.email,
        subject: 'Registration Confirmation',
        text: `Dear ${body.fullName},
      
      Thank you for registering! Below are your registration details:
      
      Title: ${body.title}
      Full Name: ${body.fullName}
      Email: ${body.email}
      Phone: ${body.phone}
      City: ${body.city}
      Country: ${body.country}
      Pincode: ${body.pincode}
      Address: ${body.address}
      Event Type: ${body.eventType}
      Category: ${body.category}
      Accompanying: ${body.accompanying}
      Number of Accompanying: ${body.numberOfAccompanying}

      
      If you have any questions, please contact our support team.
      
      Regards,
      Event Team`,
        html: `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Registration Confirmation</title>
        </head>
        <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f4f4;">
          <div style="max-width:600px; margin:20px auto; background:#fff; border:1px solid #eaeaea;">
            <!-- Header with company logo -->
            <div style="background:#1063a5; padding:20px; text-align:center;">
              <img src="https://iadrapr2025.com/wp-content/uploads/2025/07/indian-society-for-dental-resear-768x160.png" alt="Company Logo" style="max-width:150px;" />
            </div>
            
            <!-- Email content -->
            <div style="padding:20px;">
              <h2 style="color:#333; margin-bottom:10px;">Registration Confirmation</h2>
              <p style="color:#555;">Dear ${body.fullName},</p>
              <p style="color:#555;">Thank you for registering! Below are the details you provided:</p>
              <p style="color:#555; margin-top:10px;">🚨 Note: Your Phone Number with Country Code <span style="text-decoration:underline;">${body.phone}</span> 
                (without the '+' symbol) is your unique <strong>Registration ID</strong> for the event.</p>
              <table style="width:100%; border-collapse:collapse; margin-top:15px;">
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Title:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.title}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Full Name:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.fullName}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Email:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.email}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Phone:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.phone}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>City:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.city}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Country:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.country}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Pincode:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.pincode}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Address:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.address}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Event Type:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.eventType}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Category:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.category}</td>
                </tr>
                ${amountHTML}
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Accompanying:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.accompanying}</td>
                </tr>
                <tr>
                  <td style="padding:8px; border:1px solid #ddd;"><strong>Number of Accompanying:</strong></td>
                  <td style="padding:8px; border:1px solid #ddd;">${body.numberOfAccompanying}</td>
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
        </body>
      </html>
      `
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
