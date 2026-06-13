const repo = require('../repositories/boardRepository');

const listBoards = () => repo.listBoards();

const createBoard = (title, background) => repo.createBoard(title.trim(), background);

const getBoardById = (id) => repo.getBoardById(id);

const getBoardWithDetails = (id) => repo.getBoardWithDetails(id);

const updateBoard = (id, title, background) =>
  repo.updateBoard(id, title === undefined ? undefined : title.trim(), background);

const deleteBoard = (id) => repo.deleteBoard(id);

const searchCards = (boardId, q) => repo.searchCards(boardId, q);

module.exports = { listBoards, createBoard, getBoardById, getBoardWithDetails, updateBoard, deleteBoard, searchCards };
