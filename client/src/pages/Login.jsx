import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  const { user, loading, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Attendance Tracker</h1>
        <p className="muted">Know exactly where you stand before the college tells you.</p>

        {!isLogin && (
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            minLength={isLogin ? undefined : 6}
            required
          />
          {!isLogin && <span className="muted small">At least 6 characters</span>}
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
        </button>

        <p className="small center">
          {isLogin ? 'New here?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => { setMode(isLogin ? 'register' : 'login'); setError(''); }}
          >
            {isLogin ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </form>
    </main>
  );
}
