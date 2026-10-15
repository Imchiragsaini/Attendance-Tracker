import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Header from '../components/Header.jsx';
import SubjectCard from '../components/SubjectCard.jsx';
import SubjectForm from '../components/SubjectForm.jsx';

export default function Dashboard() {
  const [subjects, setSubjects] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api
      .get('/subjects')
      .then(({ subjects }) => setSubjects(subjects))
      .catch((err) => setError(err.message));
  }, []);

  async function addSubject(data) {
    const { subject } = await api.post('/subjects', data);
    setSubjects((list) => [...(list || []), subject]);
    setAdding(false);
  }

  return (
    <>
      <Header />
      <main className="page">
        <div className="page-head">
          <h1>Your subjects</h1>
          <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Add subject</button>
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        {!subjects && !error && <p className="muted">Loading…</p>}

        {subjects && subjects.length === 0 && (
          <div className="empty">
            <h2>No subjects yet</h2>
            <p className="muted">Add your first subject, then open it to start marking your classes.</p>
            <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Add subject</button>
          </div>
        )}

        {subjects && subjects.length > 0 && (
          <div className="grid">
            {subjects.map((s) => <SubjectCard key={s._id} subject={s} />)}
          </div>
        )}
      </main>

      {adding && <SubjectForm onSave={addSubject} onClose={() => setAdding(false)} />}
    </>
  );
}
