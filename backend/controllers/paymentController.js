const Payment = require('../models/Payment');
const Group = require('../models/Group');
const User = require('../models/User');
const { createError } = require('../middleware/errorHandler');

// @desc    Record payment/settlement
// @route   POST /api/payments
// @access  Private
const recordPayment = async (req, res, next) => {
  try {
    const { receiver, amount, groupId, note, date } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return next(createError('Group not found', 404));

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return next(createError('Not authorized', 403));

    if (req.user._id.toString() === receiver) {
      return next(createError('You cannot pay yourself', 400));
    }

    const payment = await Payment.create({
      payer: req.user._id,
      receiver,
      amount: parseFloat(amount),
      groupId,
      note,
      date: date || Date.now(),
    });

    // Add to group
    await Group.findByIdAndUpdate(groupId, {
      $push: {
        payments: payment._id,
        activityLog: {
          user: req.user._id,
          action: 'settled_payment',
          details: `Settled ₹${amount}`,
        },
      },
    });

    // Notify receiver
    const receiverUser = await User.findById(receiver);
    if (receiverUser) {
      receiverUser.notifications.push({
        message: `${req.user.name} paid you ₹${amount} in "${group.groupName}"`,
        type: 'payment',
        relatedId: groupId,
      });
      await receiverUser.save();
    }

    const populated = await Payment.findById(payment._id)
      .populate('payer', 'name email avatar')
      .populate('receiver', 'name email avatar');

    const io = req.app.get('io');
    if (io) io.to(groupId.toString()).emit('payment-recorded', populated);

    res.status(201).json({ success: true, payment: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payments for a group
// @route   GET /api/payments/group/:groupId
// @access  Private
const getGroupPayments = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return next(createError('Group not found', 404));

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return next(createError('Not authorized', 403));

    const payments = await Payment.find({ groupId })
      .populate('payer', 'name email avatar')
      .populate('receiver', 'name email avatar')
      .sort({ date: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return next(createError('Payment not found', 404));

    if (payment.payer.toString() !== req.user._id.toString()) {
      return next(createError('Not authorized to delete this payment', 403));
    }

    await Payment.findByIdAndDelete(req.params.id);
    await Group.findByIdAndUpdate(payment.groupId, { $pull: { payments: payment._id } });

    res.json({ success: true, message: 'Payment deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { recordPayment, getGroupPayments, deletePayment };
