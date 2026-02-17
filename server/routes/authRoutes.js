const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const { 
  register, 
  login, 
  forgotPassword,
  resetPassword 
} = require('../controllers/authController')

// Public routes with validation
router.post('/register', [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .trim(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
], register)

router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .trim(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], login)

router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .trim()
], forgotPassword)

router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .trim(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
], resetPassword)

module.exports = router