const express = require('express');
const { validate, intParam } = require('../middleware/validate');
const ctrl = require('../controllers/memberController');

const router = express.Router();

router.get('/members', ctrl.getAllMembers);

router.post('/cards/:cardId/members',
  intParam('cardId'),
  validate({ member_id: { type: 'integer', required: true } }),
  ctrl.attachMember
);

router.delete('/cards/:cardId/members/:memberId', intParam('cardId', 'memberId'), ctrl.detachMember);

module.exports = router;
