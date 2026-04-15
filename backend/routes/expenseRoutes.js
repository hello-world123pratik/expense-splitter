const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  addExpense, getGroupExpenses, updateExpense, deleteExpense, getDashboardStats,
} = require('../controllers/expenseController');

router.get('/dashboard', protect, getDashboardStats);
router.post('/', protect, addExpense);
router.get('/group/:groupId', protect, getGroupExpenses);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);

module.exports = router;
