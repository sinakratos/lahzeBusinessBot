const mysql = require('mysql2/promise');
const { dbConfig } = require('../config');

async function getConnection(withDb = true) {
  const cfg = { ...dbConfig };
  if (!withDb) delete cfg.database;
  return mysql.createConnection(cfg);
}

module.exports = { getConnection };
