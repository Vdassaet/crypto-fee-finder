/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.url}:`, err);

  const statusCode = err.statusCode || 500;
  const response = {
    error: true,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
