// Fractional positioning (LLD §2, ADR-003).
// Items carry a DOUBLE PRECISION `position`; inserting between neighbors is a
// single-row UPDATE at their midpoint. When repeated midpoint splits squeeze a
// gap below MIN_GAP, the whole container is renumbered to multiples of STEP.

const STEP = 1024;
const MIN_GAP = 1e-6;

// `table`/`fkCol` are internal constants supplied by route code — never user
// input — so interpolating them into SQL is safe. Values are parameterized.

async function appendPosition(client, table, fkCol, fkVal) {
  const { rows } = await client.query(
    `SELECT COALESCE(MAX(position), 0) + ${STEP} AS pos FROM ${table} WHERE ${fkCol} = $1`,
    [fkVal]
  );
  return rows[0].pos;
}

async function rebalanceIfNeeded(client, table, fkCol, fkVal) {
  const { rows } = await client.query(
    `SELECT id, position FROM ${table} WHERE ${fkCol} = $1 ORDER BY position, id`,
    [fkVal]
  );
  const degraded = rows.some(
    (row, i) => i > 0 && row.position - rows[i - 1].position < MIN_GAP
  );
  if (!degraded) return false;
  for (let i = 0; i < rows.length; i++) {
    await client.query(`UPDATE ${table} SET position = $1 WHERE id = $2`, [
      (i + 1) * STEP,
      rows[i].id,
    ]);
  }
  return true;
}

module.exports = { STEP, MIN_GAP, appendPosition, rebalanceIfNeeded };
