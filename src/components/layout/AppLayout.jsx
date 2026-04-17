import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Container from './Container';
import Navbar from './Navbar';

export default function AppLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="hb-app-shell bg-[var(--color-bg)]">
      <Navbar onLogout={logout} />
      <Container className="hb-app-main flex flex-1 flex-col pb-6 pt-[calc(var(--hb-navbar-height)+var(--space-6))]">
        <div className="hb-page-intro mb-6 shrink-0 hb-fade-in">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Welcome, {user?.name || 'there'}
          </h1>
          <p className="mt-2 text-sm hb-muted">
            Track your job applications, follow-ups, and progress from one place.
          </p>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
      </Container>
    </div>
  );
}
