const express = require('express');
const urlContoller = require('../controllers/urlContoller');
const { protect } = require('../controllers/authController');

const router = express.Router();

router.post('/', protect, urlContoller.generateUlr);
router.route('/:id').get(urlContoller.redirectUrl);
router.route('/api/url').get(protect, urlContoller.getAllUrl);
router.route('/api/url/:id').get(protect, urlContoller.getUrl);

module.exports = router;
