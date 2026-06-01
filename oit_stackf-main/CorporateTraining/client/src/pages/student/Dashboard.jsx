import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Brain, Terminal, Code2, Mic, Award,
  Trophy, BookOpen, Clock, Calendar, ChevronRight, CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import StatsCard from '../../components/common/StatsCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ProgressChart from '../../components/charts/ProgressChart';
import CategoryChart from '../../components/charts/CategoryChart';
import resultService from '../../services/resultService';
import codingService from '../../services/codingService';
import leaderboardService from '../../services/leaderboardService';
import testService from '../../services/testService';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    testsCompleted: 0,
    averagePercentage: 0,
    problemsSolved: 0,
    streak: 0,
  });
  const [recentResults, setRecentResults] = useState([]);
  const [problemsProgress, setProblemsProgress] = useState([]);
  const [myRank, setMyRank] = useState('--');
  const [tests, setTests] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const resultsRes = await resultService.getMyResults({ limit: 5 });
        const results = resultsRes.data.results || [];
        setRecentResults(results);

        const allResultsRes = await resultService.getMyResults({ limit: 100 });
        const allResults = allResultsRes.data.results || [];

        let sumPct = 0;
        allResults.forEach(r => { sumPct += r.percentage || 0; });
        const avgPct = allResults.length > 0 ? Math.round(sumPct / allResults.length) : 0;

        const problemsRes = await codingService.getProblems({ limit: 100 });
        const problems = problemsRes.data.problems || [];
        const solvedCount = problems.filter(p => p.isSolved).length;

        const leaderboardRes = await leaderboardService.getLeaderboard({ limit: 1 });
        const rank = leaderboardRes.data.myRank || '--';
        setMyRank(rank);

        const testsRes = await testService.getTests({ limit: 3 });
        setTests(Array.isArray(testsRes.data) ? testsRes.data.slice(0, 3) : []);

        setStats({
          testsCompleted: allResults.length,
          averagePercentage: avgPct,
          problemsSolved: solvedCount,
          streak: user?.streak?.currentStreak || 0,
        });

      } catch (err) {
        console.error('Dashboard load error:', err.message);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) return <Loader />;

  const lineChartData = recentResults
    .slice()
    .reverse()
    .map(r => ({
      date: new Date(r.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: r.percentage,
    }));

  const categoryChartData = [
    { name: 'Aptitude Tests', count: stats.testsCompleted },
    { name: 'Coding Problems', count: stats.problemsSolved },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Tests Completed"
          value={stats.testsCompleted}
          icon={CheckCircle}
          color="blue"
        />
        <StatsCard
          title="Average Score"
          value={`${stats.averagePercentage}%`}
          icon={Award}
          color="indigo"
        />
        <StatsCard
          title="Coding Solved"
          value={stats.problemsSolved}
          icon={Code2}
          color="emerald"
        />
        <StatsCard
          title="Global Ranking"
          value={myRank !== '--' ? `#${myRank}` : '--'}
          icon={Trophy}
          color="purple"
        />
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Quick Preparation Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card
            className="flex flex-col justify-between hover:border-blue-500/40 cursor-pointer"
            onClick={() => navigate('/student/tests?category=aptitude')}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Aptitude Tests</h3>
              <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 p-0 font-bold group">
                Attempt Tests <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Card>

          <Card
            className="flex flex-col justify-between hover:border-indigo-500/40 cursor-pointer"
            onClick={() => navigate('/student/tests?category=technical')}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Technical MCQs</h3>
              <Button variant="ghost" size="sm" className="text-indigo-500 hover:text-indigo-600 p-0 font-bold group">
                Attempt MCQs <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Card>

          <Card
            className="flex flex-col justify-between hover:border-emerald-500/40 cursor-pointer"
            onClick={() => navigate('/student/coding')}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Coding Problems</h3>
              <Button variant="ghost" size="sm" className="text-emerald-500 hover:text-emerald-600 p-0 font-bold group">
                Practice Code <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Card>

          <Card
            className="flex flex-col justify-between hover:border-purple-500/40 cursor-pointer"
            onClick={() => navigate('/student/interview')}
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">AI Mock Interview</h3>
              <Button variant="ghost" size="sm" className="text-purple-500 hover:text-purple-600 p-0 font-bold group">
                Start Interview <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Grid for charts and listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress chart */}
        <Card className="lg:col-span-2" hover={false}>
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Recent Test Performance Trend</h3>
          {lineChartData.length > 0 ? (
            <ProgressChart data={lineChartData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Attempt tests to visualize your progress over time!
            </div>
          )}
        </Card>

        {/* Category distribution */}
        <Card hover={false}>
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Preparation Breakdown</h3>
          {stats.testsCompleted > 0 || stats.problemsSolved > 0 ? (
            <CategoryChart data={categoryChartData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              No categories evaluated yet.
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results List */}
        <Card hover={false}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Recent Activities</h3>
            <Link to="/student/results" className="text-blue-500 hover:text-blue-600 font-bold text-xs">
              View All Results
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentResults.length > 0 ? (
              recentResults.map((res) => (
                <div
                  key={res._id}
                  className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/20 hover:bg-slate-50/60 dark:hover:bg-slate-800/35 transition-colors cursor-pointer"
                  onClick={() => navigate(`/student/tests/${res.test?._id}/result`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      res.passed
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}>
                      {res.obtainedMarks}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        {res.test?.name || 'Deleted Test'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(res.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-black ${res.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {res.passed ? 'PASSED' : 'FAILED'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Score: {res.percentage}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                No tests taken yet. Get started today!
              </div>
            )}
          </div>
        </Card>

        {/* Assigned Upcoming Tests */}
        <Card hover={false}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Active Placement Tests</h3>
            <Link to="/student/tests" className="text-blue-500 hover:text-blue-600 font-bold text-xs">
              Browse All Tests
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {tests.length > 0 ? (
              tests.map((test) => (
                <div
                  key={test._id}
                  className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/20 hover:bg-slate-50/60 dark:hover:bg-slate-800/35 transition-colors cursor-pointer"
                  onClick={() => navigate(`/student/tests/${test._id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{test.name}</p>
                      <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.totalTime} mins</span>
                        <span>•</span>
                        <span>{test.totalQuestions} Questions</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="font-bold py-1.5 px-3">
                    Start
                  </Button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                No active tests assigned at this moment.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

