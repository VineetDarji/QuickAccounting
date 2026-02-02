const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configure Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Test email endpoint
app.post('/api/send-verification', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: '🔐 Quick Accounting Service - Verification Code',
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e293b; margin: 0; font-size: 28px;">🚀 Quick</h1>
            <p style="color: #64748b; margin: 5px 0 0 0;">Accounting Service</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Verify Your Identity</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              You're signing in to your Quick Accounting Service account. Use the verification code below to complete your login:
            </p>
            
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
              <p style="color: white; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">Your Verification Code</p>
              <p style="color: white; font-size: 40px; font-weight: bold; margin: 0; letter-spacing: 10px;">${code}</p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0;">
              ⏱️ This code expires in <strong>10 minutes</strong>
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin: 15px 0 0 0;">
              🔒 If you didn't request this code, please ignore this email. Your account is secure.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>© 2024 Quick Accounting Service. All Rights Reserved.</p>
            <p>support@quickaccounting.com | +91 22 4567 8900</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Failed to send verification code', details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Email service is running' });
});

app.listen(PORT, () => {
  console.log(`✅ Quick Accounting Email Service running on http://localhost:${PORT}`);
  console.log(`📧 Gmail SMTP configured for: ${process.env.GMAIL_USER}`);
});
