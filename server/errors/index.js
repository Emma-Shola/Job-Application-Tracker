const BadRequestError = require('./bad-request');
const NotFoundError = require('./not-found');
const UnauthorizedError = require('./unauthorized');
const ForbiddenError = require('./forbidden');
const ConflictError = require('./conflict');
const ValidationError = require('./validation');
const CustomAPIError = require('./custom-api');

module.exports = {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  CustomAPIError,
};