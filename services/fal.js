const fs = require('fs');
const path = require('path');

const hafezData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/hafez_cleaned.json'), 'utf8')
);

function getRandomFal() {
  const idx = Math.floor(Math.random() * hafezData.length);
  const entry = hafezData[idx];

  const poem = Array.isArray(entry.poem)
    ? entry.poem.join('\n')
    : entry.poem;

  const tafsir = entry.interpretation || '';

  return `🎯 ${entry.title}\n\n${poem}\n\n📜 تفسیر / معنی:\n${tafsir}`;
}

module.exports = { getRandomFal };
