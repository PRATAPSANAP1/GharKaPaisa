import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const PartnerLayout = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Partner Portal</h2>
        </div>
        <nav className="p-4 space-y-2">
          <a href="/partner/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Dashboard</a>
          <a href="/partner/products" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Products & Leads</a>
          <a href="/partner/applications" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Applications</a>
          <a href="/partner/wallet" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Wallet</a>
          <a href="/partner/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Profile</a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold md:hidden">Partner Portal</h1>
          <div className="hidden md:block"></div> {/* Spacer */}
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
          >
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PartnerLayout;
