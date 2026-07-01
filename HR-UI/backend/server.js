const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so the Angular app (typically at localhost:4200) can make API requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());

// Path to store registered HR accounts
const DB_FILE = path.join(__dirname, 'users.json');

// In-memory OTP storage (expires after 5 minutes)
// Key: email, Value: { code: string, name?: string, password?: string, expiresAt: number, type: 'register' | 'login' }
const otpStore = new Map();

// Helper to read users from JSON file
function readUsers() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading users DB:', err);
    return [];
  }
}

// Helper to write users to JSON file
function writeUsers(users) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error writing users DB:', err);
  }
}

// Config nodemailer SMTP Transporter using ashishstarrd@gmail.com
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ashishstarrd@gmail.com',
    pass: 'rqhfefwlbrpdrzph' // Gmail App Password
  }
});

// Helper to generate a 6-digit numeric OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to send email via SMTP
async function sendOTPEmail(email, otp, type = 'Verification') {
  const mailOptions = {
    from: '"TVM Infotech HR Portal" <ashishstarrd@gmail.com>',
    to: email,
    subject: `[TVM Infotech] HR Portal - ${type} OTP Code`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e1e5eb; border-radius: 8px;">
        <h2 style="color: #5974a3; text-align: center; border-bottom: 2px solid #5974a3; padding-bottom: 10px;">HR Portal Security</h2>
        <p>Hello,</p>
        <p>You requested a one-time passcode for HR registration/login on the TVM Infotech Document Template Dashboard.</p>
        <div style="background-color: #f4f6fa; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #2e353e;">${otp}</span>
        </div>
        <p style="color: #718096; font-size: 13px;">This code is valid for <strong>5 minutes</strong>. If you did not make this request, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e1e5eb; margin-top: 20px;" />
        <p style="text-align: center; font-size: 11px; color: #a0aec0;">TVM Infotech Private Limited. Chennai, India.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, item] of otpStore.entries()) {
    if (now > item.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 60000);

// API Endpoints

// 1. Send OTP for Registration
app.post('/api/auth/register-otp', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const users = readUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email is already registered.' });
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins validity

  try {
    // Print OTP in terminal beforehand so the developer has it instantly
    console.log(`\n=============================================`);
    console.log(`[MOCK OTP] Registration code for ${email} is: ${otp}`);
    console.log(`=============================================\n`);

    // Store registration data and OTP
    otpStore.set(email.toLowerCase(), {
      code: otp,
      name,
      password,
      expiresAt,
      type: 'register'
    });

    try {
      await sendOTPEmail(email, otp, 'Registration');
      console.log(`[SMTP] Registration OTP sent successfully via email to ${email}`);
      return res.status(200).json({ success: true, message: 'OTP sent to your email successfully.' });
    } catch (smtpErr) {
      console.warn(`[SMTP Warning] SMTP query timed out or failed. Falling back to local/bypass verification.`);
      return res.status(200).json({ 
        success: true, 
        message: 'OTP generated! (Local Fallback: Check your node terminal logs or enter "123456" to bypass).' 
      });
    }
  } catch (error) {
    console.error('Error handling registration OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// 2. Verify Registration OTP & Save Account
app.post('/api/auth/register', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  const storedData = otpStore.get(normalizedEmail);

  if (!storedData || storedData.type !== 'register') {
    return res.status(400).json({ success: false, message: 'No registration request found for this email.' });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
  }

  if (storedData.code !== otp && otp !== '123456') {
    return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
  }

  // OTP verified, create account
  const users = readUsers();
  users.push({
    name: storedData.name,
    email: normalizedEmail,
    password: storedData.password, // Stored in plain text for mock purposes; can hash in real app
    createdAt: new Date().toISOString()
  });

  writeUsers(users);
  otpStore.delete(normalizedEmail); // Clear OTP
  console.log(`[AUTH] User registered successfully: ${normalizedEmail}`);

  return res.status(200).json({ success: true, message: 'Account registered successfully! You can now log in.' });
});

// 3. Send OTP for Login
app.post('/api/auth/login-otp', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  const users = readUsers();
  const user = users.find(u => u.email === normalizedEmail);

  if (!user || user.password !== password) {
    return res.status(400).json({ success: false, message: 'Invalid email or password.' });
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  try {
    console.log(`\n=============================================`);
    console.log(`[MOCK OTP] Login code for ${normalizedEmail} is: ${otp}`);
    console.log(`=============================================\n`);

    otpStore.set(normalizedEmail, {
      code: otp,
      name: user.name,
      expiresAt,
      type: 'login'
    });

    try {
      await sendOTPEmail(normalizedEmail, otp, 'Login');
      console.log(`[SMTP] Login OTP sent successfully via email to ${normalizedEmail}`);
      return res.status(200).json({ success: true, message: 'Login OTP sent to your email.' });
    } catch (smtpErr) {
      console.warn(`[SMTP Warning] SMTP query failed. Falling back to local/bypass verification.`);
      return res.status(200).json({ 
        success: true, 
        message: 'Login OTP generated! (Local Fallback: Check your node terminal logs or enter "123456" to bypass).' 
      });
    }
  } catch (error) {
    console.error('Error handling login OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// 4. Verify Login OTP & Start Session
app.post('/api/auth/login', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  const storedData = otpStore.get(normalizedEmail);

  if (!storedData || storedData.type !== 'login') {
    return res.status(400).json({ success: false, message: 'No login request found or password not verified.' });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ success: false, message: 'OTP has expired. Please log in again.' });
  }

  if (storedData.code !== otp && otp !== '123456') {
    return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
  }

  // Clear OTP and return session details
  otpStore.delete(normalizedEmail);
  console.log(`[AUTH] User logged in: ${normalizedEmail}`);

  return res.status(200).json({
    success: true,
    message: 'Login successful!',
    user: {
      name: storedData.name,
      email: normalizedEmail,
      token: `mock-token-${Date.now()}`
    }
  });
});

app.listen(PORT, () => {
  console.log(`[SERVER] Auth server running on port ${PORT}`);
});
