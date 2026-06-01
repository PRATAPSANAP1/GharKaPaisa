import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Trophy, CheckCircle2, AlertCircle, Eye, Calendar, Award, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import resultService from '../../services/resultService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import TableSkeleton from '../../components/skeletons/TableSkeleton';

const Results = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [stats, setStats] = useState({ totalTaken: 0, averageScore: 0, highestScore: 0 });
  const [categoryType, setCategoryType] = useState('');

  useEffect(() => {
    const fetchResultsHistory = async () => {
      try {
        setLoading(true);
        const params = {
          page: pagination.page,
          limit: 10,
        };

        const res = await resultService.getMyResults(params);
        let list = res.data.results || [];

        if (categoryType) {
          list = list.filter(r => r.test?.category?.type === categoryType);
        }

        setResults(list);
        setPagination({
          page: res.data.pagination.page,
          totalPages: res.data.pagination.pages
        });

        const allRes = await resultService.getMyResults({ limit: 100 });
        const allList = allRes.data.results || [];

        let sumPct = 0;
        let highPct = 0;
        allList.forEach(r => {
          sumPct += r.percentage || 0;
          if ((r.percentage || 0) > highPct) {
            highPct = r.percentage;
          }
        });

        setStats({
          totalTaken: allList.length,
          averageScore: allList.length > 0 ? Math.round(sumPct / allList.length) : 0,
          highestScore: Math.round(highPct),
        });

      } catch (err) {
        console.error('Error fetching results history:', err.message);
        toast.error('Failed to load attempt history');
      } finally {
        setLoading(false);
      }
    };
    fetchResultsHistory();
  }, [pagination.page, categoryType]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Your Examination Reports</h1>
      </div>

      {/* Stats Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card hover={false} className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Attempts</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{stats.totalTaken} Tests</h3>
          </div>
        </Card>

        <Card hover={false} className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Average Percentage</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{stats.averageScore}%</h3>
          </div>
        </Card>

        <Card hover={false} className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Personal Best Score</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{stats.highestScore}%</h3>
          </div>
        </Card>
      </div>

      {/* Filter Options */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4" hover={false}>
        <div className="text-sm font-bold text-slate-800 dark:text-white">
          Filter Attempts
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            placeholder="All Categories"
            value={categoryType}
            options={[
              { label: 'Aptitude Tests', value: 'aptitude' },
              { label: 'Technical Tests', value: 'technical' }
            ]}
            onChange={(e) => setCategoryType(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      {/* Main List */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Exam Reports"
          description="You have not completed any placement preparation tests yet. Browse tests and start practicing!"
          action={{
            text: 'Find Tests',
            onClick: () => navigate('/student/tests')
          }}
        />
      ) : (
        <div className="w-full flex flex-col gap-4">
          <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                  <th className="px-6 py-4">Test Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Percentage</th>
                  <th className="px-6 py-4">Result</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-200">
                {results.map((row) => (
                  <tr
                    key={row._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <p className="text-slate-800 dark:text-white text-sm font-bold truncate max-w-[200px]">{row.test?.name || 'Deleted Test'}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                      {row.test?.category?.name || 'MCQ Exam'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {row.obtainedMarks} / {row.totalMarks}
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-white">
                      {Math.round(row.percentage)}%
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={row.passed ? 'success' : 'danger'} size="sm">
                        {row.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(row.submittedAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        className="py-1.5 px-3 font-bold text-xs"
                        onClick={() => navigate(`/student/tests/${row.test?._id}/result`)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* simple pagination footer */}
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
    </div>
  );
};

export default Results;

