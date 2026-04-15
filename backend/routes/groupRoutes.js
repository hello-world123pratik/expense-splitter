const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createGroup, getGroups, getGroup, updateGroup,
  addMember, removeMember, deleteGroup,
} = require('../controllers/groupController');

router.route('/').get(protect, getGroups).post(protect, createGroup);
router.route('/:id').get(protect, getGroup).put(protect, updateGroup).delete(protect, deleteGroup);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;
