const express = require('express');
const { validate, intParam } = require('../middleware/validate');
const ctrl = require('../controllers/checklistController');

const router = express.Router();

router.post('/cards/:cardId/checklists',
  intParam('cardId'),
  validate({ title: { type: 'string', required: true, max: 512 } }),
  ctrl.createChecklist
);

router.delete('/checklists/:id', intParam('id'), ctrl.deleteChecklist);

router.post('/checklists/:checklistId/items',
  intParam('checklistId'),
  validate({ content: { type: 'string', required: true, max: 1024 } }),
  ctrl.createChecklistItem
);

router.put('/checklist-items/:id',
  intParam('id'),
  validate({ content: { type: 'string', max: 1024 }, is_complete: { type: 'boolean' } }),
  ctrl.updateChecklistItem
);

router.delete('/checklist-items/:id', intParam('id'), ctrl.deleteChecklistItem);

module.exports = router;
