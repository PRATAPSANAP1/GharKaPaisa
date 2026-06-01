import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  LayoutDashboard, Brain, Terminal, Code2, Mic,
  Trophy, ClipboardList, User, LogOut, Menu, X,
  Moon, Sun, Bell, Settings, Search, BookOpen,
  ChevronDown, ChevronRight, Hash, MessageSquare, Zap,
  Calculator, AlignLeft, Shapes
} from 'lucide-react';
import codingService from '../../services/codingService';
import testService from '../../services/testService';

const navStructure = [
  {
    label: 'Dashboard',
    path: '/student/dashboard',
    icon: LayoutDashboard,
    single: true,
  },
  {
    label: 'Aptitude Hub',
    path: '/student/aptitude',
    icon: Brain,
    single: true,
  },
  {
    label: 'Technical',
    icon: Terminal,
    color: 'text-indigo-500',
    children: [
      { label: 'MCQ Tests', path: '/student/technical/mcq', icon: BookOpen },
      { label: 'Interview', path: '/student/interview', icon: Mic },
      { label: 'Coding', path: '/student/coding', icon: Code2 },
    ],
  },
  {
    label: 'Leaderboard',
    path: '/student/leaderboard',
    icon: Trophy,
    single: true,
  },
  {
    label: 'My Results',
    path: '/student/results',
    icon: ClipboardList,
    single: true,
  },
  {
    label: 'Profile',
    path: '/student/profile',
    icon: User,
    single: true,
  },
];

const StudentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [openGroups, setOpenGroups] = useState({ Aptitude: true, Technical: true });
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ coding: [], tests: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults({ coding: [], tests: [] }); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const [codingRes, testsRes] = await Promise.all([
          codingService.getProblems({ limit: 100 }),
          testService.getTests({ limit: 100 }),
        ]);
        const q = searchQuery.toLowerCase();
        setSearchResults({
          coding: (codingRes.data.problems || []).filter(p => p.title.toLowerCase().includes(q)).slice(0, 5),
          tests: (Array.isArray(testsRes.data) ? testsRes.data : []).filter(t => t.name.toLowerCase().includes(q)).slice(0, 5),
        });
      } catch { } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const toggleGroup = (label) => setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  // Check if any child of a group is active
  const isGroupActive = (children) => children.some(c => location.pathname.startsWith(c.path));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0a0f1e] overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 dark:bg-[#0d1117] border-r border-slate-800/60 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-none">OIT_STACK</h1>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Student Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-0.5">
          {navStructure.map((item) => {
            if (item.single) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      {item.label}
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    </>
                  )}
                </NavLink>
              );
            }

            // Group with children
            const groupActive = isGroupActive(item.children);
            const isOpen = openGroups[item.label];

            return (
              <div key={item.label}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    groupActive ? 'text-slate-200' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${groupActive ? item.color : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {groupActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1" />}
                  {isOpen
                    ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                </button>

                {/* Children */}
                {isOpen && (
                  <div className="ml-3 pl-3 border-l border-slate-700/50 mt-0.5 space-y-0.5">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group ${
                            isActive
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                              : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <child.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                            {child.label}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Streak badge */}
        {(user?.streak?.currentStreak > 0) && (
          <div className="mx-3 mb-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <div>
              <p className="text-xs font-bold text-amber-400">{user.streak.currentStreak} Day Streak</p>
              <p className="text-[10px] text-slate-500">Keep it up!</p>
            </div>
          </div>
        )}

        {/* User card */}
        <div className="p-3 border-t border-slate-800/60">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Student'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors" title="Logout">
              <LogOut className="w-4 h-4 text-slate-500 hover:text-rose-400 transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div ref={searchRef} className="hidden sm:block relative w-56 md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input type="text" placeholder="Search problems or tests..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
              />
              {showSearchDropdown && searchQuery.trim() && (
                <div className="absolute top-11 left-0 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto p-2">
                  {searching ? (
                    <p className="p-3 text-center text-xs text-slate-400">Searching...</p>
                  ) : searchResults.coding.length === 0 && searchResults.tests.length === 0 ? (
                    <p className="p-3 text-center text-xs text-slate-400">No results found</p>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.coding.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">Coding Problems</p>
                          {searchResults.coding.map(p => (
                            <button key={p._id} onClick={() => { navigate(`/student/coding/${p._id}`); setShowSearchDropdown(false); setSearchQuery(''); }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <Code2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{p.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.tests.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">Tests</p>
                          {searchResults.tests.map(t => (
                            <button key={t._id} onClick={() => { navigate(`/student/tests/${t._id}`); setShowSearchDropdown(false); setSearchQuery(''); }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="truncate">{t.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={toggleDark} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>
            <button onClick={() => toast('No new notifications', { icon: '🔔' })} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
              <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>
            <button onClick={() => navigate('/student/profile')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
            <div className="ml-1 pl-3 border-l border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20">
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
