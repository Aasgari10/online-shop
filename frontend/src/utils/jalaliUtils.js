// src/utils/jalaliUtils.js

// ============================================================
// کد از gist.github.com/jdf-scr (نسخه 2.81)
// تبدیل دقیق تاریخ شمسی و میلادی
// ============================================================

function gregorian_to_jalali(gy, gm, gd) {
  var g_d_m, jy, jm, jd, gy2, days;
  g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  gy2 = (gm > 2) ? (gy + 1) : gy;
  days = 355666 + (365 * gy) + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  jy = -1595 + (33 * ~~(days / 12053));
  days %= 12053;
  jy += 4 * ~~(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += ~~((days - 1) / 365);
    days = (days - 1) % 365;
  }
  if (days < 186) {
    jm = 1 + ~~(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + ~~((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

function jalali_to_gregorian(jy, jm, jd) {
  var sal_a, gy, gm, gd, days;
  jy += 1595;
  days = -355668 + (365 * jy) + (~~(jy / 33) * 8) + ~~(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy = 400 * ~~(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * ~~(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * ~~(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += ~~((days - 1) / 365);
    days = (days - 1) % 365;
  }
  gd = days + 1;
  sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
  return [gy, gm, gd];
}

// ============================================================
// توابع کمکی برای استفاده در پروژه
// ============================================================

export function jalaliToGregorian(jy, jm, jd) {
  const [gy, gm, gd] = jalali_to_gregorian(jy, jm, jd);
  return { gy, gm, gd };
}

export function gregorianToJalali(gy, gm, gd) {
  const [jy, jm, jd] = gregorian_to_jalali(gy, gm, gd);
  return { jy, jm, jd };
}

export function formatJalaliDate(date) {
  if (!date || isNaN(date.getTime())) return '';
  const { jy, jm, jd } = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')} ${h}:${m}`;
}

export function getJalaliMonthDays(jy, jm) {
  const firstDay = jalaliToGregorian(jy, jm, 1);
  let nextMonth = jm + 1;
  let nextYear = jy;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }
  const firstDayNext = jalaliToGregorian(nextYear, nextMonth, 1);
  const date1 = new Date(firstDay.gy, firstDay.gm - 1, firstDay.gd);
  const date2 = new Date(firstDayNext.gy, firstDayNext.gm - 1, firstDayNext.gd);
  return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
}