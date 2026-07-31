const express = require('express');
const {
  getPOSMachines,
  getPOSMachine,
  createPOSMachine,
  updatePOSMachine,
  deletePOSMachine
} = require('../controllers/posMachineController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getPOSMachines)
  .post(protect, authorize('Super Admin', 'Admin'), createPOSMachine);

router.route('/:id')
  .get(protect, getPOSMachine)
  .put(protect, authorize('Super Admin', 'Admin'), updatePOSMachine)
  .delete(protect, authorize('Super Admin', 'Admin'), deletePOSMachine);

module.exports = router;
