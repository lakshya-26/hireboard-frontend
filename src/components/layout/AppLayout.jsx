import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo';
import AppSidebar, { MobileMenuButton } from './AppSidebar';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="hb-app-shell flex min-h-[100dvh] bg-slate-100">
      <AppSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md lg:hidden">
          <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo className="h-7 w-auto max-w-[80px] shrink-0" alt="" />
            <span className="truncate text-base font-bold text-slate-900">HireBoard</span>
          </div>
        </header>

        <main className="hb-app-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div
            className={`mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 ${
              isDashboard ? '' : 'pb-10'
            }`}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
