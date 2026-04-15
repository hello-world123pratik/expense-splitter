const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const { createError } = require('../middleware/errorHandler');
const { calculateGroupBalances } = require('../utils/debtSimplifier');

// @desc    Create group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res, next) => {
  try {
    const { groupName, description, category, icon, memberEmails } = req.body;

    const group = await Group.create({
      groupName,
      description,
      category: category || 'other',
      icon: icon || '👥',
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    // Add members by email
    if (memberEmails && memberEmails.length > 0) {
      for (const email of memberEmails) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && user._id.toString() !== req.user._id.toString()) {
          const alreadyMember = group.members.find(m => m.user.toString() === user._id.toString());
          if (!alreadyMember) {
            group.members.push({ user: user._id, role: 'member' });
            user.groups.push(group._id);
            await user.save();

            // Notify invited user
            user.notifications.push({
              message: `${req.user.name} added you to group "${groupName}"`,
              type: 'group',
              relatedId: group._id,
            });
            await user.save();
          }
        }
      }
      await group.save();
    }

    // Add group to creator's profile
    await User.findByIdAndUpdate(req.user._id, { $push: { groups: group._id } });

    // Log activity
    group.activityLog.push({
      user: req.user._id,
      action: 'created_group',
      details: `Created group "${groupName}"`,
    });
    await group.save();

    const populated = await Group.findById(group._id).populate('members.user', 'name email avatar').populate('createdBy', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(group._id.toString()).emit('group-updated', { type: 'created', group: populated });
    }

    res.status(201).json({ success: true, group: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's groups
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
      isArchived: false,
    })
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    // Calculate totals for each group
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const expenses = await Expense.find({ groupId: group._id, isDeleted: false });
        const payments = await Payment.find({ groupId: group._id });
        const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

        const { balances } = calculateGroupBalances(expenses, payments);
        const userBalance = balances[req.user._id.toString()] || 0;

        return {
          ...group.toObject(),
          totalAmount,
          userBalance: Math.round(userBalance * 100) / 100,
          expenseCount: expenses.length,
        };
      })
    );

    res.json({ success: true, groups: groupsWithStats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Private
const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate({
        path: 'activityLog.user',
        select: 'name avatar',
      });

    if (!group) return next(createError('Group not found', 404));

    const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return next(createError('Not authorized to view this group', 403));

    // Get expenses and payments
    const expenses = await Expense.find({ groupId: group._id, isDeleted: false })
      .populate('paidBy', 'name email avatar')
      .populate('splitBetween.user', 'name email avatar')
      .sort({ date: -1 });

    const payments = await Payment.find({ groupId: group._id })
      .populate('payer', 'name email avatar')
      .populate('receiver', 'name email avatar')
      .sort({ date: -1 });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const { balances, transactions } = calculateGroupBalances(expenses, payments);

    // Enrich transactions with user data
    const enrichedTransactions = await Promise.all(
      transactions.map(async (t) => {
        const fromUser = await User.findById(t.from).select('name email avatar');
        const toUser = await User.findById(t.to).select('name email avatar');
        return { ...t, fromUser, toUser };
      })
    );

    // Enrich balances with user data
    const enrichedBalances = await Promise.all(
      Object.entries(balances).map(async ([userId, balance]) => {
        const user = await User.findById(userId).select('name email avatar');
        return { user, balance: Math.round(balance * 100) / 100 };
      })
    );

    res.json({
      success: true,
      group,
      expenses,
      payments,
      totalAmount,
      balances: enrichedBalances,
      transactions: enrichedTransactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private
const updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(createError('Group not found', 404));

    const isAdmin = group.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );
    if (!isAdmin) return next(createError('Only admins can update the group', 403));

    const { groupName, description, category, icon } = req.body;
    if (groupName) group.groupName = groupName;
    if (description !== undefined) group.description = description;
    if (category) group.category = category;
    if (icon) group.icon = icon;

    group.activityLog.push({
      user: req.user._id,
      action: 'updated_group',
      details: `Updated group settings`,
    });

    await group.save();
    const updated = await Group.findById(group._id).populate('members.user', 'name email avatar');

    res.json({ success: true, group: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to group
// @route   POST /api/groups/:id/members
// @access  Private
const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return next(createError('Group not found', 404));

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return next(createError('Not authorized', 403));

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) return next(createError('User with this email not found', 404));

    const alreadyMember = group.members.some(m => m.user.toString() === userToAdd._id.toString());
    if (alreadyMember) return next(createError('User is already a member', 400));

    group.members.push({ user: userToAdd._id, role: 'member' });
    group.activityLog.push({
      user: req.user._id,
      action: 'added_member',
      details: `Added ${userToAdd.name} to group`,
    });
    await group.save();

    await User.findByIdAndUpdate(userToAdd._id, { $push: { groups: group._id } });

    // Notify new member
    userToAdd.notifications.push({
      message: `${req.user.name} added you to group "${group.groupName}"`,
      type: 'group',
      relatedId: group._id,
    });
    await userToAdd.save();

    const updated = await Group.findById(group._id).populate('members.user', 'name email avatar');

    const io = req.app.get('io');
    if (io) io.to(group._id.toString()).emit('group-updated', { type: 'member-added', group: updated });

    res.json({ success: true, group: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
const removeMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(createError('Group not found', 404));

    const isAdmin = group.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );
    const isSelf = req.params.userId === req.user._id.toString();

    if (!isAdmin && !isSelf) return next(createError('Not authorized to remove members', 403));

    group.members = group.members.filter(m => m.user.toString() !== req.params.userId);
    group.activityLog.push({
      user: req.user._id,
      action: 'removed_member',
      details: `Removed a member from group`,
    });
    await group.save();

    await User.findByIdAndUpdate(req.params.userId, { $pull: { groups: group._id } });

    const updated = await Group.findById(group._id).populate('members.user', 'name email avatar');
    res.json({ success: true, group: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private
const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(createError('Group not found', 404));

    const isCreator = group.createdBy.toString() === req.user._id.toString();
    if (!isCreator) return next(createError('Only the creator can delete the group', 403));

    // Remove group from all members
    for (const member of group.members) {
      await User.findByIdAndUpdate(member.user, { $pull: { groups: group._id } });
    }

    await Group.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createGroup, getGroups, getGroup, updateGroup, addMember, removeMember, deleteGroup };
