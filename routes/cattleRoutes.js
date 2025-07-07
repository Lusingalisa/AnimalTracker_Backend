// const express = require('express');
// const router = express.Router();
// const cattleController = require('../controllers/cattleController');

// router.get('/location/:cattleId', cattleController.getLocation);
// // New endpoint for all cattle
// router.get('/', cattleController.getAllCattle);

// module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getLocation, getAllCattle } = require('../controllers/cattleController');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).send('Access denied');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = user;
    next();
  });
};

// Routes
router.get('/location/:cattleId', authenticateToken, getLocation);
router.get('/', authenticateToken, getAllCattle);

module.exports = router;