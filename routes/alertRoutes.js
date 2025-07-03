const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const auth = require('../middleware/auth');

router.get('/:alertId', auth, alertController.getAlert);
router.post('/', auth, alertController.createAlert);
router.put('/:alertId', auth, alertController.updateAlert);
router.delete('/:alertId', auth, alertController.deleteAlert);

module.exports = router;