import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, FileQuestion, ClipboardList, Code2, PlusCircle,
  Trophy, BookOpen, Clock, Calendar, CheckCircle2, UserCheck, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import StatsCard from '../../components/common/StatsCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import adminService from '../../services/adminService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalStudents: 0,
      totalTests: 0,
      totalQuestions: 0,
      totalCodingProblems: 0,
      recentRegistrations: 0,
      testsTakenToday: 0
    },
    recentStudents: [],
    recentSubmissions: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminService.getDashboardStats();
        setData(res.data);
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err.message);
        toast.error('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader />;

  const stats = data.stats || {};
  const recentStudents = data.recentStudents || [];
  const recentSubmissions = data.recentSubmissions || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white font-black">Admin Dashboard</h1>

        </div>

        {/* Quick action controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => navigate('/admin/tests/create')}
            className="font-bold text-xs"
          >
            Create Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={PlusCircle}
            onClick={() => navigate('/admin/questions/add')}
            className="font-bold text-xs"
          >
            Add MCQ
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={PlusCircle}
            onClick={() => navigate('/admin/coding/add')}
            className="font-bold text-xs"
          >
            Add Code challenge
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="cursor-pointer" onClick={() => navigate('/admin/students')}>
          <StatsCard title="Total Registered Students" value={stats.totalStudents} icon={Users} color="indigo" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/admin/tests')}>
          <StatsCard title="Active Placement Tests" value={stats.totalTests} icon={ClipboardList} color="blue" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/admin/questions')}>
          <StatsCard title="MCQ Questions Pool" value={stats.totalQuestions} icon={FileQuestion} color="purple" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/admin/coding')}>
          <StatsCard title="Coding Problems" value={stats.totalCodingProblems} icon={Code2} color="emerald" />
        </div>
      </div>

      {/* Today Activity cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="flex items-center gap-4 border-slate-100 dark:border-slate-800/80 cursor-pointer" hover={true} onClick={() => navigate('/admin/students')}>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Students (Last 7 Days)</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mt-1">+{stats.recentRegistrations} Registered</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-slate-100 dark:border-slate-800/80 cursor-pointer" hover={true} onClick={() => navigate('/admin/results')}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Submissions Today</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mt-1">{stats.testsTakenToday} Exam Submissions</h3>
          </div>
        </Card>
      </div>

      {/* Grid columns for listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Submissions Feed */}
        <Card hover={false} className="flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white">Recent Student Submissions</h3>
            <Link to="/admin/results" className="text-xs font-bold text-indigo-500 hover:text-indigo-600">
              View All Submissions
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((sub) => (
                <div
                  key={sub._id}
                  className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {sub.user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{sub.user?.name || 'Deleted student'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sub.test?.name || 'Deleted Exam'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={sub.passed ? 'success' : 'danger'} size="sm">
                      {sub.passed ? 'Passed' : 'Failed'}
                    </Badge>
                    <p className="text-[10px] text-slate-400 mt-1">Score: {Math.round(sub.percentage)}%</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                No exam submissions logged yet.
              </div>
            )}
          </div>
        </Card>

        {/* Newly Registered Students */}
        <Card hover={false} className="flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white">Newly Registered Students</h3>
            <Link to="/admin/students" className="text-xs font-bold text-indigo-500 hover:text-indigo-600">
              Manage All Students
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {recentStudents.length > 0 ? (
              recentStudents.map((stud) => (
                <div
                  key={stud._id}
                  className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {stud.name?.charAt(0)?.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{stud.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{stud.email}</p>
                    </div>
                  </div>

                  <div className="text-right font-medium text-[10px] text-slate-400">
                    <p className="font-bold text-slate-600 dark:text-slate-300">{stud.branch || 'CSE'}</p>
                    <p className="mt-0.5">{stud.year || '4th Year'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                No students registered yet.
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default AdminDashboard;

