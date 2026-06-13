const express = require('express');
const { validate, intParam } = require('../middleware/validate');
const ctrl = require('../controllers/boardController');

const router = express.Router();

router.get('/boards', ctrl.listBoards);

router.post('/boards',
  validate({ title: { type: 'string', required: true, max: 512 }, background: { type: 'string', max: 64 } }),
  ctrl.createBoard
);

router.get('/boards/:id', intParam('id'), ctrl.getBoard);

router.put('/boards/:id',
  intParam('id'),
  validate({ title: { type: 'string', max: 512 }, background: { type: 'string', max: 64 } }),
  ctrl.updateBoard
);

router.delete('/boards/:id', intParam('id'), ctrl.deleteBoard);

router.get('/boards/:boardId/cards/search', intParam('boardId'), ctrl.searchCards);

module.exports = router;
