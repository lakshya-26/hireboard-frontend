import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Container from './Container';
import Navbar from './Navbar';

export default function AppLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar onLogout={logout} />
      <Container className="py-8">
        <div className="hb-page-intro mb-7 hb-fade-in">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Welcome, {user?.name || 'there'}
          </h1>
          <p className="mt-1 text-sm hb-muted">
            Track your job applications, follow-ups, and progress from one place.
          </p>
        </div>
        <Outlet />
      </Container>
    </div>
  );
}
