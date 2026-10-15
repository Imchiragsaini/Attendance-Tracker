import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Header from '../components/Header.jsx';
import Calendar from '../components/Calendar.jsx';
import SubjectForm from '../components/SubjectForm.jsx';
import { STATUS_LABEL, describeStats, formatPercentage } from '../stats.js';

export default function SubjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const now = new Date();
  const [subject, setSubject] = useState(null);
  const [records, setRecords] = useState({});
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const monthKey = `${ym.year}-${String(ym.month + 1).padStart(2, '0')}`;
  const isCurrentMonth = ym.year === now.getFullYear() && ym.month === now.getMonth();

  // Load the subject (with its stats)
  useEffect(() => {
    api
      .get('/subjects')
      .then(({ subjects }) => {
        const found = subjects.find((s) => s._id === id);
        if (found) setSubject(found);
        else navigate('/', { replace: true });
      })
      .catch((err) => setError(err.message));
  }, [id, navigate]);

  // Load the records for the month being shown
  useEffect(() => {
    let cancelled = false;
    api
      .get(`/attendance/${id}?month=${monthKey}`)
      .then(({ records }) => {
        if (!cancelled) setRecords(Object.fromEntries(records.map((r) => [r.date, r.status])));
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [id, monthKey]);

  function shiftMonth(delta) {
    setYm(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  async function mark(date, status) {
    setError('');
    const previous = records[date];

    // Update the screen immediately, then confirm with the server
    setRecords((r) => {
      const copy = { ...r };
      if (status === 'none') delete copy[date];
      else copy[date] = status;
      return copy;
    });

    try {
      const { stats } = await api.put('/attendance', { subjectId: id, date, status });
      setSubject((s) => ({ ...s, stats }));
    } catch (err) {
      setError(err.message);
      setRecords((r) => {
        const copy = { ...r };
        if (previous) copy[date] = previous;
        else delete copy[date];
        return copy;
      });
    }
  }

  async function saveEdit(data) {
    const { subject: updated } = await api.put(`/subjects/${id}`, data);
    setSubject(updated);
    setEditing(false);
  }

  async function remove() {
    if (!window.confirm(`Delete "${subject.name}" and all its attendance records? This cannot be undone.`)) return;
    try {
      await api.del(`/subjects/${id}`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  if (!subject) {
    return (
      <>
        <Header />
        <main className="page">
          {error ? <p className="error" role="alert">{error}</p> : <p className="muted">Loading…</p>}
        </main>
      </>
    );
  }

  const { stats } = subject;

  return (
    <>
      <Header />
      <main className="page">
        <Link to="/" className="back">← All subjects</Link>

        <div className="page-head">
          <div>
            <h1 style={{ borderLeft: `6px solid ${subject.color}`, paddingLeft: 12 }}>{subject.name}</h1>
            {subject.code && <p className="muted">{subject.code}</p>}
          </div>
          <div className="row-gap">
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-danger" onClick={remove}>Delete</button>
          </div>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <section className={`stats-panel status-${stats.status}`}>
          <div className="stat">
            <span className="stat-value">{formatPercentage(stats.percentage)}</span>
            <span className="stat-label">Attendance</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.present}</span>
            <span className="stat-label">Present</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.absent}</span>
            <span className="stat-label">Absent</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.threshold}%</span>
            <span className="stat-label">Minimum</span>
          </div>
          <div className="stats-message">
            <span className={`badge badge-${stats.status}`}>{STATUS_LABEL[stats.status]}</span>
            <p>{describeStats(stats)}</p>
          </div>
        </section>

        <Calendar
          year={ym.year}
          month={ym.month}
          records={records}
          onSelect={mark}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          canGoNext={!isCurrentMonth}
        />

        <p className="muted small">
          Holidays are left out of the percentage: only present and absent days count.
        </p>
      </main>

      {editing && <SubjectForm initial={subject} onSave={saveEdit} onClose={() => setEditing(false)} />}
    </>
  );
}
