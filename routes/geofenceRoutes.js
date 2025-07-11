const express = require('express');
const router = express.Router();
const geofenceController = require('../controllers/geofenceController');
const authenticateToken = require('../middleware/auth');

router.post('/', authenticateToken, geofenceController.createGeofence);
router.get('/', authenticateToken, geofenceController.getGeofences);
router.delete('/:zone_id', authenticateToken, geofenceController.deleteGeofence);
router.post('/check-position', authenticateToken, geofenceController.checkPosition);

module.exports = router;