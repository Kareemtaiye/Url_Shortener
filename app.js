const express = require('express');

const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const sanitizer = require('express-mongo-sanitize');
const clean = require('xss-clean');
const cookie = require('cookie-parser');

const urlRouter = require('./routes/urlRoutes');
const userRouter = require('./routes/userRoutes');

const GlobalErrorHandlingMiddleWare = require('./middlewares/globalError');

app.use(sanitizer());
app.use(clean());
app.use(morgan('dev'));
app.use(cookie());
// app.use(bodyParser())
app.use(express.json());

app.use('/', urlRouter);
app.use('/api/user', userRouter);

app.use('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Cannot find ${req.originalUrl} on the server`,
  });
});

app.use(GlobalErrorHandlingMiddleWare);

module.exports = app;
