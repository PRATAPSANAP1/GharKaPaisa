import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  LayoutDashboard, Users, Code2, FolderTree, BarChart3, Trophy, 
  LogOut, Menu, X, ChevronDown, ChevronRight, Moon, Sun, Bell, Settings,
  Brain, Calculator, AlignLeft, Shapes, Terminal, BookOpen, Mic
} from 'lucide-react';

const navStructure = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, single: true },
  { label: 'Students', path: '/admin/students', icon: Users, single: true },
  {
    label: 'Aptitude',
    path: '/admin/aptitude',
    icon: Brain,
    single: true,
  },
  {
    label: 'Technical',
    icon: Terminal,
    color: 'text-indigo-500',
    children: [
      { label: 'MCQ Tests', path: '/admin/technical/mcq', icon: BookOpen },
      { label: 'Interview', path: '/admin/interview', icon: Mic },
      { label: 'Coding', path: '/admin/coding', icon: Code2 },
    ],
  },
  { label: 'Categories', path: '/admin/categories', icon: FolderTree, single: true },
  { label: 'Results', path: '/admin/results', icon: Trophy, single: true },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3, single: true },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({ Aptitude: true, Technical: true });
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleGroup = (label) => setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  const isGroupActive = (children) => children.some((c) => window.location.pathname.startsWith(c.path));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100 dark:border-slate-800">
          <img src="/logo.jpg" alt="OIT_STACK Logo" className="w-8 h-8 object-contain rounded-lg bg-white border border-slate-100 dark:border-slate-800 shadow-sm" />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 dark:text-white text-sm truncate">OIT_STACK</h1>
            <p className="text-[10px] text-gray-400 font-medium truncate">Admin Portal</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navStructure.map((item) => {
            if (item.single) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </NavLink>
              );
            }

            const groupActive = isGroupActive(item.children);
            const isOpen = openGroups[item.label];

            return (
              <div key={item.label} className="mt-1">
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    groupActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${groupActive ? item.color : ''}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="ml-5 pl-4 border-l border-gray-200 dark:border-slate-800 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                          }`
                        }
                      >
                        <child.icon className="w-4 h-4 shrink-0" />
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || 'admin@oitstack.com'}</p>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" title="Logout">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex lg:hidden items-center gap-2">
            <img src="/logo.jpg" alt="OIT_STACK Logo" className="w-7 h-7 object-contain rounded-lg bg-white border border-slate-100 dark:border-slate-800 shadow-sm" />
            <span className="font-bold text-gray-900 dark:text-white text-sm">OIT_STACK</span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            <button onClick={toggleDark} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-500" />}
            </button>
            <button onClick={() => toast('No new notifications', { icon: '🔔' })} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative">
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <button onClick={() => toast('Admin settings coming soon', { icon: '⚙️' })} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

