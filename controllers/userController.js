const User = require('../models/User');
const catchAsync = require('../utilities/catchAsync');

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id }).populate({
    path: 'urls',
    select: 'url shortened_url createdAt',
  });
  res.status(200).json({
    status: 'success',
    data: {
      data: user,
    },
  });
});

const filteredField = (obj, ...fields) => {
  const filteredObj = {};
  Object.keys(obj).forEach(el => {
    if (fields.includes(el)) filteredObj[el] = obj[el];
  });
  return filteredObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    { _id: req.user._id },
    filteredField(req.body, 'username', 'email'),
    { new: true },
  ).populate({
    path: 'urls',
    select: 'url shortened_url createdAt',
  });
  res.status(200).json({
    status: 'success',
    data: {
      data: user,
    },
  });
});
