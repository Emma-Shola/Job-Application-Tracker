const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api');

class ForbiddenError extends CustomAPIError {
  constructor(message = 'Forbidden') {
    super(message, StatusCodes.FORBIDDEN);
    this.name = 'ForbiddenError';
    this.code = 'FORBIDDEN';
  }
}

module.exports = ForbiddenError;