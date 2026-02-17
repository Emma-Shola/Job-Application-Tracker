const { StatusCodes } = require('http-status-codes');

class ApiResponse {
  static success(res, data, message = 'Success', statusCode = StatusCodes.OK) {
    return res.status(statusCode).json({
      success: true,
      status: statusCode,
      message,
      data
    });
  }

  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, StatusCodes.CREATED);
  }

  static paginated(res, data, pagination, message = 'Data retrieved successfully') {
    return res.status(StatusCodes.OK).json({
      success: true,
      status: StatusCodes.OK,
      message,
      data,
      pagination
    });
  }

  static noContent(res, message = 'No content') {
    return res.status(StatusCodes.NO_CONTENT).json({
      success: true,
      status: StatusCodes.NO_CONTENT,
      message
    });
  }
}

module.exports = ApiResponse;