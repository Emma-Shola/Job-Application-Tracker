const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api');

class NotFoundError extends CustomAPIError {
  constructor(resource, id) {
    const message = id 
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(message, StatusCodes.NOT_FOUND);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND';
    this.resource = resource;
    this.id = id;
  }
}

module.exports = NotFoundError;