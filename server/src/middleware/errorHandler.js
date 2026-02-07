/**
 * Global error handler. Catches unhandled errors and returns consistent JSON.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  console.error('Unhandled error:', err.message);

  const status = err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
};

module.exports = errorHandler;
