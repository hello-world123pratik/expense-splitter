const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { recordPayment, getGroupPayments, deletePayment } = require('../controllers/paymentController');

router.post('/', protect, recordPayment);
router.get('/group/:groupId', protect, getGroupPayments);
router.delete('/:id', protect, deletePayment);

module.exports = router;
