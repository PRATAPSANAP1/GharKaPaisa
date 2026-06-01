import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, HelpCircle, Trophy, FileText, ChevronLeft, ShieldAlert, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import testService from '../../services/testService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const TestStart = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        setLoading(true);
        const res = await testService.getTest(id);
        setTest(res.data);
      } catch (err) {
        console.error('Error loading test details:', err.message);
        toast.error('Failed to load test details');
        navigate('/student/tests');
      } finally {
        setLoading(false);
      }
    };
    fetchTestDetails();
  }, [id, navigate]);

  if (loading) return <Loader />;
  if (!test) return null;

  const now = new Date();
  const notStarted = test.startDate && now < new Date(test.startDate);
  const hasEnded = test.endDate && now > new Date(test.endDate);
  const isUnavailable = notStarted || hasEnded;

  const handleStart = () => {
    setConfirmOpen(false);
    navigate(`/student/tests/${id}/take`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/student/tests"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Back to Tests List
        </Link>
      </div>

      {/* Hero Card */}
      <Card className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 border-none text-white shadow-xl relative overflow-hidden" hover={false}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full translate-x-12 -translate-y-12 blur-xl" />
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-200">
              {test.category?.name || 'Test Category'}
            </span>
            <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase text-blue-200">
              {test.difficulty}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {test.name}
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
            {test.description || 'Test your proficiency and speed under strict examination parameters to verify your placement capabilities.'}
          </p>
        </div>
      </Card>

      {/* Grid containing details and instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Test details panel */}
        <Card className="flex flex-col gap-6" hover={false}>
          <h3 className="font-bold text-slate-800 dark:text-white">Exam Overview</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500 text-sm flex items-center gap-2"><HelpCircle className="w-4 h-4 text-blue-500" /> Questions</span>
              <span className="font-extrabold text-slate-800 dark:text-white">{test.totalQuestions}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-500" /> Total Time</span>
              <span className="font-extrabold text-slate-800 dark:text-white">{test.totalTime} Mins</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500 text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Passing Mark</span>
              <span className="font-extrabold text-slate-800 dark:text-white">{test.passingMarks}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500 text-sm flex items-center gap-2"><Award className="w-4 h-4 text-purple-500" /> Negative Mark</span>
              <span className="font-extrabold text-slate-800 dark:text-white">
                {test.negativeMarking ? `Yes (-${test.negativeMarkValue || 0.25})` : 'None'}
              </span>
            </div>
          </div>
        </Card>

        {/* Instructions panel */}
        <Card className="md:col-span-2 flex flex-col gap-6" hover={false}>
          <h3 className="font-bold text-slate-800 dark:text-white">Instructions & Terms</h3>
          {/* Date availability banner */}
          {notStarted && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Test Not Yet Available</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  This test opens on <strong>{new Date(test.startDate).toLocaleString()}</strong>. Come back then to attempt it.
                </p>
              </div>
            </div>
          )}
          {hasEnded && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Test Has Ended</p>
                <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">
                  This test ended on <strong>{new Date(test.endDate).toLocaleString()}</strong> and is no longer available.
                </p>
              </div>
            </div>
          )}

          <ol className="list-decimal pl-5 text-sm text-slate-600 dark:text-slate-400 flex flex-col gap-3 leading-relaxed">
            <li>Ensure you have a stable internet connection. Do not close or refresh the window once the test starts.</li>
            <li>This is a timed test. The countdown will begin immediately upon clicking 'Start Test'. The timer cannot be paused.</li>
            <li>If the timer runs out before submission, your current answers will be <strong>automatically submitted</strong>.</li>
            <li>Do not attempt to open new tabs, switch applications, or exit full-screen mode (if enabled). This may lead to automated warnings or disqualification.</li>
            <li>Review each answer carefully. You can mark questions for review and return to them using the question palette.</li>
          </ol>

          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-950/30 flex gap-3 text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-6 h-6 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold mb-1">Honor System Policy</p>
              By proceeding, you agree that you will complete this test independently, without accessing external resources, tools, or assistance. Any academic integrity violations will be flagged.
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="agree" className="text-xs text-slate-600 dark:text-slate-400 font-bold select-none cursor-pointer">
              I have read the instructions and agree to the Honor System policy.
            </label>
          </div>

          <div className="flex gap-4 mt-2">
            <Button
              variant="primary"
              disabled={!agreed || isUnavailable}
              className="font-bold px-8 shadow-blue-500/10"
              onClick={() => setConfirmOpen(true)}
            >
              {notStarted ? 'Not Yet Available' : hasEnded ? 'Test Ended' : 'Start Test'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/student/tests')}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleStart}
        title="Start Test Confirmation"
        message={`You are about to start the test "${test.name}". The timer of ${test.totalTime} minutes will begin immediately. Are you sure you are ready to begin?`}
        confirmText="Yes, Start Test"
        cancelText="Cancel"
      />
    </div>
  );
};

export default TestStart;

