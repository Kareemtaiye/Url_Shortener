const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.logIn);
router.post('/verify/:token', authController.verifyEmail);
router.get('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

router
  .route('/me')
  .get(authController.protect, userController.getMe)
  .patch(authController.protect, userController.updateMe);

module.exports = router;
