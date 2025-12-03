const { CHOICE_KEY_TO_LABEL } = require('./labels');
const { getDisplayRows } = require('../db/customerData');

const pending_customer_stage = {}; // userId -> { uuid, stage, choices_done, await_for }
const shown_rules_confirmed = new Set();

async function showOptionsToUser(ctx, userId, uuid) {
  // If botOrCtx is a ctx object it will have .reply, else assume bot instance
  const optionKeys = [
    'email','mobile','landline','google_map','google_review','linkedin','facebook','x','instagram','whatsapp','telegram_contact',
    'website','text','photo','video','voice','audio','card_number','fal'
  ];
  // compute remaining
  const dbRows = await getDisplayRows(uuid);
  const saved = new Set(dbRows.map(r => r.data_type));
  const done = (pending_customer_stage[userId] && pending_customer_stage[userId].choices_done) || [];
  const filtered = optionKeys.filter(k => !saved.has(k) && !done.includes(k));
  filtered.push('getqr');

  // build inline keyboard two per row
  const inline = [];
  for (let i=0;i<filtered.length;i+=2) {
    const left = filtered[i];
    const row = [];
    row.push({ text: CHOICE_KEY_TO_LABEL[left] || left, callback_data: `pick|${left}|${uuid}` });
    if (i+1 < filtered.length) {
      const right = filtered[i+1];
      row.push({ text: CHOICE_KEY_TO_LABEL[right] || right, callback_data: `pick|${right}|${uuid}` });
    }
    inline.push(row);
  }

  if (ctx.reply) {
    await ctx.reply('لطفاً گزینه مورد نظر خود را انتخاب کنید:', { reply_markup: { inline_keyboard: inline }});
  } else {
    await bot.telegram.sendMessage(userId, 'لطفاً گزینه مورد نظر خود را انتخاب کنید:', { reply_markup: { inline_keyboard: inline }});
  }
}

module.exports = { pending_customer_stage, shown_rules_confirmed, showOptionsToUser };
