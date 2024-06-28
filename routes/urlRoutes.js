const express = require('express');
const {
  generateUlr,
  redirectUrl,
  getAllUrl,
  getUrl,
} = require('../controllers/urlContoller');
const { protect } = require('../controllers/authController');

const router = express.Router();

router.post('/', protect, generateUlr);
router.route('/:id').get(redirectUrl);
router.route('/api/url').get(protect, getAllUrl);
router.route('/api/url/:id').get(protect, getUrl);

module.exports = router;
