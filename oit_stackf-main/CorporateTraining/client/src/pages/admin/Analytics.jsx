import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import {
  TrendingUp, Users, ClipboardList, BookOpen, Layers, Award,
  CheckCircle, HelpCircle, ArrowUpRight, BarChart3, PieChartIcon, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import analyticsService from '../../services/analyticsService';

const COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];
const DIFFICULTY_COLORS = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
  Easy: '#10B981',
  Medium: '#F59E0B',
  Hard: '#EF4444'
};

const CustomTooltip = ({ active, payload, label, suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white p-3 rounded-xl border border-slate-800/50 shadow-lg text-xs flex flex-col gap-1">
        <p className="font-bold text-slate-300">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} style={{ color: item.color || '#818CF8' }}>
            {item.name}: <span className="font-semibold text-white">{item.value}{suffix}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);

  const [studentData, setStudentData] = useState({
    performanceRanges: [],
    averageScoresByCategory: [],
    topPerformers: []
  });
  const [testData, setTestData] = useState({
    testPerformance: [],
    testDifficultyCount: []
  });
  const [categoryData, setCategoryData] = useState({
    questionsDistribution: [],
    testsDistribution: []
  });

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      try {
        setLoading(true);
        const [studentRes, testRes, categoryRes] = await Promise.all([
          analyticsService.getStudentAnalytics(),
          analyticsService.getTestAnalytics(),
          analyticsService.getCategoryAnalytics()
        ]);

        if (studentRes?.data) setStudentData(studentRes.data);
        if (testRes?.data) setTestData(testRes.data);
        if (categoryRes?.data) setCategoryData(categoryRes.data);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        toast.error('Failed to load analytics metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchAllAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const difficultyPieData = testData.testDifficultyCount.map(d => ({
    name: d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : 'Unknown',
    value: d.count || 0
  }));

  const performanceChartData = studentData.performanceRanges.map(range => ({
    name: range.name,
    Count: range.count
  }));

  const avgCategoryChartData = studentData.averageScoresByCategory.map(cat => ({
    name: cat.categoryName,
    'Average Score (%)': cat.avgPercentage
  }));

  const questionsPerCategoryData = categoryData.questionsDistribution.map(cat => ({
    name: cat.categoryName,
    value: cat.count
  }));

  const testsPerCategoryData = categoryData.testsDistribution.map(cat => ({
    name: cat.categoryName,
    value: cat.count
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">System Analytics</h1>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 font-bold text-sm transition-colors relative flex items-center gap-2 ${
            activeTab === 'students'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          Student Performance
          {activeTab === 'students' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-3 font-bold text-sm transition-colors relative flex items-center gap-2 ${
            activeTab === 'tests'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Tests & Exam Performance
          {activeTab === 'tests' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 font-bold text-sm transition-colors relative flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          Content & Category Dist
          {activeTab === 'categories' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === 'students' && (
        <div className="flex flex-col gap-6">
          {/* Top Row: Performance Ranges & Avg Scores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Ranges Chart */}
            <Card hover={false} className="flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  Score Distribution
                </h3>
              </div>

              {performanceChartData.length > 0 ? (
                <div className="w-full h-80 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800/60" />
                      <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                      <Bar dataKey="Count" fill="url(#scoreRangeColor)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                      <defs>
                        <linearGradient id="scoreRangeColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.85} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.85} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400">No score distribution data registered yet.</div>
              )}
            </Card>

            {/* Average Scores by Category */}
            <Card hover={false} className="flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Avg Test Score by Category
                </h3>
              </div>

              {avgCategoryChartData.length > 0 ? (
                <div className="w-full h-80 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={avgCategoryChartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" className="dark:stroke-slate-800/60" />
                      <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} width={100} />
                      <Tooltip content={<CustomTooltip suffix="%" />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                      <Bar dataKey="Average Score (%)" fill="url(#avgCatColor)" radius={[0, 6, 6, 0]} maxBarSize={25} />
                      <defs>
                        <linearGradient id="avgCatColor" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.85} />
                          <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.85} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400">No category performance scores generated yet.</div>
              )}
            </Card>
          </div>

          {/* Bottom Row: Top Performers Table */}
          <Card hover={false} className="flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Elite Performers (Top 5)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Branch & College</th>
                    <th className="py-3 px-4 text-center">Tests Finished</th>
                    <th className="py-3 px-4 text-center">Coding Solved</th>
                    <th className="py-3 px-4 text-right">Aggregate Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-sm">
                  {studentData.topPerformers.length > 0 ? (
                    studentData.topPerformers
                      .filter(item => item.user?.email !== 'admin@oitstack.com')
                      .map((item, idx) => (
                      <tr key={item._id || idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                        <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                          {idx === 0 ? (
                            <span className="flex items-center gap-1 text-amber-500">🏆 #1</span>
                          ) : idx === 1 ? (
                            <span className="text-slate-400">🥈 #2</span>
                          ) : idx === 2 ? (
                            <span className="text-amber-700">🥉 #3</span>
                          ) : (
                            `#${idx + 1}`
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {item.user?.name ? item.user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">{item.user?.name || 'Unknown Student'}</p>
                              {item.user?.email && <p className="text-[10px] text-slate-400">{item.user.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                          {item.user?.branch && <p className="font-semibold">{item.user.branch} {item.user?.year ? `- ${item.user.year} Yr` : ''}</p>}
                          {item.user?.college && <p className="text-[10px] text-slate-400">{item.user.college}</p>}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {item.testsCompleted || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {item.codingProblemsSolved || 0}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                          {item.totalScore || 0} pts
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">No leaderboard performers compiled yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'tests' && (
        <div className="flex flex-col gap-6">
          {/* Top row: Difficulty Count */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hover={false} className="md:col-span-1 flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-indigo-500" />
                  Tests by Difficulty
                </h3>
              </div>

              {difficultyPieData.length > 0 ? (
                <div className="w-full h-64 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyPieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {difficultyPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={DIFFICULTY_COLORS[entry.name] || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        formatter={(value) => (
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400">No tests registered yet.</div>
              )}
            </Card>

            {/* Test Performance list */}
            <Card hover={false} className="md:col-span-2 flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Placement Test Insights
                </h3>
              </div>

              <div className="overflow-y-auto max-h-[300px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Test Name</th>
                      <th className="py-2.5 px-3 text-center">Submissions</th>
                      <th className="py-2.5 px-3 text-center">Avg Score</th>
                      <th className="py-2.5 px-3 text-right">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-xs">
                    {testData.testPerformance.length > 0 ? (
                      testData.testPerformance.map((test, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                          <td className="py-3 px-3 font-bold text-slate-800 dark:text-white">
                            {test.testName}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-600 dark:text-slate-400">
                            {test.totalSubmissions}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                            {test.averagePercentage}%
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`font-black ${test.passRate >= 60 ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {test.passRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-10 text-center text-slate-400">No test metrics generated. Run a test to collect stats.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Questions by Category */}
            <Card hover={false} className="flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-500" />
                  MCQ Questions by Category
                </h3>
              </div>

              {questionsPerCategoryData.length > 0 ? (
                <div className="w-full h-80 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={questionsPerCategoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {questionsPerCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        formatter={(value) => (
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400">No questions mapped to categories.</div>
              )}
            </Card>

            {/* Tests by Category */}
            <Card hover={false} className="flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Active Tests by Category
                </h3>
              </div>

              {testsPerCategoryData.length > 0 ? (
                <div className="w-full h-80 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={testsPerCategoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {testsPerCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        formatter={(value) => (
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400">No test configurations assigned to categories.</div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

