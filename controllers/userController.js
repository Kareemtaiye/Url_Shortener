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
