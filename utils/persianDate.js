const jalaali = require('jalaali-js');

const PERSIAN_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

function toPersianDateString(dt) {
  try {
    const gy = dt.getUTCFullYear(), gm = dt.getUTCMonth() + 1, gd = dt.getUTCDate();
    const j = jalaali.toJalaali(gy, gm, gd);
    return `${j.jd} ${PERSIAN_MONTHS[j.jm - 1]} ${j.jy}`;
  } catch (e) {
    return '';
  }
}

function toPersianRange(createdDt, months) {
  const expiry = new Date(createdDt.getTime() + 30 * months * 24 * 3600 * 1000);
  const start = toPersianDateString(createdDt);
  const end = toPersianDateString(expiry);
  return { display: (start && end) ? `${start} تا ${end}` : '', start_jalali: start, expire_jalali: end };
}

module.exports = { toPersianDateString, toPersianRange };
