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
const { getCattleLocations } = require('../controllers/mapController');

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
router.get('/map-data', authenticateToken, getCattleLocations); 
router.post('/map-data', authenticateToken, getCattleLocations);
router.get('/map-data', authenticateToken, getCattleLocations);
module.exports = router;