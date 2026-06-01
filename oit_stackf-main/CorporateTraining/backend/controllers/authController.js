const crypto = require('crypto');
const { body } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const Leaderboard = require('../models/Leaderboard');
const generateTokens = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const config = require('../config/env');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'User with this email already exists');
    }

    const activeSessionId = crypto.randomBytes(16).toString('hex');
    const user = await User.create({ name, email, password, activeSessionId });

    await Leaderboard.create({ user: user._id });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role, user.activeSessionId);

    // Save session
    await Session.create({
      user: user._id,
      activeSessionId: user.activeSessionId,
      deviceInfo: req.headers['user-agent'] || 'Unknown Device',
      ipAddress: req.ip || 'Unknown IP',
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      branch: user.branch,
      year: user.year,
      profileImage: user.profileImage,
    };

    // Send refreshToken in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, 201, 'User registered successfully', {
      token: accessToken,
      user: userResponse,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return errorResponse(res, 500, 'Server error during registration');
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const activeSessionId = crypto.randomBytes(16).toString('hex');
    user.activeSessionId = activeSessionId;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id, user.role, user.activeSessionId);

    // Disable all previous active sessions if only one active device is allowed
    // await Session.updateMany({ user: user._id }, { isActive: false });

    await Session.create({
      user: user._id,
      activeSessionId: user.activeSessionId,
      deviceInfo: req.headers['user-agent'] || 'Unknown Device',
      ipAddress: req.ip || 'Unknown IP',
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      branch: user.branch,
      year: user.year,
      profileImage: user.profileImage,
    };

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, 200, 'Login successful', {
      token: accessToken,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return errorResponse(res, 500, 'Server error during login');
  }
};

const getProfile = async (req, res) => {
  try {
    return successResponse(res, 200, 'Profile retrieved successfully', {
      user: req.user,
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving profile');
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'college', 'branch', 'year', 'profileImage'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.email || req.body.role) {
      return errorResponse(res, 400, 'Email and role cannot be changed through profile update');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'Profile updated successfully', { user });
  } catch (error) {
    console.error('Update profile error:', error.message);
    return errorResponse(res, 500, 'Server error updating profile');
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 404, 'No user found with this email');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your OIT_STACK account.</p>
      <p>Click the link below to reset your password. This link is valid for 30 minutes.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#4F46E5;color:#fff;border-radius:5px;text-decoration:none;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'OIT_STACK - Password Reset',
        html,
      });

      return successResponse(res, 200, 'Password reset email sent successfully');
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return errorResponse(res, 500, `Failed to send reset email: ${emailError.message}`);
    }
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return errorResponse(res, 500, 'Server error processing password reset');
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters');
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return successResponse(res, 200, 'Password reset successful. You can now log in with your new password.');
  } catch (error) {
    console.error('Reset password error:', error.message);
    return errorResponse(res, 500, 'Server error resetting password');
  }
};

const refreshAuthToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return errorResponse(res, 401, 'No refresh token found. Please log in.');
    }

    const session = await Session.findOne({ refreshToken, isActive: true });
    if (!session || session.expiresAt < Date.now()) {
      return errorResponse(res, 401, 'Refresh token invalid or expired. Please log in again.');
    }

    const user = await User.findById(session.user);
    if (!user) {
      return errorResponse(res, 401, 'User no longer exists.');
    }

    // Verify session matches user's active session
    if (user.activeSessionId !== session.activeSessionId) {
      session.isActive = false;
      await session.save();
      return errorResponse(res, 401, 'Session terminated. Please log in again.');
    }

    const { accessToken } = generateTokens(user._id, user.role, user.activeSessionId);

    return successResponse(res, 200, 'Token refreshed', { token: accessToken });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    return errorResponse(res, 500, 'Server error refreshing token');
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await Session.findOneAndUpdate({ refreshToken }, { isActive: false });
    }
    res.clearCookie('refreshToken');
    return successResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error.message);
    return errorResponse(res, 500, 'Server error logging out');
  }
};

const logoutAll = async (req, res) => {
  try {
    await Session.updateMany({ user: req.user._id }, { isActive: false });
    req.user.activeSessionId = null;
    await req.user.save();
    res.clearCookie('refreshToken');
    return successResponse(res, 200, 'Logged out from all devices');
  } catch (error) {
    console.error('Logout all error:', error.message);
    return errorResponse(res, 500, 'Server error logging out from all devices');
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  refreshAuthToken,
  logout,
  logoutAll
};


