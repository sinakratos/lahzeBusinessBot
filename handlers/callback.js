const crypto = require('crypto');
const { pending_customer_stage, shown_rules_confirmed, showOptionsToUser } = require('../services/flow');
const { insertLinkRow, getLinkRecord } = require('../db/links');
// const { saveDataRow } = require('../db/customerData');
// const { addChoiceRow } = require('../db/choices');
const { generateQrBuffer } = require('../utils/qr');
const { CHOICE_KEY_TO_LABEL } = require('../services/labels');
const { toPersianRange } = require('../utils/persianDate');
const { LAHZE_ADMIN_IDS } = require('../config');
const { promptFor } = require('../services/prompts');

module.exports = async function callbackHandler(ctx, bot) {
  const data = ctx.callbackQuery?.data;
  const fromId = ctx.from?.id;

  if (!data) return;
  await ctx.answerCbQuery().catch(()=>{});

  // Admin menu quick actions
  if (data === 'admin_generate_link') {
  if (!LAHZE_ADMIN_IDS.includes(Number(fromId))) {
      return ctx.reply('شما اجازه دسترسی ندارید.');
    }
    const kb = [
      [{ text: '3 ماه', callback_data: 'exp_3' }, { text: '6 ماه', callback_data: 'exp_6' }, { text: '12 ماه', callback_data: 'exp_12' }]
      // [{ text: '1 ماه', callback_data: 'exp_1' }, { text: '3 ماه', callback_data: 'exp_3' }, { text: '6 ماه', callback_data: 'exp_6' }]
    ];
    return ctx.reply('مدت اعتبار را انتخاب کنید:', { reply_markup: { inline_keyboard: kb }});
  }

  if (data === 'admin_stats') {
    if (!LAHZE_ADMIN_IDS.includes(Number(fromId))) {
      return ctx.reply('شما اجازه دسترسی ندارید.');
    }
    return ctx.reply('📊 آمار: (فعلاً دیتابیس مورد نیاز است)');
  }

  // Admin: create link with expiry
  if (data.startsWith('exp_')) {
    if (!LAHZE_ADMIN_IDS.includes(Number(fromId))) {
      await ctx.editMessageText('شما اجازه ندارید.');
      return;
    }
    const months = parseInt(data.split('_')[1], 10) || 1;
    const uuidValue = crypto.randomUUID();
    const botUsername = (bot.botInfo && bot.botInfo.username) ? bot.botInfo.username : (ctx.botInfo && ctx.botInfo.username) ? ctx.botInfo.username : 'your_bot';
    const startLink = `https://t.me/${botUsername}?start=${uuidValue}`;

    // compute persian range
    const createdAt = new Date();
    const { display, start_jalali, expire_jalali } = toPersianRange(createdAt, months);

    // store including persian fields
    await insertLinkRow(uuidValue, startLink, months);

    const qBuf = await generateQrBuffer(startLink);
    const caption = `لینک ساخته شد ✅\n\n${startLink}\n\nمدت اعتبار: ${months} ماه\nاعتبار: ${display}`;
    await ctx.replyWithPhoto({ source: qBuf }, { caption });
    return;
  }

  // Confirm/cancel rules
  if (data.startsWith('confirm_rules|')) {
    const uuidValue = data.split('|')[1];
    shown_rules_confirmed.add(fromId);
    pending_customer_stage[fromId] = pending_customer_stage[fromId] || {};
    pending_customer_stage[fromId].uuid = uuidValue;
    pending_customer_stage[fromId].stage = 'pick_option';
    pending_customer_stage[fromId].choices_done = pending_customer_stage[fromId].choices_done || [];
    await ctx.editMessageText('✅ قوانین تایید شد. عالی! 🎉\nشما به طور پیش‌فرض "هدیه‌دهنده" انتخاب شده‌اید. لطفاً محتوا را ارسال کنید یا گزینه‌ها را انتخاب کنید.');
    await showOptionsToUser(ctx, fromId, uuidValue);
    return;
  }

  if (data.startsWith('cancel_rules|')) {
    delete pending_customer_stage[fromId];
    await ctx.editMessageText('فرایند لغو شد. لطفا با پشتیبانی صحبت کنید @Ramsaz');
    return;
  }

  // pick|{key}|{uuid}
  if (data.startsWith('pick|')) {
    const parts = data.split('|');
    if (parts.length < 3) {
      await ctx.reply('داده نامعتبر.');
      return;
    }
    const key = parts[1];
    const uuid = parts[2];

    // getqr
    if (key === 'getqr') {
      const botUsername = (bot.botInfo && bot.botInfo.username) ? bot.botInfo.username : (ctx.botInfo && ctx.botInfo.username) ? ctx.botInfo.username : 'your_bot';
      const startLink = `https://t.me/${botUsername}?start=${uuid}`;
      const qBuf = await generateQrBuffer(startLink);
      const linkRec = await getLinkRecord(uuid);
      let persianRange = '';
      if (linkRec && linkRec.created_at) {
        try {
          persianRange = toPersianRange(new Date(linkRec.created_at), linkRec.expiry_months || 0).display;
        } catch (e) {}
      }
      let caption = `QR نهایی ساخته شد ✅\n\nلینک:\n${startLink}\n`;
      if (persianRange) caption += `\nاعتبار: ${persianRange}`;
      await ctx.replyWithPhoto({ source: qBuf }, { caption });
      delete pending_customer_stage[fromId];
      return;
    }

    // validate
    if (!Object.keys(CHOICE_KEY_TO_LABEL).includes(key)) {
      await ctx.reply('گزینه نامعتبر است.');
      return;
    }

    // ensure stage
    pending_customer_stage[fromId] = pending_customer_stage[fromId] || { uuid, stage: 'pick_option', choices_done: [] };
    pending_customer_stage[fromId].uuid = uuid;

    // check DB for already saved types
    const dbRows = await require('../db/customerData').getDisplayRows(uuid);
    const savedTypes = new Set(dbRows.map(r => r.data_type));
    if (savedTypes.has(key)) {
      await ctx.reply(`گزینه '${CHOICE_KEY_TO_LABEL[key] || key}' قبلاً ثبت شده است.`);
      return;
    }

    // check in-memory duplicates
    if ((pending_customer_stage[fromId].choices_done || []).includes(key)) {
      await ctx.reply(`گزینه '${CHOICE_KEY_TO_LABEL[key] || key}' قبلاً انتخاب شده است.`);
      return;
    }
    // ✅ FAL SPECIAL FLOW (no content upload)
    // if (key === 'fal') {
    //   // ✅ remove old inline buttons immediately
    //   try {
    //     await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    //   } catch (e) {}

    //   // ✅ save to DB
    //   await saveDataRow(uuid, fromId, 'fal', 'auto');
    //   await addChoiceRow(uuid, fromId, 'fal', 'فال حافظ');

    //   // ✅ mark as used IN MEMORY (this is what hides the button)
    //   pending_customer_stage[fromId].choices_done.push('fal');

    //   // ✅ reset state
    //   pending_customer_stage[fromId].stage = 'pick_option';
    //   delete pending_customer_stage[fromId].await_for;

    //   // ✅ send confirmation
    //   await ctx.reply('✅ فال حافظ به هدیه اضافه شد.');

    //   // ✅ VERY IMPORTANT: correct menu call
    //   await showOptionsToUser(ctx, fromId, uuid);

    //   return;
    // }
    // set awaiting
    pending_customer_stage[fromId].stage = 'await_content';
    pending_customer_stage[fromId].await_for = key;
    await ctx.reply(promptFor(key));
    return;
  }
};
