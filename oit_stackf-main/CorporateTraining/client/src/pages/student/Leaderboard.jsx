import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Trophy, Search, Award, CheckCircle2, Code2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import leaderboardService from '../../services/leaderboardService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import SearchInput from '../../components/common/SearchInput';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const Leaderboard = () => {
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const res = await leaderboardService.getLeaderboard({
          search,
          page: pagination.page,
          limit: 15,
        });

        setBoard((res.data.leaderboard || []).filter(item => item.user?.email !== 'admin@oitstack.com'));
        setMyRank(res.data.myRank);
        setPagination({
          page: res.data.pagination.page,
          totalPages: res.data.pagination.pages,
        });
      } catch (err) {
        console.error('Error fetching rankings:', err.message);
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [search, pagination.page]);

  if (loading && pagination.page === 1) return <Loader />;

  const podiumList = pagination.page === 1 ? board.slice(0, 3) : [];
  const listRows = pagination.page === 1 ? board.slice(3) : board;

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-amber-400 text-white';
    if (rank === 2) return 'bg-slate-300 text-slate-700';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
  };

  const getPodiumOrder = (podium) => {
    const order = [];
    if (podium[1]) order.push(podium[1]); // 2nd
    if (podium[0]) order.push(podium[0]); // 1st
    if (podium[2]) order.push(podium[2]); // 3rd
    return order;
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Global Placement Leaderboard</h1>
      </div>

      {/* Top 3 Podium (Visual) */}
      {podiumList.length > 0 && !search && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-4 mb-4">
          {getPodiumOrder(podiumList).map((entry) => {
            const rank = entry.rank;
            const isMe = entry.user?._id === user?._id;

            let height = 'h-52';
            let border = 'border-slate-100 dark:border-slate-800/80';
            let trophyColor = 'text-slate-400';

            if (rank === 1) {
              height = 'h-64';
              border = 'border-amber-400 dark:border-amber-500/50 shadow-amber-500/5';
              trophyColor = 'text-amber-400 animate-bounce';
            } else if (rank === 2) {
              height = 'h-56';
              border = 'border-slate-300 dark:border-slate-700/50';
              trophyColor = 'text-slate-300';
            } else if (rank === 3) {
              height = 'h-52';
              border = 'border-amber-600 dark:border-amber-700/50';
              trophyColor = 'text-amber-600';
            }

            return (
              <Card
                key={entry._id}
                className={`flex flex-col items-center justify-center p-6 text-center border-2 ${height} ${border} ${
                  isMe ? 'ring-2 ring-blue-500/35 bg-blue-50/10 dark:bg-slate-900' : ''
                }`}
                hover={false}
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-800 dark:text-white border-2 border-white dark:border-slate-900 shadow-md">
                    {entry.user?.name?.slice(0, 2)?.toUpperCase() || 'ST'}
                  </div>
                  <span className={`absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ${getRankBadgeColor(rank)}`}>
                    #{rank}
                  </span>
                </div>

                <div className="mt-3.5 flex flex-col items-center">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white line-clamp-1 max-w-[150px]">
                    {entry.user?.name || 'Candidate'}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[130px] font-medium mt-0.5">
                    {entry.user?.college || 'OIT_STACK'}
                  </p>
                </div>

                <div className="mt-4 flex gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> {entry.testsCompleted} tests</span>
                  <span className="flex items-center gap-1"><Code2 className="w-3.5 h-3.5 text-emerald-500" /> {entry.codingProblemsSolved} coding</span>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-800 w-full flex items-center justify-center gap-1 text-sm font-black text-indigo-500 dark:text-indigo-400">
                  <Trophy className={`w-4 h-4 ${trophyColor}`} /> {entry.totalScore} pts
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* List Filters */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4" hover={false}>
        <SearchInput
          placeholder="Search candidates by name..."
          value={search}
          onChange={setSearch}
        />
        {myRank && (
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" /> Your Standing: <strong className="text-slate-800 dark:text-white">Rank #{myRank}</strong>
          </div>
        )}
      </Card>

      {/* Main rankings list */}
      {board.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Standings Yet"
          description="There are no candidates listed on the leaderboard matching this name filter."
        />
      ) : (
        <div className="w-full flex flex-col gap-4">
          <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                  <th className="px-6 py-4 w-20">Rank</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">College & Branch</th>
                  <th className="px-6 py-4 text-center">Tests Attempted</th>
                  <th className="px-6 py-4 text-center">Coding Solved</th>
                  <th className="px-6 py-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-200">
                {listRows.map((entry) => {
                  const isMe = entry.user?._id === user?._id;
                  const rank = entry.rank;

                  return (
                    <tr
                      key={entry._id}
                      className={`transition-colors hover:bg-slate-50/30 dark:hover:bg-slate-800/10 ${
                        isMe ? 'bg-blue-50/10 dark:bg-indigo-950/5 text-blue-600 dark:text-indigo-400 font-bold' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${getRankBadgeColor(rank)}`}>
                          #{rank}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500">
                            {entry.user?.name?.charAt(0)?.toUpperCase()}
                          </span>
                          <span className={isMe ? 'font-extrabold' : ''}>
                            {entry.user?.name || 'Deleted Candidate'} {isMe && '(You)'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {entry.user?.college || 'OIT_STACK'} | {entry.user?.branch || 'General'}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                        {entry.testsCompleted}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                        {entry.codingProblemsSolved}
                      </td>
                      <td className="px-6 py-4 text-right text-indigo-500 dark:text-indigo-400 font-black">
                        {entry.totalScore} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Simple pagination footer */}
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

export default Leaderboard;

