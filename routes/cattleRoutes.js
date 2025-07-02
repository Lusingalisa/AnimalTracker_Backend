const express = require('express');
const router = express.Router();
const cattleController = require('../controllers/cattleController');

router.get('/location/:cattleId', cattleController.getLocation);

module.exports = router;