const express = require('express');
const { validate, intParam } = require('../middleware/validate');
const ctrl = require('../controllers/labelController');

const router = express.Router();

router.get('/boards/:boardId/labels', intParam('boardId'), ctrl.getLabelsByBoard);

router.post('/boards/:boardId/labels',
  intParam('boardId'),
  validate({ name: { type: 'string', max: 128 }, color: { type: 'string', required: true, max: 7 } }),
  ctrl.createLabel
);

router.post('/cards/:cardId/labels',
  intParam('cardId'),
  validate({ label_id: { type: 'integer', required: true } }),
  ctrl.attachLabel
);

router.delete('/cards/:cardId/labels/:labelId', intParam('cardId', 'labelId'), ctrl.detachLabel);

module.exports = router;
