const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api');

class ValidationError extends CustomAPIError {
  constructor(message, errors = []) {
    super(message, StatusCodes.BAD_REQUEST);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.errors = errors;
  }
}

module.exports = ValidationError;