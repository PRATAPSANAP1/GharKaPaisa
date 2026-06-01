import React, { useEffect, useState } from 'react';
import { Users, Search, AlertCircle, Eye, Trash2, Calendar, Award, Trophy, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import TableSkeleton from '../../components/skeletons/TableSkeleton';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsStudent, setStatsStudent] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStudentsList = async () => {
    try {
      setLoading(true);
      const res = await adminService.getStudents({
        search,
        page: pagination.page,
        limit: 10
      });
      setStudents(res.data.users || []);
      setPagination({
        page: res.data.pagination.page,
        totalPages: res.data.pagination.pages
      });
    } catch (err) {
      console.error('Error fetching students:', err.message);
      toast.error('Failed to load students list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsList();
  }, [search, pagination.page]);

  const handleDeleteTrigger = (id) => {
    setTargetStudentId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await adminService.deleteStudent(targetStudentId);
      toast.success('Student account deleted successfully.');
      setDeleteOpen(false);
      fetchStudentsList();
    } catch (err) {
      console.error('Error deleting student:', err.message);
      toast.error('Failed to delete student account.');
    }
  };

  const handleViewStats = async (student) => {
    setStatsStudent(student);
    setStatsOpen(true);
    setLoadingStats(true);
    setStudentStats(null);
    try {
      const res = await adminService.getUserStats(student._id);
      setStudentStats(res.data);
    } catch (err) {
      console.error('Error loading user stats:', err.message);
      toast.error('Failed to retrieve performance metrics.');
      setStatsOpen(false);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Student Management</h1>
      </div>

      {/* Filter Row */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4" hover={false}>
        <SearchInput
          placeholder="Search by student name or email..."
          value={search}
          onChange={setSearch}
        />
        <div className="text-xs font-bold text-slate-400 uppercase">
          Total Students: {students.length} listed
        </div>
      </Card>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Students Found"
          description="There are no registered student accounts matching your keywords."
        />
      ) : (
        <div className="w-full flex flex-col gap-4">
          <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4">College</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-200">
                {students.map((row) => (
                  <tr
                    key={row._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500">
                          {row.name?.charAt(0)?.toUpperCase()}
                        </span>
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                      {row.email}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {row.branch || '--'}
                    </td>
                    <td className="px-6 py-4">
                      {row.year || '--'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                      {row.college || 'OIT_STACK'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleViewStats(row)}
                          className="py-1.5 px-3 font-bold text-xs"
                          title="View Statistics"
                        >
                          Stats
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteTrigger(row._id)}
                          className="py-1.5 px-2 text-xs"
                          title="Delete Account"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simple pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-end gap-2 pr-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="text-xs py-1.5 px-3"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="text-xs py-1.5 px-3"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Student Account"
        message="Are you absolutely sure you want to permanently delete this student account? This operation is irreversible and will remove all leaderboard profiles."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Student stats popup modal */}
      <Modal
        isOpen={statsOpen}
        onClose={() => setStatsOpen(false)}
        title={`Placement Metrics - ${statsStudent?.name || ''}`}
        size="lg"
      >
        {loadingStats ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : studentStats ? (
          <div className="flex flex-col gap-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tests Attempted</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{studentStats.testsCompleted} Tests</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Average Percentage</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{studentStats.averagePercentage}%</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Coding Solved</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{studentStats.codingProblemsSolved} Problems</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Global Standing</span>
                <span className="text-xl font-black text-indigo-500">
                  {studentStats.rank && studentStats.rank !== 'Unranked' && studentStats.rank > 0
                    ? `#${studentStats.rank} Rank`
                    : 'Unranked'}
                </span>
              </div>
            </div>

            {/* Status list details */}
            <div className="flex flex-col gap-3.5 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-bold text-slate-500 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Passed Tests Count</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{studentStats.passedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> Member Registration</span>
                <span className="text-slate-800 dark:text-white font-extrabold">
                  {statsStudent?.createdAt ? new Date(statsStudent.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="secondary" onClick={() => setStatsOpen(false)}>
                Close Window
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            Error loading performance data.
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageStudents;

