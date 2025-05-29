const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config();


const app = express();
const PORT = 5000;
const nodemailer = require('nodemailer');
// Middleware
app.use(cors());
app.use(bodyParser.json());
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID; // from your .env
const authToken = process.env.TWILIO_AUTH_TOKEN;   // from your .env
const client = new twilio(accountSid, authToken);
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,  // <--- Add this to bypass cert check
  },
});


// ✅ POST route for /api/booking
app.post('/api/booking', async (req, res) => {
  const { name, phone, email, date, time, service, message } = req.body;

  console.log("Booking received:", req.body);

  try {
    // Send WhatsApp message
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: process.env.TO_WHATSAPP_NUMBER,
      body: `New booking received!\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nDate: ${date}\nTime: ${time}\nService: ${service}\nMessage: ${message || 'N/A'}`,
    });

    // Send Email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,              // sender address
      to: 'mrunalibhayde3@gmail.com',            // receiver email
      subject: `New Booking from ${name}`,       // subject line
      text: `You have a new booking:\n
Name: ${name}
Phone: ${phone}
Email: ${email}
Date: ${date}
Time: ${time}
Service: ${service}
Message: ${message || 'N/A'}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Booking received, WhatsApp notification and email sent!" });
  } catch (error) {
    console.error("Error sending notifications:", error);
    res.status(500).json({ error: "Failed to send notifications." });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email and message are required." });
  }

  console.log("Contact message received:", req.body);

  try {
    // Send WhatsApp notification
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: process.env.TO_WHATSAPP_NUMBER,
      body: `New contact message received!\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nMessage: ${message}`,
    });

    // Send Email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'mrunalibhayde3@gmail.com',  // Your email where contact messages go
      subject: `New Contact Message from ${name}`,
      text: `You have a new contact message:\n
Name: ${name}
Email: ${email}
Phone: ${phone || 'N/A'}
Message: ${message}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Contact message received, WhatsApp notification and email sent!" });
  } catch (error) {
    console.error("Error sending contact notifications:", error.message, error.stack);
    res.status(500).json({ error: "Failed to send contact notifications." });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
