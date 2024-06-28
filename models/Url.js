const mongoose = require('mongoose');
const User = require('./User');

const urlSchema = new mongoose.Schema({
  url: String,
  shortened_url: String,
  generated_id: {
    type: String,
    unique: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Url must have user'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

urlSchema.pre('save', async function (next) {
  const found = await User.findByIdAndUpdate(
    this.user,
    {
      $addToSet: { urls: this._id },
    },
    {
      new: true,
      useFindAndModify: false,
    },
  );
  console.log(found);
  next();
});

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;
