require('dotenv').config();
const { Telegraf } = require('telegraf');
const { TOKEN } = require('./config');
const { initDB } = require('./db/init');

// Handlers
const startHandler = require('./handlers/start');
const messageHandler = require('./handlers/message');
const callbackHandler = require('./handlers/callback');
const adminHandler = require('./handlers/admin');

const bot = new Telegraf(TOKEN);

(async () => {
  try {
    await initDB();
    console.log('✅ DB ready, launching bot...');

    // Fetch bot info (needed for QR + start links)
    try {
      bot.botInfo = await bot.telegram.getMe();
    } catch (e) {
      console.warn('⚠️ Could not fetch bot info');
    }

    // ✅ Register Handlers
    bot.start((ctx) => startHandler(ctx, bot));
    bot.command('admin', (ctx) => adminHandler(ctx, bot));
    bot.on('message', (ctx) => messageHandler(ctx, bot));
    bot.on('callback_query', (ctx) => callbackHandler(ctx, bot));

    // ✅ Launch Bot
    await bot.launch();
    console.log('🤖 Bot started.');

    // ✅ Safe Shutdown
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
