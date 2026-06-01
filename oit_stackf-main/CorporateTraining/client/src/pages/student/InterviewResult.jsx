import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Trophy, Clock, ChevronLeft, Mic, RefreshCw, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import interviewService from '../../services/interviewService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const InterviewResult = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const res = await interviewService.getHistory();
        const records = res.data || [];
        const currentRecord = records.find(r => r._id === id) || records[0];

        if (!currentRecord) {
          toast.error('No interview feedback session found.');
          navigate('/student/interview');
          return;
        }

        setRecord(currentRecord);
      } catch (err) {
        console.error('Error fetching feedback detail:', err.message);
        toast.error('Failed to load interview results.');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchFeedback();
    } else {
      navigate('/student/interview');
    }
  }, [id, navigate]);

  if (loading) return <Loader />;
  if (!record) return null;

  const scores = record.scores || { communication: 0, confidence: 0, technical: 0, overall: 0 };
  const overallScore = Math.round(scores.overall * 10); // scale out of 100
  const durationMinutes = Math.floor(record.duration / 60);
  const durationSeconds = record.duration % 60;

  const scoreBars = [
    { label: 'Communication Clarity', val: scores.communication || 0, color: 'from-blue-500 to-indigo-500' },
    { label: 'Confidence & Delivery', val: scores.confidence || 0, color: 'from-indigo-500 to-purple-500' },
    { label: 'Technical Accuracy / HR Flow', val: scores.technical || 0, color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      {/* Action link */}
      <div>
        <button
          onClick={() => navigate('/student/interview')}
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Back to AI Interview Setup
        </button>
      </div>

      {/* Main feedback hero block */}
      <Card className="bg-gradient-to-br from-indigo-950 to-slate-900 border-none text-white shadow-xl p-8 relative overflow-hidden" hover={false}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-14 -translate-y-14 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3 text-center md:text-left">
            <Badge variant="info" size="sm" className="bg-white/20 text-white self-center md:self-start">
              AI Evaluation Completed
            </Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Mock Interview Results
            </h1>
            <p className="text-slate-300 text-sm max-w-md leading-relaxed">
              You completed a <strong className="text-indigo-400 uppercase">{record.type}</strong> interview round. Here is your aggregated score analysis.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400 mt-2">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Duration: {durationMinutes}m {durationSeconds}s</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Questions: {record.questions?.length} asked</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="relative w-32 h-32 rounded-full border-[10px] border-white/25 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-black">{overallScore}%</span>
                <p className="text-[9px] text-slate-300 uppercase tracking-widest font-bold mt-0.5">
                  Overall Score
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Performance charts and scoring sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Sliders */}
        <Card hover={false} className="p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Score Dimensions</h3>
          <div className="flex flex-col gap-6">
            {scoreBars.map((bar, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>{bar.label}</span>
                  <span className="text-slate-800 dark:text-white">{bar.val} / 10</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${bar.color} h-full rounded-full`}
                    style={{ width: `${bar.val * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI improvement Bullet Points */}
        <Card hover={false} className="p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-indigo-500" /> AI Suggestions for Improvement
          </h3>
          <ul className="flex flex-col gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed list-none">
            {record.feedback && record.feedback.map((item, idx) => (
              <li key={idx} className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Script Reviews */}
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Interview Transcript Review</h3>
        <div className="flex flex-col gap-5">
          {record.questions && record.questions.map((q, idx) => (
            <Card key={idx} hover={false} className="p-6">
              <div className="space-y-4">
                {/* Question */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    Q
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed">
                    {q}
                  </div>
                </div>

                {/* Answer */}
                <div className="flex items-start gap-3 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    A
                  </div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    "{record.answers?.[idx] || 'No answer recorded.'}"
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Try again */}
      <div className="flex gap-4 items-center justify-center mt-4">
        <Button
          variant="primary"
          icon={RefreshCw}
          onClick={() => navigate('/student/interview')}
          className="font-bold py-2.5 px-6 shadow-blue-500/10"
        >
          Start Another Mock Interview
        </Button>
      </div>
    </div>
  );
};

export default InterviewResult;

