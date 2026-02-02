# Gmail SMTP Setup - Quick Reference

## 1. Get Gmail App Password (5 minutes)
- Go to https://myaccount.google.com/apppasswords
- Select "Mail" → "Windows Computer" → Generate
- Copy the 16-character password (remove spaces)

## 2. Configure Backend
Open `backend/.env`:
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
PORT=5000
```

## 3. Install Dependencies
```powershell
cd backend
npm install
```

## 4. Start Backend Server
```powershell
npm start
```
Should show: `Email service running on http://localhost:5000`

## 5. Test It
1. Keep backend terminal open
2. Start frontend: `npm run dev`
3. Open http://localhost:5173
4. Sign up with real email
5. Check inbox for verification code

## What Changed?
- `Router.tsx`: Now calls `sendVerificationCode()` when generating codes
- `services/emailService.ts`: Sends email requests to backend
- `backend/server.js`: Receives requests and sends emails via Gmail
- `backend/.env`: Stores your Gmail credentials

## If Emails Don't Send
1. Check `.env` file is filled in correctly
2. Verify backend terminal shows "Email service running..."
3. Check browser console (F12) for errors
4. Check spam/promotions folder
5. Verify Gmail App Password is correct (not regular password)

## Architecture
```
Sign Up → Router.tsx → emailService.ts → Backend Server → Gmail → Your Email
```

## Important!
⚠️ **Keep backend terminal open** while testing
⚠️ **Use App Password, NOT regular Gmail password**
⚠️ **Check spam folder** if email doesn't arrive
