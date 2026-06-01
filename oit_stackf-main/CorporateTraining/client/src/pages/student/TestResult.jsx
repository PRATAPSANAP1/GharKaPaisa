import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trophy, Clock, CheckCircle2, XCircle, HelpCircle, AlertCircle, ChevronLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import resultService from '../../services/resultService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const TestResult = () => {
  const { id } = useParams(); // testId
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestResult = async () => {
      try {
        setLoading(true);
        const historyRes = await resultService.getMyResults({ testId: id, limit: 1 });
        const resultsList = historyRes.data.results || [];

        if (resultsList.length === 0) {
          toast.error('No results found for this test session.');
          navigate('/student/tests');
          return;
        }

        const detailedRes = await resultService.getResultDetail(resultsList[0]._id);
        setResult(detailedRes.data);
      } catch (err) {
        console.error('Error fetching test result:', err.message);
        toast.error('Failed to load test results');
      } finally {
        setLoading(false);
      }
    };
    fetchLatestResult();
  }, [id, navigate]);

  if (loading) return <Loader />;
  if (!result) return null;

  const testInfo = result.test || {};
  const percentage = Math.round(result.percentage || 0);
  const passed = result.passed;

  const totalQ = testInfo.totalQuestions || result.answers.length;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  result.answers.forEach(ans => {
    if (ans.selectedAnswer === null || ans.selectedAnswer === undefined) {
      skippedCount++;
    } else if (ans.isCorrect) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const formatMinutes = (secs) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins}m ${rs}s`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      {/* Back link */}
      <div>
        <Link
          to="/student/tests"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Back to Tests
        </Link>
      </div>

      {/* Main Score Card Banner */}
      <Card
        className={`relative overflow-hidden p-8 border-none text-white shadow-xl ${
          passed
            ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-500/10'
            : 'bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 shadow-rose-500/10'
        }`}
        hover={false}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-14 -translate-y-14 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3 text-center md:text-left">
            <Badge variant="gray" size="sm" className="bg-white/20 text-white self-center md:self-start">
              Result Released
            </Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {passed ? 'Congratulations! You Passed! 🎉' : 'Keep Practicing, You Can Do It! 💪'}
            </h1>
            <p className="text-white/80 text-sm max-w-md leading-relaxed">
              You completed the test "{testInfo.name}". Review your performance details and explanation key below.
            </p>
          </div>

          {/* Circular Progress Circle */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-32 h-32 rounded-full border-[10px] border-white/25 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-black">{percentage}%</span>
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mt-0.5">
                  {passed ? 'Passed' : 'Failed'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Breakdown Card */}
      <Card hover={false} className="p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Attempt Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
            <p className="text-[10px] uppercase font-bold text-slate-400">Score Obtained</p>
            <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
              {result.obtainedMarks} / {result.totalMarks}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <p className="text-[10px] uppercase font-bold text-emerald-500">Correct Answers</p>
            <p className="text-lg font-black mt-1">{correctCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100/50 dark:border-rose-500/10 text-rose-600 dark:text-rose-400">
            <p className="text-[10px] uppercase font-bold text-rose-500">Wrong Answers</p>
            <p className="text-lg font-black mt-1">{wrongCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400">
            <p className="text-[10px] uppercase font-bold text-slate-400">Skipped Answers</p>
            <p className="text-lg font-black mt-1">{skippedCount}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 justify-between text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>Time Taken: <strong>{formatMinutes(result.timeTaken)}</strong></span>
            <span>•</span>
            <span>Exam Limit: <strong>{testInfo.totalTime} Mins</strong></span>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={() => navigate(`/student/tests/${id}`)}
              className="font-bold text-xs"
            >
              Reattempt Test
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/student/tests')}
              className="font-bold text-xs"
            >
              Browse Other Tests
            </Button>
          </div>
        </div>
      </Card>

      {/* Review Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Question Key & Explanations</h3>
        <div className="flex flex-col gap-5">
          {result.answers.map((ans, idx) => {
            const q = ans.question || {};
            const isUnanswered = ans.selectedAnswer === null || ans.selectedAnswer === undefined;
            const isCorrect = ans.isCorrect;

            return (
              <Card
                key={ans._id || idx}
                hover={false}
                className={`border-l-[6px] ${
                  isUnanswered
                    ? 'border-l-slate-300 dark:border-l-slate-800'
                    : isCorrect
                    ? 'border-l-emerald-500'
                    : 'border-l-rose-500'
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Question {idx + 1} ({q.difficulty})
                    </span>
                    {isUnanswered ? (
                      <Badge variant="gray" size="sm">Unanswered</Badge>
                    ) : isCorrect ? (
                      <Badge variant="success" size="sm" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm" className="flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
                    {q.question}
                  </p>

                  {/* Options review list */}
                  <div className="flex flex-col gap-2">
                    {q.options && q.options.map((opt, optIdx) => {
                      const isSelected = ans.selectedAnswer === optIdx;
                      const isCorrectAnswer = q.correctAnswer === optIdx;

                      let optionBorder = 'border-slate-100 dark:border-slate-800 bg-slate-50/20';
                      if (isSelected) {
                        optionBorder = isCorrect ? 'border-emerald-500 bg-emerald-50/5 dark:bg-emerald-500/5' : 'border-rose-500 bg-rose-50/5 dark:bg-rose-500/5';
                      }
                      if (isCorrectAnswer && !isCorrect) {
                        optionBorder = 'border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-500/10';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold leading-relaxed ${optionBorder}`}
                        >
                          <span>{opt}</span>
                          {isCorrectAnswer && (
                            <span className="text-[10px] uppercase font-extrabold text-emerald-500 tracking-wider">
                              Correct Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation card */}
                  {q.explanation && (
                    <div className="mt-2 p-4 rounded-xl bg-blue-50/30 dark:bg-slate-800/60 border border-blue-50/20 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      <p className="font-bold text-blue-500 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" /> Explanation
                      </p>
                      {q.explanation}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestResult;

