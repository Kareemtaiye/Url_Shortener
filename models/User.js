const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bycrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please provide your email address'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'please provide your password'],
    minLength: [8, 'Password character must be atleast 8'],
    select: false,
  },
  password_confirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Password and confirm password are not the same',
    },
  },
  urls: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Url',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  verified: {
    type: Boolean,
    default: false,
  },
  is_premium: {
    type: Boolean,
    default: false,
  },
  verifyEmailToken: String,
  verifyEmailTokenExpiresIn: Date,
  passwordResetToken: String,
  passwordResetTokenExpiresIn: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bycrypt.hash(this.password, 12);
  this.password_confirm = undefined;
});

userSchema.methods.comparePasswords = async function (
  underlyingPass,
  providedPass,
) {
  const result = await bycrypt.compare(providedPass, underlyingPass);
  return result;
};

userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.verifyEmailToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.verifyEmailTokenExpiresIn = Date.now() + 10 * 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(64).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetTokenExpiresIn = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
