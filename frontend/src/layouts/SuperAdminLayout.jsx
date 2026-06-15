import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const SuperAdminLayout = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-indigo-900 text-white hidden md:block">
        <div className="p-4 border-b border-indigo-800">
          <h2 className="text-xl font-bold">SuperAdmin Portal</h2>
        </div>
        <nav className="p-4 space-y-2">
          <a href="/superadmin/dashboard" className="block px-4 py-2 text-indigo-200 hover:bg-indigo-800 hover:text-white rounded">Dashboard</a>
          <a href="/superadmin/reports" className="block px-4 py-2 text-indigo-200 hover:bg-indigo-800 hover:text-white rounded">Reports</a>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
          <h1 className="text-lg font-semibold md:hidden text-gray-800">SuperAdmin Portal</h1>
          <div className="hidden md:block"></div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
          >
            Logout
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
