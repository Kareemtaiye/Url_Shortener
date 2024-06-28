// const handleValidationErr = ()

const sendErrorRespone = (err, res) => {
  console.log('Error', err);
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  //   if (err.name === 'ValidationError') handleValidationErr(err, res);
  sendErrorRespone(err, res);
};
