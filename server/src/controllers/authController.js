import Joi from 'joi';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { issueTokens, setAuthCookies, clearAuthCookies } from '../middleware/auth.js';
import { sendMail } from '../utils/email.js';

export async function register(req, res) {
  const schema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  });
  // Use req.body (populated by multer)
  const { value, error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const exists = await User.findOne({ email: value.email });
  if (exists) return res.status(409).json({ message: 'Email already used' });

  // Create user
  const user = await User.create(value);
  // If avatar uploaded, set avatarUrl
  if (req.file) {
    user.avatarUrl = `/uploads/${req.file.filename}`;
    await user.save();
  }
  await AuditLog.create({ actor: user._id, action: 'register' });
  res.status(201).json({ message: 'Registered' });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials' });

  const tokens = issueTokens(user);
  setAuthCookies(res, tokens);
  await AuditLog.create({ actor: user._id, action: 'login' });
  res.json({ 
    user: { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
    token: tokens.access // Also return the token for client-side use
  });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  let userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    bookingCount: user.bookingCount,
    isLoyaltyEligible: user.isLoyaltyEligible,
    loyaltyDiscountRequested: user.loyaltyDiscountRequested,
    loyaltyDiscountApproved: user.loyaltyDiscountApproved,
    loyaltyDiscountRequestDate: user.loyaltyDiscountRequestDate,
    loyaltyDiscountApprovalDate: user.loyaltyDiscountApprovalDate
  };

  // If user is a mechanic, fetch additional mechanic data
  if (user.role === 'mechanic') {
    try {
      const Mechanic = (await import('../models/Mechanic.js')).default;
      const mechanicData = await Mechanic.findOne({ userId: user._id });
      
      if (mechanicData) {
        userData = {
          ...userData,
          location: mechanicData.location,
          specialties: mechanicData.specialties,
          specializations: mechanicData.specialties, // Alias for compatibility
          hourlyRate: mechanicData.hourlyRate,
          experience: mechanicData.experience,
          rating: mechanicData.rating?.average || 0,
          availability: mechanicData.availability,
          isOnline: mechanicData.isOnline,
          completedJobs: mechanicData.completedJobs,
          responseTime: mechanicData.responseTime
        };
      }
    } catch (error) {
      console.error('Error fetching mechanic data:', error);
      // Continue without mechanic data if there's an error
    }
  }

  res.json({ user: userData });
}

export async function logout(req, res) {
  clearAuthCookies(res);
  res.json({ ok: true });
}

export async function requestPasswordReset(req, res) {

  try {
    const { email } = req.body;
    console.log('Password reset request for email:', email);

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found for email:', email);
      return res.json({ ok: true }); // Don't reveal if user exists
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + (Number(process.env.RESET_OTP_TTL_MIN || 10) * 60000));

    user.resetOTP = { code: otp, expiresAt };
    await user.save();

    console.log('OTP generated for user:', user._id, 'OTP:', otp);

    try {
      const emailResult = await sendMail({
        to: email,
        subject: '🔐 Auto Elite – Password Reset OTP',
        text: `Your password reset OTP is: ${otp}\n\nThis OTP is valid for ${process.env.RESET_OTP_TTL_MIN || 10} minutes.\n\nIf you didn't request this, please ignore this email.`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auto Elite - Password Reset</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
        }
        .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 20px;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .content {
            background: white;
            padding: 40px 30px;
            text-align: center;
        }
        .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
            border: 3px solid #fff;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            font-family: 'Courier New', monospace;
        }
        .otp-label {
            font-size: 16px;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .brand {
            color: #667eea;
            font-weight: bold;
            font-size: 18px;
        }
        .validity {
            background: #e8f5e8;
            color: #2e7d32;
            padding: 10px 15px;
            border-radius: 5px;
            display: inline-block;
            margin: 15px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Auto Elite</h1>
            <p>Secure Password Reset</p>
        </div>

        <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="font-size: 16px; margin-bottom: 30px;">We received a request to reset your password. Use the OTP code below to complete the process:</p>

            <div class="otp-box">
                <div class="otp-label">Your One-Time Password</div>
                <div class="otp-code">${otp}</div>
            </div>

            <div class="validity">
                ⏰ Valid for ${process.env.RESET_OTP_TTL_MIN || 10} minutes
            </div>

            <div class="warning">
                ⚠️ If you didn't request this password reset, please ignore this email. Your account remains secure.
            </div>

            <p style="margin-top: 30px; color: #666;">
                For security reasons, this OTP will expire soon. Please use it immediately to reset your password.
            </p>
        </div>

        <div class="footer">
            <div class="brand">Auto Elite Service</div>
            <p style="font-size: 12px; margin-top: 10px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>`
      });

      if (emailResult?.fallback) {
        console.log('📧 OTP logged to console (email failed)');
      } else {
        console.log('📧 OTP email sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Continue with password reset even if email fails
      console.log('🔄 Continuing with password reset despite email failure');
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body;
    console.log('Password reset attempt for email:', email);

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Email, verification token, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationToken: token
    }).select('+password');

    if (!user) {
      console.log('User not found or invalid token for email:', email);
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Check if verification token is expired
    if (new Date() > new Date(user.verificationTokenExpires)) {
      console.log('Expired verification token for user:', user._id);
      return res.status(400).json({ message: 'Verification token has expired. Please request a new OTP.' });
    }

    user.password = newPassword;
    user.resetOTP = undefined; // Clear any remaining OTP data
    user.verificationToken = undefined; // Clear verification token
    user.verificationTokenExpires = undefined;
    await user.save();

    console.log('Password reset successful for user:', user._id);

    try {
      await AuditLog.create({ actor: user._id, action: 'password_reset' });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't fail the request if audit log fails
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

}
