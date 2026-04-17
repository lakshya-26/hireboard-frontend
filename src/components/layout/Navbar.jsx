import { Link } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar({ onLogout }) {
  const { user, logout } = useAuth();
  const handleLogout = onLogout ?? logout;

  return (
    <header className="hb-navbar">
      <div className="hb-container hb-navbar-inner">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="hb-brand min-w-0" aria-label="HireBoard home">
            <BrandLogo className="h-8 w-auto max-w-[96px] shrink-0 sm:h-9 sm:max-w-[104px]" alt="" />
            <span className="hb-brand-meta min-w-0">
              <span className="truncate">HireBoard</span>
              <span className="hb-brand-tagline hidden sm:block">Pipeline workspace</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className="hb-nav-link">
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/dashboard"
            className="hb-icon-btn"
            aria-label="Notifications"
            title="Application updates appear here soon"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Z"
                fill="currentColor"
                opacity="0.9"
              />
              <path
                d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-gray-200">
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-gray-500 truncate max-w-[160px]">{user?.email}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-indigo-200 hover:text-gray-900"
            >
              Log out
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="sm:hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm"
          >
            Out
          </button>
        </div>
      </div>
    </header>
  );
}
