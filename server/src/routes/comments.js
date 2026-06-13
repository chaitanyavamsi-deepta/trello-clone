const express = require('express');
const { validate, intParam } = require('../middleware/validate');
const { LIMITS } = require('../constants');
const ctrl = require('../controllers/commentController');

const router = express.Router();

router.post('/cards/:cardId/comments',
  intParam('cardId'),
  validate({ body: { type: 'string', required: true, max: LIMITS.comment }, member_id: { type: 'integer' } }),
  ctrl.addComment
);

router.delete('/comments/:id', intParam('id'), ctrl.deleteComment);

module.exports = router;
