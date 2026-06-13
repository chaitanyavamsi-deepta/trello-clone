const express = require('express');
const { validate, intParam } = require('../middleware/validate');
const ctrl = require('../controllers/listController');

const router = express.Router();

router.post('/boards/:boardId/lists',
  intParam('boardId'),
  validate({ title: { type: 'string', required: true, max: 512 } }),
  ctrl.createList
);

router.put('/lists/:id',
  intParam('id'),
  validate({ title: { type: 'string', max: 512 }, position: { type: 'number' } }),
  ctrl.updateList
);

router.delete('/lists/:id', intParam('id'), ctrl.deleteList);

module.exports = router;
