const svc = require('../services/memberService');
const wrap = require('../utils/wrap');

const getAllMembers = wrap(async (req, res) => {
  res.json(await svc.getAllMembers());
});

const attachMember = wrap(async (req, res) => {
  const result = await svc.attachMember(req.params.cardId, req.body.member_id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(204).end();
});

const detachMember = wrap(async (req, res) => {
  await svc.detachMember(req.params.cardId, req.params.memberId);
  res.status(204).end();
});

module.exports = { getAllMembers, attachMember, detachMember };
