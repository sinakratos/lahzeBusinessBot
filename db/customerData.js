const { getConnection } = require('./index');

async function saveDataRow(uuidValue, userId, dataType, dataValue) {
  const createdAt = new Date().toISOString();
  const conn = await getConnection(true);
  await conn.query(
    `INSERT INTO customer_data (uuid, user_id, data_type, data_value, created_at) VALUES (?, ?, ?, ?, ?)`,
    [uuidValue, userId, dataType, dataValue, createdAt]
  );
  await conn.end();
}

async function getDisplayRows(uuidValue) {
  const conn = await getConnection(true);
  const [rows] = await conn.query(
    `SELECT data_type, data_value FROM customer_data WHERE uuid=? ORDER BY id`,
    [uuidValue]
  );
  await conn.end();
  return rows || [];
}

module.exports = { saveDataRow, getDisplayRows };
