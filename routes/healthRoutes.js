const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const authenticateToken = require('../middleware/auth');

router.post('/metrics', authenticateToken, healthController.recordMetrics);
router.get('/metrics/:cattle_id', authenticateToken, healthController.getHealthMetrics);
router.get('/alerts', authenticateToken, healthController.getHealthAlerts);
router.patch('/alerts/:alert_id', authenticateToken, healthController.updateAlertStatus);

module.exports = router;