const { getLinkRecord } = require('../db/links');
const { getDisplayRows } = require('../db/customerData');
const { pending_customer_stage } = require('../services/flow');

module.exports = async function startHandler(ctx, bot) {
  try {
    const payload = ctx.startPayload;
    const userId = ctx.from?.id;

    // ✅ NORMAL START (NO QR)
    if (!payload) {
      await ctx.reply(
        '"لحظه"‌ست...\nجایی که می‌تونی حس خوب‌ رو با یه Qr-Code خاص بسازی 💫\n' +
        'برای دیدن ویدیو آموزش کار با بات روی لینک زیر بزنید👇\n\n' +
        'https://www.aparat.com/v/jjwpbc6'
      );

      await ctx.reply(
        'در غیر این صورت لطفا روی دکمه شماره تماس کلیک کنید و یا شمارتونو تایپ کنید',
        {
          reply_markup: {
            keyboard: [[{ text: '📞 ارسال شماره من', request_contact: true }]],
            one_time_keyboard: true,
            resize_keyboard: true
          }
        }
      );
      return;
    }

    // ✅ VIEW MODE (view_uuid)
    if (payload.startsWith('view_')) {
      const uuid = payload.replace('view_', '');
      const rows = await getDisplayRows(uuid);

      if (!rows || rows.length === 0) {
        await ctx.reply('اطلاعاتی برای نمایش وجود ندارد.');
        return;
      }

      await ctx.reply('سلام به بات لحظه خوش آمدید🔆\nاین “لحظه” مخصوص توئه👇');

      for (const r of rows) {
        const { data_type: type, data_value: val } = r;

        if (['name', 'contact', 'category'].includes(type)) continue;

        if (type === 'text') await ctx.reply(val);
        else if (type === 'photo') await ctx.replyWithPhoto(val);
        else if (type === 'video') await ctx.replyWithVideo(val);
        else if (type === 'voice') await ctx.replyWithVoice(val);
        else if (type === 'audio') await ctx.replyWithAudio(val);
        else if (type === 'website') await ctx.reply(`وب‌سایت ما: ${val}`);
        else if (type === 'instagram') await ctx.reply(`اینستاگرام 👇\n${val}`);
        else if (type === 'google_review') await ctx.reply(`گوگل ریویو 👇\n${val}`);
        else if (type === 'google_map') await ctx.reply(`موقعیت روی نقشه 👇\n${val}`);
        else if (type === 'facebook') await ctx.reply(`فیسبوک 👇\n${val}`);
        else if (type === 'linkedin') await ctx.reply(`لینکدین 👇\n${val}`);
        else if (type === 'x') await ctx.reply(`ایکس 👇\n${val}`);
        else if (type === 'whatsapp') await ctx.reply(`واتساپ 👇\n${val}`);
        else if (type === 'telegram_contact') await ctx.reply(`تلگرام 👇\n${val}`);
        else if (type === 'mobile') await ctx.reply(`شماره تماس: ${val}`);
        else if (type === 'landline') await ctx.reply(`شماره ثابت: ${val}`);
        else if (type === 'card_number') await ctx.reply(`شماره کارت: ${val}`);
        else await ctx.reply(`${type}: ${val}`);
      }

      return;
    }

    // ✅ NORMAL UUID FLOW (COLLECT OR DISPLAY)
    const uuid = payload;
    const linkRec = await getLinkRecord(uuid);

    if (!linkRec) {
      await ctx.reply('لینک اختصاصی نامعتبر است.');
      return;
    }

    // ✅ EXPIRY CHECK
    try {
      const createdAt = new Date(linkRec.created_at);
      const months = linkRec.expiry_months || 0;
      if (months && Date.now() > createdAt.getTime() + 30 * months * 24 * 3600 * 1000) {
        await ctx.reply('این لینک منقضی شده است.');
        return;
      }
    } catch (e) {}

    // ✅ IF CONTENT EXISTS → VIEW MODE
    const rows = await getDisplayRows(uuid);
    const nonMeta = rows.filter(r => !['name', 'contact', 'category'].includes(r.data_type));

    if (nonMeta.length > 0) {
      await ctx.reply('سلام به بات لحظه خوش آمدید🔆\nاین “لحظه” مخصوص توئه👇');

     for (const r of rows) {
        const { data_type: type, data_value: val } = r;

        if (['name', 'contact', 'category'].includes(type)) continue;

        if (type === 'text') await ctx.reply(val);
        else if (type === 'photo') await ctx.replyWithPhoto(val);
        else if (type === 'video') await ctx.replyWithVideo(val);
        else if (type === 'voice') await ctx.replyWithVoice(val);
        else if (type === 'audio') await ctx.replyWithAudio(val);
        else if (type === 'website') await ctx.reply(`وب‌سایت ما: ${val}`);
        else if (type === 'instagram') await ctx.reply(`اینستاگرام 👇\n${val}`);
        else if (type === 'google_review') await ctx.reply(`گوگل ریویو 👇\n${val}`);
        else if (type === 'google_map') await ctx.reply(`موقعیت روی نقشه 👇\n${val}`);
        else if (type === 'facebook') await ctx.reply(`فیسبوک 👇\n${val}`);
        else if (type === 'linkedin') await ctx.reply(`لینکدین 👇\n${val}`);
        else if (type === 'x') await ctx.reply(`ایکس 👇\n${val}`);
        else if (type === 'whatsapp') await ctx.reply(`واتساپ 👇\n${val}`);
        else if (type === 'telegram_contact') await ctx.reply(`تلگرام 👇\n${val}`);
        else if (type === 'mobile') await ctx.reply(`شماره تماس: ${val}`);
        else if (type === 'landline') await ctx.reply(`شماره ثابت: ${val}`);
        else if (type === 'card_number') await ctx.reply(`شماره کارت: ${val}`);
        else await ctx.reply(`${type}: ${val}`);
      }

      return;
    }

    // ✅ START BUSINESS DATA COLLECTION
    pending_customer_stage[userId] = {
      uuid,
      stage: 'ask_contact',
      choices_done: [],
      type: 'کسب‌وکار'
    };

    await ctx.reply(
      '"لحظه"‌ست...\nجایی که می‌تونی حس خوب‌ رو با یه Qr-Code خاص بسازی 💫\n' +
      'برای دیدن ویدیو آموزش کار با بات روی لینک زیر بزنید👇\n\n' +
      'https://www.aparat.com/v/jjwpbc6'
    );

    await ctx.reply(
      'در غیر این صورت لطفا روی دکمه شماره تماس کلیک کنید و یا شمارتونو تایپ کنید',
      {
        reply_markup: {
          keyboard: [[{ text: '📞 ارسال شماره من', request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      }
    );

  } catch (err) {
    console.error('start handler error:', err);
  }
};
