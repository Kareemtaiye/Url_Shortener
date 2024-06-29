const AppError = require('../utilities/AppError');

const genValidationErr = err => {
  const errs = err.errors;
  const message = Object.values(errs)
    .map(el => el.message)
    .join(', ');
  console.log(message);
  return new AppError(message, 400);
};
const genDuplicateError = err => {
  const message = err.keyValue.email;
  return new AppError(` The Email "${message}" already exists`, 400);
};

const genInvalidJWTError = () => {
  return new AppError('Invalid token, please log in again!', 401);
};

const genExpiredJWTError = () => {
  return new AppError('Your token has expired, please log in again!', 401);
};

const sendErrorRespone = (err, res) => {
  console.log('Error', err.name, err.message);
  console.log(err);
  if (process.env.NODE_ENV === 'production') {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err.name === 'ValidationError') err = genValidationErr(err);
  if (err.code === 11000) err = genDuplicateError(err);
  if (err.name === 'JsonWebTokenError') err = genInvalidJWTError();
  if (err.name === 'TokenExpiredError') err = genExpiredJWTError();
  sendErrorRespone(err, res);
};
