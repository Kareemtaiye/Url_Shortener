const shortId = require('shortid');
const Url = require('../models/Url');
const catchAsync = require('../utilities/catchAsync');
const AppError = require('../utilities/AppError');
const axios = require('axios');
const User = require('../models/User');

const checkUrlFormat = url => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// console.log(checkUrlFormat('fghjkl'));

const checkUrlExists = async url => {
  try {
    const res = await axios.head(url);
    // console.log(res);
    if (res.status !== 404) return true;
  } catch (error) {
    console.log(error);
    if (error.message && error.message.includes('Network Error')) {
      return 'network error';
    }
    return false;
  }
};

exports.generateUlr = catchAsync(async (req, res, next) => {
  const { url } = req.body;
  if (!url) {
    return next(new AppError('No url provided!', 400));
  }
  const format = checkUrlFormat(url);
  if (!format) {
    return next(new AppError(`The provided url "${url}" is not a valid url!`));
  }
  const exists = await checkUrlExists(url);

  //   console.log('exists', exists);
  if (exists === 'network error') {
    return next(
      new AppError(
        `Cannot perform domain lookup due to bad internet connectivity`,
        400,
      ),
    );
  }

  if (!exists) {
    return next(
      new AppError(`The provided url "${url}" does not exist!!`, 404),
    );
  }
  const lookUpUserUrl = await User.findById(req.user._id).populate('urls');
  if (lookUpUserUrl.urls.find(el => el.url === url)) {
    return next(
      new AppError(`The provided url has already been shortened`, 400),
    );
  }

  let id = shortId.generate();
  const lookUpID = await Url.findOne({ generated_id: id });

  if (lookUpID) {
    id = shortId();
  }

  const redirect_url = `${req.protocol}://${req.get('host')}/${id}`;

  const createdUrl = await Url.create({
    url,
    shortened_url: redirect_url,
    generated_id: id,
    user: req.user._id,
  });

  res.status(201).json({
    status: 'succeess',
    data: {
      data: createdUrl,
    },
  });
});

exports.redirectUrl = catchAsync(async (req, res, next) => {
  console.log(req.cookies, 'cookies');
  const { id } = req.params;

  const savedUrl = await Url.findOne({ generated_id: id });
  if (!savedUrl) {
    return next(new AppError('URL not found', 404));
  }

  res.redirect(302, savedUrl.url);
});

exports.getAllUrl = catchAsync(async (req, res, next) => {
  const urls = await Url.find();
  res.status(200).json({
    status: 'success',
    result: urls.length,
    data: {
      data: urls,
    },
  });
});

exports.getUrl = catchAsync(async (req, res, next) => {
  const url = await Url.findOne({ _id: req.params.id });
  res.status(200).json({
    status: 'success',
    data: {
      data: url,
    },
  });
});
