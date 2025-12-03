const { pending_customer_stage, showOptionsToUser } = require('../services/flow');
const { saveDataRow, getDisplayRows } = require('../db/customerData');
const { addChoiceRow } = require('../db/choices');
const { CHOICE_KEY_TO_LABEL } = require('../services/labels');

function expectedTypeFor(key) {
    if (key === 'fal') return 'fal';
  if (['text','email','google_map','google_review','linkedin','facebook','x','instagram','website','card_number','mobile','landline','telegram','whatsapp'].includes(key)) return 'text';
  if (key === 'photo') return 'photo';
  if (key === 'voice') return 'voice';
  if (key === 'video') return 'video';
  if (key === 'audio') return 'audio';
  return 'text';
}

function validAudioFormat(filename, mime) {
  if (!filename && !mime) return true;
  const allowed = ['.mp3','.m4a','.wav','.ogg','.aac'];
  if (filename) {
    const lower = filename.toLowerCase();
    for (const ext of allowed) if (lower.endsWith(ext)) return true;
  }
  if (mime) {
    const m = mime.toLowerCase();
    if (m.includes('mpeg')||m.includes('mp3')||m.includes('x-m4a')||m.includes('wav')||m.includes('ogg')||m.includes('aac')) return true;
  }
  return false;
}

module.exports = async function messageHandler(ctx, bot) {
 try {
    const userId = ctx.from && ctx.from.id;
    const msg = ctx.message || {};
    const text = msg.text ? String(msg.text).trim() : '';
    const stage = pending_customer_stage[userId];

    if (!stage) {
      // no flow — hint
      await ctx.reply('لطفاً از لینک اختصاصی (QR) استفاده کنید یا /start را فشار دهید.');
      return;
    }

    const uuid = stage.uuid;

    // awaiting content
    if (stage.stage === 'await_content' && stage.await_for) {
      const key = stage.await_for;

      const dbRows = await getDisplayRows(uuid);
      const savedTypes = new Set(dbRows.map(r => r.data_type));
      if (savedTypes.has(key)) {
        await ctx.reply(`گزینه '${CHOICE_KEY_TO_LABEL[key] || key}' قبلاً ثبت شده است.`);
        stage.stage = 'pick_option'; delete stage.await_for;
        pending_customer_stage[userId] = stage;
        await showOptionsToUser(ctx, userId, uuid, stage.type);
        return;
      }

      const expected = expectedTypeFor(key);
      if (expected === 'fal') {
        await ctx.reply("فال حافظ اضافه شد."); return; }
      if (expected === 'text') {
        if (!text) { await ctx.reply('لطفاً متن/لینک/آیدی مورد نظر را ارسال کنید.'); return; }
        await saveDataRow(uuid, userId, key, text);
      } else if (expected === 'photo') {
        if (!msg.photo) { await ctx.reply('لطفاً ۱ عکس ارسال کنید'); return; }
        const fid = msg.photo.slice(-1)[0].file_id;
        await saveDataRow(uuid, userId, key, fid);
        await ctx.reply('دریافت شد ✅');
      } else if (expected === 'voice') {
        if (!msg.voice) { await ctx.reply('لطفا ویس (Voice) زیر ۱ دقیقه ارسال کنید.'); return; }
        const dur = msg.voice.duration || 0;
        if (dur > 60) { await ctx.reply('ویس شما بالای ۱ دقیقه بود؛ لطفا دوباره ارسال کنید.'); return; }
        await saveDataRow(uuid, userId, key, msg.voice.file_id);
        await ctx.reply('دریافت شد ✅');
      } else if (expected === 'video') {
        if (!msg.video) { await ctx.reply('لطفاً ۱ ویدیو ارسال کنید'); return; }
        const dur = msg.video.duration || 0;
        if (dur > 60) { await ctx.reply('ویدیو شما بالای ۱ دقیقه بود؛ لطفا دوباره ارسال کنید.'); return; }
        await saveDataRow(uuid, userId, key, msg.video.file_id);
        await ctx.reply('دریافت شد ✅');
      } else if (expected === 'audio') {
        if (!msg.audio) { await ctx.reply('لطفاً فایل آهنگ ارسال کنید (mp3/m4a/...).'); return; }
        const filename = msg.audio.file_name || '';
        const mime = msg.audio.mime_type || '';
        if (!validAudioFormat(filename, mime)) {
          await ctx.reply('فرمت نامعتبر است؛ لطفا فایل صوتی با فرمت mp3 یا m4a یا wav ارسال کنید.');
          return;
        }
        await saveDataRow(uuid, userId, key, msg.audio.file_id);
        await ctx.reply('دریافت شد ✅');
      } else {
        await ctx.reply('فرمت پشتیبانی نشده؛ لطفاً دوباره ارسال کنید.');
        return;
      }

      // persist order
      stage.choices_done = stage.choices_done || [];
      if (!stage.choices_done.includes(key)) {
        stage.choices_done.push(key);
        await addChoiceRow(uuid, userId, key, CHOICE_KEY_TO_LABEL[key] || key);
      }

      stage.stage = 'pick_option'; delete stage.await_for;
      pending_customer_stage[userId] = stage;
      await ctx.reply("✅ محتوای شما ثبت شد. می‌توانید گزینه‌های دیگر را انتخاب کنید یا روی 'دریافت QR-Code »' کلیک کنید.");
      await showOptionsToUser(ctx, userId, uuid, stage.type);
      return;
    }

    // ask_contact (contact step)
    if (stage.stage === 'ask_contact') {
      let contact = null;
      if (msg.contact && msg.contact.phone_number) contact = msg.contact.phone_number;
      else if (text && /\d/.test(text)) contact = text;
      else { await ctx.reply('در غیر این صورت لطفا روی دکمه شماره تماس کلیک کنید و یا شمارتونو تایپ کنید'); return; }
      await saveDataRow(uuid, userId, 'contact', contact);
      stage.stage = 'ask_name';
      pending_customer_stage[userId] = stage;
      await ctx.reply('ممنون 🌹\nلطفاً نام کسب‌وکار/نام خود را ارسال کنید 🙏');
      return;
    }

    // ask_name -> show rules
    if (stage.stage === 'ask_name') {
      if (!text) { await ctx.reply('لطفاً نام/نام کسب‌وکار را ارسال کنید.'); return; }
      await saveDataRow(uuid, userId, 'name', text);
      stage.stage = 'await_rules';
      pending_customer_stage[userId] = stage;
      // rules text with additional clause about deactivation
      const rulesText = `⚠️ قبل از ادامه لطفاً قوانین زیر را مطالعه و تایید کنید:\n\n🔸 محتوایی که ارسال می‌کنید باید با قوانین کشور سازگار باشد.\n🔸 از ارسال محتوای نامناسب یا آزاردهنده خودداری کنید.\n🔸 مسئولیت تمام محتوای ارسالی بر عهده شماست.\n\nدر صورت نقض قوانین، کیوآرکد شما غیر فعال می‌شود.\n\nآیا قوانین را تایید می‌کنید؟`;
      const keyboard = [
        [{ text: '✅ تایید می‌کنم', callback_data: `confirm_rules|${uuid}` }],
        [{ text: '❌ انصراف', callback_data: `cancel_rules|${uuid}` }]
      ];
      await ctx.reply(rulesText, { reply_markup: { inline_keyboard: keyboard }});
      return;
    }

    // fallback
    await ctx.reply('پیام دریافت شد. لطفاً از دکمه‌ها یا لینک اختصاصی استفاده کنید.');
  } catch (e) {
    console.error('message handler error', e);
  }
};
