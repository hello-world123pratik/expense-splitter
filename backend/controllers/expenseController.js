const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const { createError } = require('../middleware/errorHandler');

// @desc    Add expense
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res, next) => {
  try {
    const { description, amount, category, paidBy, groupId, splitType, splitBetween, date, notes } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return next(createError('Group not found', 404));

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return next(createError('Not authorized', 403));

    // Calculate shares based on split type
    let processedSplits = [];
    const totalAmount = parseFloat(amount);

    if (splitType === 'equal') {
      const share = totalAmount / splitBetween.length;
      processedSplits = splitBetween.map(userId => ({
        user: userId,
        share: Math.round(share * 100) / 100,
      }));
    } else if (splitType === 'exact') {
      processedSplits = splitBetween.map(item => ({
        user: item.userId,
        share: parseFloat(item.amount),
      }));
      // Validate total
      const total = processedSplits.reduce((sum, s) => sum + s.share, 0);
      if (Math.abs(total - totalAmount) > 0.01) {
        return next(createError('Split amounts do not add up to total amount', 400));
      }
    } else if (splitType === 'percentage') {
      processedSplits = splitBetween.map(item => ({
        user: item.userId,
        share: Math.round((totalAmount * item.percentage / 100) * 100) / 100,
        percentage: item.percentage,
      }));
      const totalPercentage = splitBetween.reduce((sum, s) => sum + s.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return next(createError('Percentages must add up to 100%', 400));
      }
    }

    const expense = await Expense.create({
      description,
      amount: totalAmount,
      category: category || 'other',
      paidBy: paidBy || req.user._id,
      groupId,
      splitType: splitType || 'equal',
      splitBetween: processedSplits,
      date: date || Date.now(),
      notes,
    });

    // Add expense to group
    await Group.findByIdAndUpdate(groupId, {
      $push: {
        expenses: expense._id,
        activityLog: {
          user: req.user._id,
          action: 'added_expense',
          details: `Added expense "${description}" for ₹${totalAmount}`,
        },
      },
    });

    // Notify group members
    const paidByUser = await User.findById(paidBy || req.user._id).select('name');
    for (const member of group.members) {
      if (member.user.toString() !== req.user._id.toString()) {
        await User.findByIdAndUpdate(member.user, {
          $push: {
            notifications: {
              message: `${paidByUser.name} added expense "${description}" for ₹${totalAmount} in "${group.groupName}"`,
              type: 'expense',
              relatedId: groupId,
            },
          },
        });
      }
    }

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatar')
      .populate('splitBetween.user', 'name email avatar');

    const io = req.app.get('io');
    if (io) io.to(groupId.toString()).emit('expense-added', populated);

    res.status(201).json({ success: true, expense: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expenses for a group
// @route   GET /api/expenses/group/:groupId
// @access  Private
const getGroupExpenses = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 20, category, search, startDate, endDate, paidBy } = req.query;

    const group = await Group.findById(groupId);
    if (!group) return next(createError('Group not found', 404));

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return next(createError('Not authorized', 403));

    const query = { groupId, isDeleted: false };
    if (category) query.category = category;
    if (paidBy) query.paidBy = paidBy;
    if (search) query.description = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email avatar')
      .populate('splitBetween.user', 'name email avatar')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense || expense.isDeleted) return next(createError('Expense not found', 404));

    const group = await Group.findById(expense.groupId);
    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return next(createError('Not authorized', 403));

    const { description, amount, category, date, notes, splitType, splitBetween, paidBy } = req.body;

    if (description) expense.description = description;
    if (amount) expense.amount = parseFloat(amount);
    if (category) expense.category = category;
    if (date) expense.date = date;
    if (notes !== undefined) expense.notes = notes;
    if (paidBy) expense.paidBy = paidBy;

    if (splitType && splitBetween) {
      expense.splitType = splitType;
      const totalAmount = expense.amount;

      if (splitType === 'equal') {
        const share = totalAmount / splitBetween.length;
        expense.splitBetween = splitBetween.map(userId => ({
          user: userId,
          share: Math.round(share * 100) / 100,
        }));
      } else if (splitType === 'exact') {
        expense.splitBetween = splitBetween.map(item => ({
          user: item.userId,
          share: parseFloat(item.amount),
        }));
      } else if (splitType === 'percentage') {
        expense.splitBetween = splitBetween.map(item => ({
          user: item.userId,
          share: Math.round((totalAmount * item.percentage / 100) * 100) / 100,
          percentage: item.percentage,
        }));
      }
    }

    await expense.save();

    group.activityLog.push({
      user: req.user._id,
      action: 'updated_expense',
      details: `Updated expense "${expense.description}"`,
    });
    await group.save();

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatar')
      .populate('splitBetween.user', 'name email avatar');

    const io = req.app.get('io');
    if (io) io.to(expense.groupId.toString()).emit('expense-updated', populated);

    res.json({ success: true, expense: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense || expense.isDeleted) return next(createError('Expense not found', 404));

    const group = await Group.findById(expense.groupId);
    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return next(createError('Not authorized', 403));

    expense.isDeleted = true;
    await expense.save();

    group.activityLog.push({
      user: req.user._id,
      action: 'deleted_expense',
      details: `Deleted expense "${expense.description}"`,
    });
    await group.save();

    const io = req.app.get('io');
    if (io) io.to(expense.groupId.toString()).emit('expense-deleted', { expenseId: expense._id });

    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/expenses/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const groups = await Group.find({ 'members.user': userId });
    const groupIds = groups.map(g => g._id);

    const allExpenses = await Expense.find({ groupId: { $in: groupIds }, isDeleted: false })
      .populate('paidBy', 'name email avatar')
      .populate('splitBetween.user', 'name email avatar')
      .sort({ date: -1 });

    const allPayments = await require('../models/Payment').find({ groupId: { $in: groupIds } });

    let totalOwed = 0; // others owe me
    let totalOwing = 0; // I owe others

    for (const expense of allExpenses) {
      const payerId = expense.paidBy._id?.toString() || expense.paidBy.toString();

      if (payerId === userId) {
        // I paid - others owe me their shares
        for (const split of expense.splitBetween) {
          const splitUserId = split.user._id?.toString() || split.user.toString();
          if (splitUserId !== userId) {
            totalOwed += split.share;
          }
        }
      } else {
        // Someone else paid - I might owe them
        for (const split of expense.splitBetween) {
          const splitUserId = split.user._id?.toString() || split.user.toString();
          if (splitUserId === userId) {
            totalOwing += split.share;
          }
        }
      }
    }

    // Adjust for payments
    for (const payment of allPayments) {
      const payerId = payment.payer.toString();
      const receiverId = payment.receiver.toString();
      if (payerId === userId) totalOwing -= payment.amount;
      if (receiverId === userId) totalOwed -= payment.amount;
    }

    totalOwed = Math.max(0, Math.round(totalOwed * 100) / 100);
    totalOwing = Math.max(0, Math.round(totalOwing * 100) / 100);

    // Monthly breakdown (last 6 months)
    const monthlyData = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyData[key] = 0;
    }

    for (const expense of allExpenses) {
      const d = new Date(expense.date);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += expense.amount;
      }
    }

    // Category breakdown
    const categoryData = {};
    for (const expense of allExpenses) {
      categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount;
    }

    // Recent expenses (last 10)
    const recentExpenses = allExpenses.slice(0, 10);

    res.json({
      success: true,
      stats: {
        totalOwed,
        totalOwing,
        balance: totalOwed - totalOwing,
        groupCount: groups.length,
        expenseCount: allExpenses.length,
      },
      monthlyData: Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })),
      categoryData: Object.entries(categoryData).map(([category, amount]) => ({ category, amount })),
      recentExpenses,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addExpense, getGroupExpenses, updateExpense, deleteExpense, getDashboardStats };
