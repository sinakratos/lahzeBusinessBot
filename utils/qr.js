const QRCode = require('qrcode');

async function generateQrBuffer(text) {
  return QRCode.toBuffer(text);
}

module.exports = { generateQrBuffer };
