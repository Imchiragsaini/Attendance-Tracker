import { Link } from 'react-router-dom';
import { STATUS_LABEL, describeStats, formatPercentage } from '../stats.js';

export default function SubjectCard({ subject }) {
  const { stats } = subject;
  const pct = stats.percentage ?? 0;

  return (
    <Link
      to={`/subject/${subject._id}`}
      className={`card subject-card status-${stats.status}`}
      style={{ '--accent': subject.color }}
    >
      <div className="card-top">
        <div>
          <h2 className="subject-name">{subject.name}</h2>
          {subject.code && <p className="muted small">{subject.code}</p>}
        </div>
        <div className="big-pct">{formatPercentage(stats.percentage)}</div>
      </div>

      <div
        className="bar"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Attendance ${formatPercentage(stats.percentage)}, minimum ${stats.threshold}%`}
      >
        <div className="bar-fill" style={{ width: `${pct}%` }} />
        <div className="bar-marker" style={{ left: `${stats.threshold}%` }} title={`Minimum ${stats.threshold}%`} />
      </div>

      <div className="card-bottom">
        <span className={`badge badge-${stats.status}`}>{STATUS_LABEL[stats.status]}</span>
        <span className="muted small">
          {stats.present} present · {stats.absent} absent
        </span>
      </div>
      <p className="advice">{describeStats(stats)}</p>
    </Link>
  );
}
