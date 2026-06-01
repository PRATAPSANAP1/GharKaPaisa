import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Flame, CheckCircle, ChevronRight, AlertCircle, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import codingService from '../../services/codingService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import TableSkeleton from '../../components/skeletons/TableSkeleton';

const CodingProblems = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [stats, setStats] = useState({ total: 0, solved: 0, easy: 0, medium: 0, hard: 0 });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const params = {};
        if (difficulty) {
          params.difficulty = difficulty;
        }

        const res = await codingService.getProblems(params);
        let list = res.data.problems || [];

        if (search) {
          list = list.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
        }

        setProblems(list);

        const allRes = await codingService.getProblems({ limit: 100 });
        const allProblems = allRes.data.problems || [];
        const solved = allProblems.filter(p => p.isSolved).length;
        const easy = allProblems.filter(p => p.difficulty === 'easy' && p.isSolved).length;
        const medium = allProblems.filter(p => p.difficulty === 'medium' && p.isSolved).length;
        const hard = allProblems.filter(p => p.difficulty === 'hard' && p.isSolved).length;

        setStats({
          total: allProblems.length,
          solved,
          easy,
          medium,
          hard,
        });

      } catch (err) {
        console.error('Error fetching coding problems:', err.message);
        toast.error('Failed to load coding problems');
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, [difficulty, search]);

  const getDifficultyVariant = (diff) => {
    switch (diff) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Coding Problems</h1>
      </div>

      {/* Stats Bar */}
      <Card hover={false} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Progress</p>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
              {stats.solved} / {stats.total} Solved
            </h2>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.total > 0 ? (stats.solved / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Easy Completed</span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{stats.easy} Solved</span>
          </div>

          <div className="flex flex-col gap-1 p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Medium Completed</span>
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{stats.medium} Solved</span>
          </div>

          <div className="flex flex-col gap-1 p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Hard Completed</span>
            <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{stats.hard} Solved</span>
          </div>
        </div>
      </Card>

      {/* Filters Card */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4" hover={false}>
        <SearchInput
          placeholder="Search by problem title..."
          value={search}
          onChange={setSearch}
        />
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select
            placeholder="All Difficulties"
            value={difficulty}
            options={[
              { label: 'Easy', value: 'easy' },
              { label: 'Medium', value: 'medium' },
              { label: 'Hard', value: 'hard' }
            ]}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      {/* Listing Grid */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : problems.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Problems Found"
          description="There are no coding challenges matching your search keywords or parameters."
          action={{
            text: 'Clear Filters',
            onClick: () => {
              setSearch('');
              setDifficulty('');
            }
          }}
        />
      ) : (
        <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">Leaderboard Points</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-200">
              {problems.map((problem) => (
                <tr
                  key={problem._id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200"
                >
                  <td className="px-6 py-4">
                    {problem.isSolved ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <span className="w-5 h-5 block rounded-full border-2 border-slate-200 dark:border-slate-800" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-800 dark:text-white text-sm font-bold">{problem.title}</p>
                      <div className="flex gap-2 text-[10px] text-slate-400 font-medium mt-0.5">
                        {problem.tags && problem.tags.slice(0, 3).map((tag, tIdx) => (
                          <span key={tIdx} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getDifficultyVariant(problem.difficulty)} size="sm">
                      {problem.difficulty}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 mt-0.5">
                    <Award className="w-4 h-4" /> {problem.points || 100} pts
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-bold flex items-center gap-1 group"
                      onClick={() => navigate(`/student/coding/${problem._id}`)}
                    >
                      Solve Problem <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CodingProblems;

