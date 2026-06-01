import React, { useEffect, useState } from 'react';
import { Trophy, Search, AlertCircle, Eye, Calendar, Clock, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import TableSkeleton from '../../components/skeletons/TableSkeleton';

const ViewResults = () => {
  const [results, setResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [passed, setPassed] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchResultsList = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 10,
        search
      };
      if (selectedTest) params.testId = selectedTest;
      if (passed) params.passed = passed;

      const res = await adminService.getResults(params);
      setResults(res.data.results || []);
      setPagination({
        page: res.data.pagination.page,
        totalPages: res.data.pagination.pages
      });
    } catch (err) {
      console.error('Error fetching results:', err.message);
      toast.error('Failed to load exam results log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTests = async () => {
      try {
        const res = await adminService.getTests();
        const opts = res.data.map(t => ({ label: t.name, value: t._id }));
        setTests(opts);
      } catch (err) {
        console.error('Error loading tests:', err);
      }
    };
    loadTests();
  }, []);

  useEffect(() => {
    fetchResultsList();
  }, [selectedTest, passed, search, pagination.page]);

  const handleViewDetail = async (id) => {
    setDetailId(id);
    setDetailOpen(true);
    setLoadingDetail(true);
    setDetailData(null);
    try {
      const res = await adminService.getResultDetail(id);
      setDetailData(res.data);
    } catch (err) {
      console.error('Error loading result detail:', err.message);
      toast.error('Failed to load result script details.');
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatMinutes = (secs) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins}m ${rs}s`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Exam Results Log</h1>
      </div>

      {/* Filters Card */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4" hover={false}>
        <SearchInput
          placeholder="Search by candidate name..."
          value={search}
          onChange={setSearch}
        />
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            placeholder="All Exam Tests"
            value={selectedTest}
            options={tests}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="w-48"
          />
          <Select
            placeholder="All Results"
            value={passed}
            options={[
              { label: 'Passed Only', value: 'true' },
              { label: 'Failed Only', value: 'false' }
            ]}
            onChange={(e) => setPassed(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Results Found"
          description="There are no student results matching your search query or chosen filters."
        />
      ) : (
        <div className="w-full flex flex-col gap-4">
          <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Test Name</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Percentage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Attempt Date</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-200">
                {results.map((row) => (
                  <tr
                    key={row._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-slate-800 dark:text-white text-sm font-bold">{row.user?.name || 'Deleted student'}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{row.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 dark:text-white text-sm font-bold truncate max-w-[200px]">{row.test?.name || 'Deleted Test'}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                      {row.obtainedMarks} / {row.totalMarks}
                    </td>
                    <td className="px-6 py-4 text-center">
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
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        className="py-1.5 px-3 font-bold text-xs"
                        onClick={() => handleViewDetail(row._id)}
                      >
                        Review
                      </Button>
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

      {/* Answer key sheet detail modal */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Student Exam Attempt Details"
        size="lg"
      >
        {loadingDetail ? (
          <div className="h-64 flex items-center justify-center">
            <Loader />
          </div>
        ) : detailData ? (
          <div className="flex flex-col gap-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Scorecard banner */}
            <div className={`p-5 rounded-2xl text-white ${detailData.passed ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-sm uppercase">Exam status: {detailData.passed ? 'Passed' : 'Failed'}</h4>
                  <p className="text-xs text-white/80 mt-1">Duration: {formatMinutes(detailData.timeTaken)}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black">{Math.round(detailData.percentage)}%</span>
                  <p className="text-[9px] uppercase font-bold text-white/80 mt-0.5">Grade score</p>
                </div>
              </div>
            </div>

            {/* Answer reviewer */}
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Answer Script Review</h4>
              {detailData.answers && detailData.answers.map((ans, idx) => {
                const q = ans.question || {};
                const isUnanswered = ans.selectedAnswer === null || ans.selectedAnswer === undefined;
                const isCorrect = ans.isCorrect;

                return (
                  <div
                    key={ans._id || idx}
                    className={`p-4 border rounded-2xl flex flex-col gap-3 ${
                      isUnanswered
                        ? 'border-slate-100 dark:border-slate-800'
                        : isCorrect
                        ? 'border-emerald-200 bg-emerald-500/[0.02]'
                        : 'border-rose-200 bg-rose-500/[0.02]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400">Q{idx + 1} | Difficulty: {q.difficulty}</span>
                      <Badge variant={isUnanswered ? 'gray' : isCorrect ? 'success' : 'danger'} size="sm">
                        {isUnanswered ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed">{q.question}</p>

                    <div className="flex flex-col gap-2 mt-1">
                      {q.options && q.options.map((opt, optIdx) => {
                        const isSelected = ans.selectedAnswer === optIdx;
                        const isCorrectKey = q.correctAnswer === optIdx;

                        let borderStyle = 'border-slate-100 dark:border-slate-800';
                        if (isSelected) {
                          borderStyle = isCorrect ? 'border-emerald-500 text-emerald-600' : 'border-rose-500 text-rose-600';
                        }
                        if (isCorrectKey && !isCorrect) {
                          borderStyle = 'border-emerald-500/60 bg-emerald-500/5 text-emerald-600';
                        }

                        return (
                          <div key={optIdx} className={`p-2.5 rounded-xl border text-[11px] font-semibold flex justify-between ${borderStyle}`}>
                            <span>{opt}</span>
                            {isCorrectKey && <span className="text-[9px] font-extrabold uppercase text-emerald-500">Correct key</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="secondary" onClick={() => setDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            Error loading attempt details.
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewResults;

