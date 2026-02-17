const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api');

class ConflictError extends CustomAPIError {
  constructor(message, field = null) {
    super(message, StatusCodes.CONFLICT);
    this.name = 'ConflictError';
    this.code = 'CONFLICT';
    this.field = field;
  }
}

module.exports = ConflictError;