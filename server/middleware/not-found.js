const { StatusCodes } = require('http-status-codes');

const notFoundMiddleware = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    status: StatusCodes.NOT_FOUND,
    error: 'NOT_FOUND',
    message: `Route ${req.originalUrl} not found`,
    ...(process.env.NODE_ENV === 'development' && {
      path: req.path,
      method: req.method
    })
  });
};

module.exports = notFoundMiddleware;