const express = require('express');
const { validate, intParam } = require('../middleware/validate');
const ctrl = require('../controllers/cardController');

const router = express.Router();

router.post('/lists/:listId/cards',
  intParam('listId'),
  validate({ title: { type: 'string', required: true, max: 512 } }),
  ctrl.createCard
);

router.get('/cards/:id', intParam('id'), ctrl.getCard);

router.put('/cards/:id',
  intParam('id'),
  validate({
    title: { type: 'string', max: 512 },
    description: { type: 'string', max: 5000 },
    due_date: { type: 'date', nullable: true },
    list_id: { type: 'integer' },
    position: { type: 'number' },
    is_archived: { type: 'boolean' },
  }),
  ctrl.updateCard
);

router.delete('/cards/:id', intParam('id'), ctrl.deleteCard);

module.exports = router;
