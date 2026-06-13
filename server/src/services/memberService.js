const repo = require('../repositories/memberRepository');

const getAllMembers = () => repo.getAllMembers();

async function attachMember(cardId, memberId) {
  const [card, member] = await Promise.all([repo.cardExists(cardId), repo.memberExists(memberId)]);
  if (!card || !member) return { error: 'Card or member not found', status: 404 };
  await repo.attachMember(cardId, memberId);
  return { data: null };
}

const detachMember = async (cardId, memberId) => { await repo.detachMember(cardId, memberId); return { data: null }; };

module.exports = { getAllMembers, attachMember, detachMember };
