const { getConnection } = require('./index');

async function addChoiceRow(uuidValue, userId, choiceKey, choiceLabel) {
  const conn = await getConnection(true);
  const [exists] = await conn.query(
    `SELECT 1 FROM choices WHERE uuid=? AND user_id=? AND choice_key=? LIMIT 1`,
    [uuidValue, userId, choiceKey]
  );
  if (exists.length === 0) {
    const [maxRow] = await conn.query(`SELECT MAX(choice_order) AS m FROM choices WHERE uuid=? AND user_id=?`, [uuidValue, userId]);
    const nextOrder = (maxRow[0] && maxRow[0].m) ? maxRow[0].m + 1 : 1;
    await conn.query(`INSERT INTO choices (uuid, user_id, choice_order, choice_key, choice_label) VALUES (?, ?, ?, ?, ?)`,
      [uuidValue, userId, nextOrder, choiceKey, choiceLabel]);
  }
  await conn.end();
}

async function clearChoicesRows(uuidValue, userId) {
  const conn = await getConnection(true);
  await conn.query(`DELETE FROM choices WHERE uuid=? AND user_id=?`, [uuidValue, userId]);
  await conn.end();
}

module.exports = { addChoiceRow, clearChoicesRows };
