const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/:userId', auth, userController.getUser);
router.post('/', auth, userController.createUser);
router.put('/:userId', auth, userController.updateUser);
router.delete('/:userId', auth, userController.deleteUser);
router.get('/', auth, userController.getAllUsers);

module.exports = router;