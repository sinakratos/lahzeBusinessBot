const { LAHZE_ADMIN_IDS } = require('../config');

function isAdmin(id) {
  return LAHZE_ADMIN_IDS.includes(Number(id));
}

module.exports = { isAdmin };
