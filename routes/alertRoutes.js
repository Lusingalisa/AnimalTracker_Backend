// const express = require('express');
// const router = express.Router();
// const alertController = require('../controllers/alertController');
// const auth = require('../middleware/auth');

// router.get('/:alertId', auth, alertController.getAlert);
// router.post('/', auth, alertController.createAlert);
// router.put('/:alertId', auth, alertController.updateAlert);
// router.delete('/:alertId', auth, alertController.deleteAlert);

// module.exports = router; 

const express = require('express');
const router = express.Router();
const { getAlert, getAllAlerts, createAlert, updateAlert, deleteAlert } = require('../controllers/alertController');
const auth = require('../middleware/auth');

router.get('/', auth, getAllAlerts); // New endpoint for all alerts
router.get('/:alertId', auth, getAlert);
router.post('/', auth, createAlert);
router.put('/:alertId', auth, updateAlert);
router.delete('/:alertId', auth, deleteAlert);

module.exports = router;