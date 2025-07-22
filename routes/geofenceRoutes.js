// const express = require('express');
// const router = express.Router();
// const geofenceController = require('../controllers/geofenceController');
// const authenticateToken = require('../middleware/auth');

// router.post('/', authenticateToken, geofenceController.createGeofence);
// router.get('/', authenticateToken, geofenceController.getGeofences);
// router.delete('/:zone_id', authenticateToken, geofenceController.deleteGeofence);
// router.post('/check-position', authenticateToken, geofenceController.checkPosition);
// router.get('/alerts', authenticateToken, geofenceController.getGeofenceAlerts); // New route

// module.exports = router;

const express = require('express');
const router = express.Router();
const geofenceController = require('../controllers/geofenceController');
const authenticateToken = require('../middleware/auth');

router.post('/', authenticateToken, geofenceController.createGeofence);
router.get('/', authenticateToken, geofenceController.getGeofences);
router.delete('/:zone_id', authenticateToken, geofenceController.deleteGeofence);
router.post('/check-position', authenticateToken, geofenceController.checkPosition);
router.get('/alerts', authenticateToken, geofenceController.getGeofenceAlerts);
router.patch('/alerts/:alert_id', authenticateToken, geofenceController.updateAlertStatus);
// Remove the async route handler and use the controller method instead
router.patch('/alerts/:alert_id/acknowledge', authenticateToken, geofenceController.acknowledgeAlert);
module.exports = router;