const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api');

class UnauthorizedError extends CustomAPIError {
  constructor(message = 'Not authorized to access this resource') {
    super(message, StatusCodes.UNAUTHORIZED);
    this.name = 'UnauthorizedError';
    this.code = 'UNAUTHORIZED';
  }
}

module.exports = UnauthorizedError;