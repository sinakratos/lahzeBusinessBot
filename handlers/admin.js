const { isAdmin } = require('../services/isAdmin');

module.exports = async function adminHandler(ctx, bot) {
  try {
    const fromId = ctx.from && ctx.from.id;

    if (!isAdmin(fromId)) {
      await ctx.reply('⛔ شما دسترسی ادمین ندارید.');
      return;
    }

    const keyboard = [
      // [{ text: '1 ماه', callback_data: 'exp_1' }, { text: '2 ماه', callback_data: 'exp_2' }, { text: '3 ماه', callback_data: 'exp_3' }],
      // [{ text: '4 ماه', callback_data: 'exp_4' }, { text: '5 ماه', callback_data: 'exp_5' }, { text: '6 ماه', callback_data: 'exp_6' }]
      [{ text: '3 ماه', callback_data: 'exp_3' }, { text: '6 ماه', callback_data: 'exp_6' }, { text: '12 ماه', callback_data: 'exp_12' }]

    ];

   await ctx.reply('مدت اعتبار لینک را انتخاب کنید (ادمین فقط):', { reply_markup: { inline_keyboard: keyboard }});
  } catch (e) {
    console.error('admin cmd error', e);
  }
};
