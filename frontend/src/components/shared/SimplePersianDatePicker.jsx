// src/components/shared/SimplePersianDatePicker.jsx
import { useState, useEffect } from 'react';
import { jalaliToGregorian, gregorianToJalali, getJalaliMonthDays } from '../../utils/jalaliUtils';

function SimplePersianDatePicker({ 
  value, 
  onChange, 
  showTime = true, 
  className = '',
  timeLayout = 'inline' // 'inline' | 'stacked'
}) {
  const getJalaliFromDate = (date) => {
    if (!date) return { year: 1400, month: 1, day: 1, hour: 0, minute: 0 };
    const d = new Date(date);
    if (isNaN(d.getTime())) return { year: 1400, month: 1, day: 1, hour: 0, minute: 0 };
    const { jy, jm, jd } = gregorianToJalali(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate()
    );
    return {
      year: jy,
      month: jm,
      day: jd,
      hour: d.getHours(),
      minute: d.getMinutes(),
    };
  };

  const initial = getJalaliFromDate(value);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  const years = [];
  for (let i = 1300; i <= 1420; i++) years.push(i);

  const months = [
    { value: 1, label: 'فروردین' },
    { value: 2, label: 'اردیبهشت' },
    { value: 3, label: 'خرداد' },
    { value: 4, label: 'تیر' },
    { value: 5, label: 'مرداد' },
    { value: 6, label: 'شهریور' },
    { value: 7, label: 'مهر' },
    { value: 8, label: 'آبان' },
    { value: 9, label: 'آذر' },
    { value: 10, label: 'دی' },
    { value: 11, label: 'بهمن' },
    { value: 12, label: 'اسفند' },
  ];

  const daysInMonth = getJalaliMonthDays(year, month);
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  useEffect(() => {
    if (!year || !month || !day) return;
    const { gy, gm, gd } = jalaliToGregorian(year, month, day);
    const date = new Date(gy, gm - 1, gd, hour || 0, minute || 0);
    if (!isNaN(date.getTime())) {
      onChange(date);
    }
  }, [year, month, day, hour, minute, onChange]);

  useEffect(() => {
    const jalali = getJalaliFromDate(value);
    if (jalali.year !== year || jalali.month !== month || jalali.day !== day) {
      setYear(jalali.year);
      setMonth(jalali.month);
      setDay(jalali.day);
      setHour(jalali.hour);
      setMinute(jalali.minute);
    }
  }, [value]);

  const selectClassName =
    "px-2 py-1.5 pl-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white text-sm appearance-none bg-no-repeat";
  const selectStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
    backgroundPosition: 'left 0.2rem center',
    backgroundSize: '1.25rem',
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* ===== بخش تاریخ (روز، ماه، سال) ===== */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={day}
          onChange={(e) => setDay(parseInt(e.target.value))}
          className={selectClassName}
          style={selectStyle}
        >
          {days.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className={selectClassName}
          style={selectStyle}
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className={selectClassName}
          style={selectStyle}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* ===== بخش زمان (ساعت و دقیقه) ===== */}
      {showTime && (
        <div className={`
          flex items-center gap-2
          ${timeLayout === 'stacked' ? 'w-full mt-1' : ''}
        `}>
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-600 whitespace-nowrap">ساعت:</label>
            <input
              type="number"
              min="0"
              max="23"
              value={hour}
              onChange={(e) => setHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-14 px-1 py-1.5 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-600 whitespace-nowrap">دقیقه:</label>
            <input
              type="number"
              min="0"
              max="59"
              value={minute}
              onChange={(e) => setMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-14 px-1 py-1.5 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SimplePersianDatePicker;