const { toPersianRange } = require('../utils/persianDate');
const { getConnection } = require('./index');

async function insertLinkRow(uuidValue, link, months) {
  const createdAt = new Date();
  const createdIso = createdAt.toISOString();
  const { display, start_jalali, expire_jalali } = toPersianRange(createdAt, months);
  const conn = await getConnection(true);

  await conn.query(
    `INSERT INTO links (uuid, link, created_at, expiry_months, start_jalali, expire_jalali) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidValue, link, createdIso, months, start_jalali, expire_jalali]
  );
  await conn.end();
  return { createdIso, display, start_jalali, expire_jalali };
}

async function getLinkRecord(uuidValue) {
  const conn = await getConnection(true);
  const [rows] = await conn.query(
    `SELECT id, uuid, link, created_at, expiry_months, start_jalali, expire_jalali FROM links WHERE uuid=? LIMIT 1`,
    [uuidValue]
  );
  await conn.end();
  return rows[0] || null;
}

module.exports = { insertLinkRow, getLinkRecord };
