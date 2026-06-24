const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'courtconnect_jwt_super_secret_key_12345', {
    expiresIn: '1d', // 1 day access token
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'courtconnect_jwt_refresh_super_secret_key_67890', {
    expiresIn: '7d', // 7 days refresh token
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, barNumber, courtroom } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Set verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phoneNumber,
      barNumber: role === 'lawyer' ? barNumber : undefined,
      courtroom: role === 'judge' ? courtroom : undefined,
      verificationToken,
      isVerified: role === 'citizen', // Citizen auto-verified for demo convenience, others verified via admin/link
    });

    // Log action
    await AuditLog.create({
      userId: user._id,
      action: 'USER_REGISTER',
      details: `Registered new user with role: ${role}`,
      ipAddress: req.ip,
    });

    // Send mock verification email for lawyers and judges
    if (!user.isVerified) {
      const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;
      const message = `Welcome to CourtConnect! Please verify your email link: ${verifyUrl}`;
      try {
        await sendEmail({
          to: user.email,
          subject: 'Email Verification - CourtConnect',
          text: message,
        });
      } catch (err) {
        console.error('Email sending failed during registration', err);
      }
    }

    res.status(201).json({
      success: true,
      token: generateAccessToken(user._id),
      refreshToken: generateRefreshToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Log action
    await AuditLog.create({
      userId: user._id,
      action: 'USER_LOGIN',
      details: 'Logged in successfully',
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      token: generateAccessToken(user._id),
      refreshToken: generateRefreshToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        phoneNumber: user.phoneNumber,
        barNumber: user.barNumber,
        courtroom: user.courtroom,
        signature: user.signature,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, barNumber, courtroom, signature } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name || user.name;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    if (user.role === 'lawyer' && barNumber) user.barNumber = barNumber;
    if (user.role === 'judge' && courtroom) user.courtroom = courtroom;
    if (signature) user.signature = signature;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        phoneNumber: user.phoneNumber,
        barNumber: user.barNumber,
        courtroom: user.courtroom,
        signature: user.signature,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify email address
// @route   GET /api/auth/verify/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'USER_VERIFY_EMAIL',
      details: 'Email verified successfully',
      ipAddress: req.ip,
    });

    res.status(200).send('<h1>Email Verified Successfully!</h1><p>You can now close this tab and log in to CourtConnect.</p>');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set hashed token and expire
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password reset token - CourtConnect',
        text: message,
      });

      res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      token: generateAccessToken(user._id),
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
