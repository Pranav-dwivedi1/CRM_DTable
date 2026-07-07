import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Workspace Dashboard';
    if (pathname.startsWith('/leads')) return 'Leads Pipeline';
    if (pathname.startsWith('/users')) return 'Team Directory';
    if (pathname.startsWith('/settings')) return 'Company Settings';
    return 'TenantFlow Console';
  };

  return (
    <div className="flex bg-slate-950 min-h-screen">
      {/* Sidebar Panel */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={getPageTitle(location.pathname)} />

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
