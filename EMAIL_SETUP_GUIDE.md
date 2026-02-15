# Email Service Setup Guide

## Overview
Your Quick Accounting Service now supports real email verification codes via Gmail SMTP. The system has three components:

1. **Frontend** (React/Vite) - Handles user authentication and sends email requests
2. **Backend Server** (Node.js/Express) - Processes email sending via Gmail SMTP
3. **Gmail Configuration** - Your Google account credentials

## Step 1: Setup Gmail App Password

### Why App Password?
Gmail doesn't allow sending emails with your regular password for security reasons. You need to generate a special "App Password".

### How to Generate App Password:

1. **Enable 2-Factor Authentication** (if not already enabled):
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Click "Security" in the left menu
   - Enable "2-Step Verification"
   - Follow Google's instructions

2. **Generate App Password**:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" from the dropdown
   - Select "Windows Computer" 
   - Click "Generate"
   - Google will show a 16-character password like: `abcd efgh ijkl mnop`
   - **Copy this password** (you'll need it in Step 2)

## Step 2: Configure Backend Environment

### Option A: Using `.env` file (Recommended)

1. Open `backend/.env` in the project
2. Fill in your credentials:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   PORT=5000
   ```
   - Replace `your-email@gmail.com` with your Gmail address
   - Replace `abcdefghijklmnop` with the App Password you generated (remove spaces)

### Option B: Environment Variables
If you prefer not to use `.env`, set environment variables:
```powershell
# Windows PowerShell
$env:GMAIL_USER = "your-email@gmail.com"
$env:GMAIL_APP_PASSWORD = "abcdefghijklmnop"
$env:PORT = "5000"
```

## Step 3: Install Backend Dependencies

Open PowerShell and navigate to the backend folder:

```powershell
cd "c:\Users\Vineet\Desktop\Crack\Google\backend"
npm install
```

This installs:
- `express` - Web server
- `nodemailer` - Email sending
- `cors` - Cross-origin requests
- `dotenv` - Environment variables

## Step 4: Start Backend Server

Still in the `backend` folder, run:

```powershell
npm start
```

You should see:
```
Email service running on http://localhost:5000
```

**Important**: Keep this terminal window open while testing. The backend must be running for emails to send.

## Step 5: Test Email Verification

1. Keep the backend terminal open
2. In another terminal, start your Vite frontend (if not already running):
   ```powershell
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser
4. Sign up with a real email address
5. You should receive a verification email within seconds
6. Check your spam/promotions folder if not in inbox

## Troubleshooting

### "Email service unavailable" message
- **Backend not running**: Check the PowerShell terminal running `npm start`
- **Port 5000 already in use**: Kill existing process or use different port
- **Network issue**: Ensure localhost:5000 is accessible

### Email not arriving
- **Check spam folder**: Gmail sometimes marks app password emails as spam
- **Gmail not configured**: Verify `.env` file has correct email and App Password
- **Wrong App Password**: Make sure it's the generated one, not your regular password
- **Account not enabled**: Some accounts require additional setup for "Less Secure Apps"

### "Multiple matches found" error during sign-up
- This is normal - the code was updated in both sign-up and sign-in flows
- If you see this error, the update was successful

### CORS error
- Ensure backend has `cors` package installed
- Restart backend server

## Architecture

```
User Input (Sign Up/Sign In)
         ↓
    Router.tsx (Frontend)
         ↓
  emailService.ts (Client wrapper)
         ↓
  HTTP POST to /api (dev proxy â†’ localhost:5000)
         ↓
   backend/server.js (Express)
         ↓
  nodemailer (Gmail SMTP)
         ↓
    Gmail Servers
         ↓
    User's Inbox
```

## Features

✅ Real email verification codes
✅ Graceful fallback if backend unavailable (demo mode)
✅ Beautiful HTML email templates with Quick branding
✅ Automatic code generation
✅ Verification code validation
✅ Error handling and logging
✅ CORS support for local development

## Files Modified

- `Router.tsx` - Integrated email service calls
- `services/emailService.ts` - Created email client
- `backend/server.js` - Created email server
- `backend/package.json` - Backend dependencies
- `backend/.env` - Configuration template

## Production Deployment

For production:

1. Use environment variables instead of `.env` file
2. Deploy backend to a service (Heroku, Railway, Vercel, AWS)
3. In production, route frontend `/api/*` requests to your backend (same domain via reverse proxy), or update `services/emailService.ts` accordingly
4. Consider using Firebase Cloud Functions instead of separate backend
5. Set Gmail to allow "Less Secure Apps" or use OAuth2

## Next Steps

After email is working:
- Test with different email addresses
- Verify code arrives in 1-5 seconds
- Test sign-in flow as well
- Monitor email sending in production

---

**Need help?** Check the browser console (F12) and backend terminal for detailed error messages.
