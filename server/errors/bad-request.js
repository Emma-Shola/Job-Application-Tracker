const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api');

class BadRequestError extends CustomAPIError {
  constructor(message, details = null) {
    super(message, StatusCodes.BAD_REQUEST);
    this.name = 'BadRequestError';
    this.code = 'BAD_REQUEST';
    this.details = details;
  }
}

module.exports = BadRequestError;