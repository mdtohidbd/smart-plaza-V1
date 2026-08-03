const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const fs = require('fs');
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongo duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    const value = err.keyValue ? err.keyValue[field] : '';
    if (field === 'contactNumber') {
      message = 'A customer with this phone number already exists.';
    } else {
      message = `Duplicate field value entered: ${field} = "${value}".`;
    }
  }

  try {
    if (!process.env.VERCEL) {
      fs.appendFileSync('error_log.txt', new Date().toISOString() + '\n' + (err.stack || err) + '\n\n');
    }
  } catch (logErr) {
    console.error('Failed to write error log:', logErr.message);
  }
  res.status(statusCode);
  res.json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
