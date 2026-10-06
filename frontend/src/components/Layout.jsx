import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Layout() {
  const { agent, logout } = useAuth();
  return (
    <>
      <header className="topbar">
        <strong className="brand">Helpdesk</strong>
        <nav>
          <NavLink to="/" end>Submit ticket</NavLink>
          <NavLink to="/lookup">Track ticket</NavLink>
          {agent ? (
            <>
              <NavLink to="/board">Board</NavLink>
              <button className="link" onClick={logout}>Logout ({agent.name})</button>
            </>
          ) : (
            <NavLink to="/login">Agent login</NavLink>
          )}
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
