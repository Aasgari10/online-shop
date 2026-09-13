// src/utils/dateUtils.js

// ===== استفاده از moment از طریق npm =====
import moment from 'moment-timezone';

const IRAN_TIMEZONE = 'Asia/Tehran';

/**
 * تبدیل هر ورودی به Date با منطقه ایران
 */
export function parseLocalDate(input) {
  if (!input) return null;

  let result;

  // عدد (timestamp)
  if (typeof input === 'number') {
    result = moment(input).tz(IRAN_TIMEZONE);
    if (!result.isValid()) return null;
    return result.toDate();
  }

  // Date object
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null;
    result = moment(input).tz(IRAN_TIMEZONE);
    return result.toDate();
  }

  // رشته
  if (typeof input === 'string') {
    result = moment(input);
    if (result.isValid()) {
      return result.tz(IRAN_TIMEZONE).toDate();
    }
    const parts = input.split(/[- :]/).filter(p => p !== '' && !isNaN(p));
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const hour = parseInt(parts[3]) || 0;
      const minute = parseInt(parts[4]) || 0;
      const second = parseInt(parts[5]) || 0;
      result = moment({ year, month, day, hour, minute, second }).tz(IRAN_TIMEZONE);
      if (result.isValid()) return result.toDate();
    }
    return null;
  }

  return null;
}

/**
 * تبدیل Date به Unix Timestamp (میلی‌ثانیه) برای دیتابیس
 */
export function formatDateForDB(date) {
  const d = parseLocalDate(date);
  if (!d) return null;
  return moment(d).tz(IRAN_TIMEZONE).valueOf();
}

/**
 * محاسبه زمان باقی‌مانده (دقیق بر اساس زمان ایران)
 */
export function calculateTimeLeft(endTime) {
  const endMoment = moment(endTime).tz(IRAN_TIMEZONE);
  if (!endMoment.isValid()) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const nowMoment = moment().tz(IRAN_TIMEZONE);
  const diff = endMoment.valueOf() - nowMoment.valueOf();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const duration = moment.duration(diff);

  return {
    days: Math.floor(duration.asDays()),
    hours: duration.hours(),
    minutes: duration.minutes(),
    seconds: duration.seconds(),
  };
}