require('dotenv').config();

const LAHZE_ADMIN_IDS = (process.env.LAHZE_ADMIN_IDS)
  .split(',')
  .map(id => Number(id.trim()));

module.exports = {
  TOKEN: process.env.TOKEN,
  LAHZE_ADMIN_IDS,
  dbConfig: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'lahze_user',
    password: process.env.DB_PASS || 'StrongPass_123!',
    database: process.env.DB_NAME || 'lahze_db'
  }
};
