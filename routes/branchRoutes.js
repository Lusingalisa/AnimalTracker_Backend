const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const auth = require('../middleware/auth');

router.get('/:branchId', auth, branchController.getBranch);
router.post('/', auth, branchController.createBranch);
router.put('/:branchId', auth, branchController.updateBranch);
router.delete('/:branchId', auth, branchController.deleteBranch);
router.get('/all', auth, branchController.getAllBranches);

module.exports = router;