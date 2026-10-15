import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="app-header">
      <Link to="/" className="brand">Attendance Tracker</Link>
      <div className="header-right">
        <span className="muted hide-small">{user?.name}</span>
        <button className="btn btn-ghost" onClick={logout}>Log out</button>
      </div>
    </header>
  );
}
