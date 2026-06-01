export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const DIFFICULTY_COLORS = {
  easy: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
  },
  medium: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-600',
  },
  hard: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    gradient: 'from-red-500 to-rose-600',
  },
};

export const LANGUAGES = [
  { id: 63, name: 'JavaScript', value: 'javascript', monacoLang: 'javascript' },
  { id: 71, name: 'Python', value: 'python', monacoLang: 'python' },
  { id: 62, name: 'Java', value: 'java', monacoLang: 'java' },
  { id: 54, name: 'C++', value: 'cpp', monacoLang: 'cpp' },
  { id: 50, name: 'C', value: 'c', monacoLang: 'c' },
];

export const CATEGORIES = {
  aptitude: [
    { id: 'quantitative', name: 'Quantitative Aptitude', icon: 'Calculator' },
    { id: 'logical', name: 'Logical Reasoning', icon: 'Brain' },
    { id: 'verbal', name: 'Verbal Ability', icon: 'BookOpen' },
    { id: 'data-interpretation', name: 'Data Interpretation', icon: 'BarChart3' },
  ],
  technical: [
    { id: 'dsa', name: 'Data Structures & Algorithms', icon: 'GitBranch' },
    { id: 'os', name: 'Operating Systems', icon: 'Monitor' },
    { id: 'dbms', name: 'Database Management', icon: 'Database' },
    { id: 'cn', name: 'Computer Networks', icon: 'Network' },
    { id: 'oops', name: 'Object Oriented Programming', icon: 'Boxes' },
    { id: 'web', name: 'Web Technologies', icon: 'Globe' },
    { id: 'se', name: 'Software Engineering', icon: 'Settings' },
    { id: 'ml', name: 'Machine Learning', icon: 'Cpu' },
  ],
};

export const SUBMISSION_STATUS = {
  ACCEPTED: { label: 'Accepted', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  WRONG_ANSWER: { label: 'Wrong Answer', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  TIME_LIMIT: { label: 'Time Limit Exceeded', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  RUNTIME_ERROR: { label: 'Runtime Error', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  COMPILATION_ERROR: { label: 'Compilation Error', color: 'text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  PENDING: { label: 'Pending', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
};

export const NAV_LINKS = {
  student: [
    { path: '/student/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/student/aptitude-tests', label: 'Aptitude Tests', icon: 'Brain' },
    { path: '/student/technical-tests', label: 'Technical Tests', icon: 'Code2' },
    { path: '/student/coding', label: 'Coding Practice', icon: 'Terminal' },
    { path: '/student/interview', label: 'AI Interview', icon: 'Mic' },
    { path: '/student/leaderboard', label: 'Leaderboard', icon: 'Trophy' },
    { path: '/student/results', label: 'My Results', icon: 'ClipboardCheck' },
    { path: '/student/profile', label: 'Profile', icon: 'User' },
  ],
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/admin/students', label: 'Manage Students', icon: 'Users' },
    { path: '/admin/questions', label: 'Manage Questions', icon: 'FileQuestion' },
    { path: '/admin/tests', label: 'Manage Tests', icon: 'ClipboardList' },
    { path: '/admin/coding-problems', label: 'Coding Problems', icon: 'Terminal' },
    { path: '/admin/categories', label: 'Categories', icon: 'FolderTree' },
    { path: '/admin/results', label: 'Results', icon: 'BarChart3' },
    { path: '/admin/analytics', label: 'Analytics', icon: 'TrendingUp' },
  ],
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100],
};

export const INTERVIEW_TYPES = [
  { id: 'technical', name: 'Technical Interview', icon: 'Code2', description: 'DSA, System Design, OOP concepts' },
  { id: 'hr', name: 'HR Interview', icon: 'Users', description: 'Behavioral, situational questions' },
  { id: 'aptitude', name: 'Aptitude Round', icon: 'Brain', description: 'Logical reasoning, quantitative' },
];

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

