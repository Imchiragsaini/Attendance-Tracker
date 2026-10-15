import { useState } from 'react';

const COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#c026d3', '#475569'];

// Used for both adding and editing a subject (pass `initial` to edit)
export default function SubjectForm({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [code, setCode] = useState(initial?.code || '');
  const [threshold, setThreshold] = useState(String(initial?.threshold ?? 50));
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    const t = Number(threshold);
    if (!name.trim()) return setError('Give the subject a name');
    if (!Number.isInteger(t) || t < 0 || t > 100) return setError('Minimum attendance must be a whole number from 0 to 100');

    setSaving(true);
    try {
      await onSave({ name: name.trim(), code: code.trim(), threshold: t, color });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label={initial ? 'Edit subject' : 'Add subject'}>
        <h2>{initial ? 'Edit subject' : 'Add subject'}</h2>

        <label>
          Subject name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Financial Accounting" maxLength={80} autoFocus />
        </label>

        <label>
          Subject code <span className="muted">(optional)</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. BC-201" maxLength={20} />
        </label>

        <label>
          Minimum attendance (%)
          <input type="number" min="0" max="100" step="1" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          <span className="muted small">Your college debars below this. Use a higher number if you want a safety margin.</span>
        </label>

        <div className="field">
          <span className="label-text">Colour</span>
          <div className="swatches">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`swatch ${c === color ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`Colour ${c}`}
                aria-pressed={c === color}
              />
            ))}
          </div>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
