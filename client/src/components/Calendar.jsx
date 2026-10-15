const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Tapping a day moves it along this cycle
const NEXT = { none: 'present', present: 'absent', absent: 'holiday', holiday: 'none' };
const LETTER = { present: 'P', absent: 'A', holiday: 'H' };
const WORD = { present: 'present', absent: 'absent', holiday: 'holiday' };

// Build dates from local parts. toISOString() is UTC and would shift the day in India.
export function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayStr() {
  const n = new Date();
  return toDateStr(n.getFullYear(), n.getMonth(), n.getDate());
}

export default function Calendar({ year, month, records, onSelect, onPrev, onNext, canGoNext }) {
  const today = todayStr();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first grid

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`pad-${i}`} className="day-pad" />);

  for (let d = 1; d <= daysInMonth; d++) {
    const date = toDateStr(year, month, d);
    const status = records[date] || 'none';
    const future = date > today;
    cells.push(
      <button
        key={date}
        type="button"
        className={`day ${status !== 'none' ? `day-${status}` : ''} ${date === today ? 'day-today' : ''}`}
        disabled={future}
        onClick={() => onSelect(date, NEXT[status])}
        aria-label={`${d} ${MONTHS[month]}: ${status === 'none' ? 'not marked' : WORD[status]}`}
      >
        <span className="day-num">{d}</span>
        <span className="day-letter" aria-hidden="true">{LETTER[status] || ''}</span>
      </button>
    );
  }

  return (
    <div className="calendar">
      <div className="cal-head">
        <button type="button" className="btn btn-ghost" onClick={onPrev} aria-label="Previous month">‹</button>
        <h3>{MONTHS[month]} {year}</h3>
        <button type="button" className="btn btn-ghost" onClick={onNext} disabled={!canGoNext} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w) => <div key={w} className="weekday">{w}</div>)}
        {cells}
      </div>
      <p className="muted small cal-hint">Tap a day to cycle: present → absent → holiday → clear. Future dates are locked.</p>
    </div>
  );
}
