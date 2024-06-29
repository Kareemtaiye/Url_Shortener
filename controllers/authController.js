const User = require('../models/User');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utilities/catchAsync');
const AppError = require('../utilities/AppError');
const Email = require('../utilities/email');
const { promisify } = require('util');
const crypto = require('crypto');

const { JWT_SECRET_KEY, JWT_EXPIRES_IN, COOKIE_EXPIRES_IN, NODE_ENV } =
  process.env;

const generateTokenAndSend = (user, status, res, message = undefined) => {
  const token = jwt.sign({ id: user._id }, JWT_SECRET_KEY, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(Date.now() + COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: NODE_ENV === 'production',
  };
  //sends the jwt to the broswer cookie tab
  res.cookie('jwt', token, cookieOptions);

  res.status(status).json({
    status: 'success',
    message,
    token,
    data: {
      data: user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const { username, email, password, password_confirm } = req.body;

  const user = await User.create({
    username,
    email,
    password,
    password_confirm,
  });

  const verifyToken = user?.createEmailVerificationToken();
  const url = `${req.protocol}://${req.get('host')}/api/user/verify/${verifyToken}`;

  await new Email(user, url).verifyEmail();
  await user.save({ validateBeforeSave: false });

  generateTokenAndSend(
    user,
    201,
    res,
    'Verification link has been sent to  mail',
  );
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    verifyEmailToken: hashedToken,
    verifyEmailTokenExpiresIn: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError(
        'Invalid or Expired Verification link, please request for another link',
        400,
      ),
    );
  }

  user.verified = true;
  user.verifyEmailToken = undefined;
  user.verifyEmailTokenExpiresIn = undefined;

  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
    message: 'Enail verified successfully',
  });
});

exports.logIn = async (req, res, next) => {
  //getb the incoming data from the client
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide your email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  console.log('user', user);

  //compare the incoming password with the saved password
  const checkPassword = await user?.comparePasswords(user.password, password);
  if (!user || !checkPassword) {
    return next(new AppError('Incorrect email or password'), 400);
  }

  generateTokenAndSend(user, 200, res);
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in, please log in to get access', 401),
    );
  }

  try {
    // Verify the token
    const decoded = await promisify(jwt.verify)(token, JWT_SECRET_KEY);

    // Check if the user still exists
    const checkUser = await User.findById(decoded.id);
    if (!checkUser) {
      return next(new AppError('User no longer exists', 401));
    }

    req.user = checkUser;
  } catch (err) {
    console.log(err);
    return next(new AppError('Invalid token', 401));
  }
  next();
});

exports.forgotPassword = async (req, res, next) => {
  const email = req.body.email;
  if (!email) {
    return next(new AppError('No email address provided', 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(
      new AppError('Cannot find the user with this email on the server', 404),
    );
  }
  try {
    const token = user?.createPasswordResetToken();
    const url = `${req.protocol}://${req.get('host')}/api/user/reset-password/${token}`;

    await new Email(user, url).resetPasswordMail();
    await user.save({ validateBeforeSave: false });
  } catch (err) {
    console.log('Sending error', err);
    return next(
      new AppError(
        'There was a problem sending the reset password link, please try again later',
        500,
      ),
    );
  }
  res.status(200).json({
    status: 'success',
    message: 'Link has been sent to your mail',
  });
};
exports.resetPassword = async (req, res, next) => {
  const { password, password_confirm } = req.body;
  if (!password || !password_confirm) {
    return next(
      new AppError('Please provide your password and confirm password', 400),
    );
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpiresIn: { $gt: Date.now() },
  });

  console.log('user', user);

  if (!user) {
    return next(new AppError('Token is Invalid or expired', 400));
  }

  if (password !== password_confirm) {
    return next(
      new AppError('Password and confirm password are not the same', 400),
    );
  }
  //set the password in the database with the new password
  user.password = req.body.password;
  user.password_confirm = req.body.password_confirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresIn = undefined;
  //save to update it
  await user.save({ validateBeforeSave: false });
  res.status(201).json({
    status: 'success',
    message: 'Password Reset Successfully',
  });
};
