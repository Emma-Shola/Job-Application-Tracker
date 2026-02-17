const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const asyncHandler = require('../middleware/async-handler');
const ApiResponse = require('../utils/response');
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ValidationError
} = require('../errors');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    throw new BadRequestError('Please provide name, email, and password', {
      name: !name ? 'Name is required' : undefined,
      email: !email ? 'Email is required' : undefined,
      password: !password ? 'Password is required' : undefined
    });
  }

  // Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestError('Please provide a valid email address');
  }

  // Check password length
  if (password.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters');
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError('User with this email already exists', 'email');
  }

  // ✅ CORRECT: Pass plain password - User model's pre-save hook will hash it
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: password, // Plain password
  });

  // Create JWT token
  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Remove password from response
  user.password = undefined;

  ApiResponse.created(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    }
  }, 'Registration successful!');
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new BadRequestError('Please provide email and password', {
      email: !email ? 'Email is required' : undefined,
      password: !password ? 'Password is required' : undefined
    });
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Create JWT token
  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Remove password from response
  user.password = undefined;

  ApiResponse.success(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    }
  }, 'Login successful');
});

/**
 * @desc    Get current user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  
  if (!user) {
    throw new NotFoundError('User');
  }

  ApiResponse.success(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    }
  });
});

/**
 * @desc    Update user details
 * @route   PUT /api/v1/auth/updatedetails
 * @access  Private
 */
const updateDetails = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const fieldsToUpdate = {};
  if (name) fieldsToUpdate.name = name;
  if (email) fieldsToUpdate.email = email.toLowerCase();

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    fieldsToUpdate,
    { new: true, runValidators: true }
  );

  ApiResponse.success(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    }
  }, 'Details updated successfully');
});

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/updatepassword
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Please provide current and new password');
  }

  if (newPassword.length < 6) {
    throw new BadRequestError('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user.userId).select('+password');

  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // ✅ CORRECT: Set plain password - User model's pre-save hook will hash it
  user.password = newPassword; // Plain password
  await user.save();

  // Create new token
  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  ApiResponse.success(res, {
    token,
    message: 'Password updated successfully'
  });
});

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgotpassword
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError('Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    // Don't reveal if user exists (security best practice)
    return ApiResponse.success(res, null, 'If an account exists with this email, a reset link will be sent.');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire (10 minutes)
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  
  await user.save();

  // In production, send email here
  if (process.env.NODE_ENV === 'development') {
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset URL: ${process.env.CLIENT_URL}/reset-password?token=${resetToken}`);
  }

  ApiResponse.success(res, null, 'Password reset email sent');
});

/**
 * @desc    Reset password
 * @route   PUT /api/v1/auth/resetpassword/:resettoken
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resettoken } = req.params;

  if (!password) {
    throw new BadRequestError('Password is required');
  }

  if (password.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters');
  }

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  // ✅ CORRECT: Set plain password - User model's pre-save hook will hash it
  user.password = password; // Plain password
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  
  await user.save();

  // Create new token for immediate login
  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  ApiResponse.success(res, {
    token,
    message: 'Password reset successful'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword
};