
const { getConnection } = require('./index');
const { dbConfig } = require('../config');

async function initDB() {
  // create DB if not exists, create tables if not exists, and ALTER to add columns if missing.
  let conn;
  try {
    conn = await getConnection(false);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await conn.end();
  } catch (e) {
    if (conn) await conn.end();
    console.error('Error creating database', e);
    throw e;
  }

  try {
    conn = await getConnection(true);

    // base tables (if not exists)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(255) UNIQUE,
        link TEXT,
        created_at VARCHAR(64),
        expiry_months INT,
        start_jalali VARCHAR(64),
        expire_jalali VARCHAR(64)
      ) CHARACTER SET utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS customer_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(255),
        user_id BIGINT,
        data_type VARCHAR(64),
        data_value TEXT,
        created_at VARCHAR(64),
        INDEX (uuid)
      ) CHARACTER SET utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS choices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(255),
        user_id BIGINT,
        choice_order INT,
        choice_key VARCHAR(64),
        choice_label VARCHAR(200),
        INDEX (uuid)
      ) CHARACTER SET utf8mb4;
    `);

    // add business-specific columns to links table (if not present)
    const addCols = [
      "email VARCHAR(255)",
      "mobile VARCHAR(50)",
      "landline VARCHAR(50)",
      "google_map TEXT",
      "google_review TEXT",
      "linkedin TEXT",
      "facebook TEXT",
      "x TEXT",
      "instagram TEXT",
      "whatsapp TEXT",
      "telegram_contact TEXT",
      "website TEXT",
      "text_content TEXT",
      "image_url TEXT",
      "video_url TEXT",
      "voice_url TEXT",
      "music_url TEXT",
      "card_number VARCHAR(64)"
    ];
    for (const colDef of addCols) {
      const colName = colDef.split(' ')[0];
      const [rows] = await conn.query(`SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='links' AND COLUMN_NAME=?`, [dbConfig.database, colName]);
      if (rows[0].cnt === 0) {
        try {
          await conn.query(`ALTER TABLE links ADD COLUMN ${colDef};`);
          console.log('Added column', colName);
        } catch (errCol) {
          // ignore if fails (race conditions)
          console.warn('Could not add column', colName, errCol.message);
        }
      }
    }

    await conn.end();
    console.log('DB initialized/updated.');
  } catch (e) {
    if (conn) await conn.end();
    console.error('initDb error', e);
    throw e;
  }
}

module.exports = { initDB };
