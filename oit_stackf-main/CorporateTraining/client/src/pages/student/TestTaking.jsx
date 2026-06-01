import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, Maximize, Minimize, LogOut, ClipboardList } from 'lucide-react';
import { toast } from 'react-hot-toast';
import testService from '../../services/testService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const TestTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [resultId, setResultId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const questionStartTimeRef = useRef(Date.now());
  const tabSwitchCountRef = useRef(0);
  const executeSubmissionRef = useRef(null);

  useEffect(() => {
    executeSubmissionRef.current = executeSubmission;
  });

  useEffect(() => {
    const fetchTestQuestions = async () => {
      try {
        setLoading(true);
        const res = await testService.startTest(id);
        const testData = res.data.test || res.data;
        const rId = res.data.resultId || null;
        setTest(testData);
        if (rId) setResultId(rId);
        setQuestions(testData.questions || []);
        setTimeLeft((testData.totalTime || 30) * 60);

        const savedKey = `test_taking_${id}`;
        const savedState = localStorage.getItem(savedKey);
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            setAnswers(parsed.answers || {});
            setCurrentIndex(parsed.currentIndex || 0);

            const elapsed = Math.round((Date.now() - parsed.timestamp) / 1000);
            const remaining = parsed.timeLeft - elapsed;
            if (remaining > 0) {
              setTimeLeft(remaining);
            } else {
              setTimeLeft(0);
            }
          } catch (e) {
            console.error('Error loading saved test state:', e);
          }
        }
      } catch (err) {
        console.error('Error starting test:', err);
        const msg = err.response?.data?.message || err.message || 'Failed to start test session. Please try again.';
        toast.error(msg);
        navigate(`/student/tests/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchTestQuestions();
  }, [id, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your exam progress will be lost.';
      return e.returnValue;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        tabSwitchCountRef.current += 1;
        const violations = tabSwitchCountRef.current;
        
        if (violations >= 3) {
          toast.error('Test auto-submitted due to multiple tab switches!', { duration: 8000 });
          if (executeSubmissionRef.current) executeSubmissionRef.current(true);
        } else {
          toast.error(`Warning: Do not switch tabs! (Violation ${violations}/3)`, { duration: 5000 });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (loading || !test) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }

        if (prev === 300) {
          toast.error('Only 5 minutes left!', { duration: 5000 });
        } else if (prev === 60) {
          toast.error('1 minute left! Your test will be auto-submitted shortly.', { duration: 8000 });
        }

        const savedKey = `test_taking_${id}`;
        const stateToSave = {
          answers,
          currentIndex,
          timeLeft: prev - 1,
          timestamp: Date.now()
        };
        localStorage.setItem(savedKey, JSON.stringify(stateToSave));

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, test, answers, currentIndex, id]);

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentIndex]);

  const recordTimeSpentOnCurrent = () => {
    if (questions.length === 0) return;
    const currentQ = questions[currentIndex];
    const timeSpent = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

    setAnswers((prev) => {
      const qAns = prev[currentQ._id] || {};
      const newTime = (qAns.timeTaken || 0) + timeSpent;
      
      // Auto-save the time spent
      if (resultId) {
        testService.saveAnswer(resultId, {
          questionId: currentQ._id,
          selectedAnswer: qAns.selectedAnswer,
          timeTaken: timeSpent
        }).catch(() => {});
      }

      return {
        ...prev,
        [currentQ._id]: {
          ...qAns,
          timeTaken: newTime,
          visited: true,
        }
      };
    });
  };

  const handleExit = () => {
    clearInterval(timerRef.current);
    localStorage.removeItem(`test_taking_${id}`);
    navigate(`/student/tests/${id}`);
  };

  const handleAutoSubmit = async () => {
    toast.error('Time is up! Submitting your answers automatically.');
    await executeSubmission(true);
  };

  const executeSubmission = async (isAuto = false) => {
    try {
      setSubmitting(true);
      recordTimeSpentOnCurrent();

      const payloadAnswers = Object.entries(answers).map(([qId, ans]) => ({
        question: qId,
        selectedAnswer: ans.selectedAnswer,
        timeTaken: ans.timeTaken || 0,
      }));

      questions.forEach(q => {
        if (!answers[q._id]) {
          payloadAnswers.push({
            question: q._id,
            selectedAnswer: null,
            timeTaken: 0
          });
        }
      });

      const totalTimeElapsed = Math.round((Date.now() - startTimeRef.current) / 1000);

      const res = await testService.submitTest(id, {
        resultId,
        answers: payloadAnswers,
        timeTaken: totalTimeElapsed,
        autoSubmitted: isAuto,
      });

      localStorage.removeItem(`test_taking_${id}`);

      toast.success('Test submitted successfully!');

      navigate(`/student/tests/${id}/result`, { replace: true });
    } catch (err) {
      console.error('Submission error:', err.message);
      toast.error('Error submitting test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectOption = (optionIndex) => {
    if (questions.length === 0) return;
    const currentQ = questions[currentIndex];

    setAnswers((prev) => {
      const newAns = {
        ...prev[currentQ._id],
        selectedAnswer: optionIndex
      };
      
      if (resultId) {
        testService.saveAnswer(resultId, {
          questionId: currentQ._id,
          selectedAnswer: optionIndex,
          timeTaken: 0,
        }).catch(() => {});
      }

      return {
        ...prev,
        [currentQ._id]: newAns
      };
    });
  };

  const handleToggleReview = () => {
    if (questions.length === 0) return;
    const currentQ = questions[currentIndex];

    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        markedForReview: !prev[currentQ._id]?.markedForReview
      }
    }));
  };

  const handleNext = () => {
    recordTimeSpentOnCurrent();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    recordTimeSpentOnCurrent();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handlePaletteSelect = (idx) => {
    recordTimeSpentOnCurrent();
    setCurrentIndex(idx);
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
        console.error('Error enabling full-screen mode:', err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  if (loading) return <Loader />;
  if (!test || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion._id];
  const totalQuestions = questions.length;

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 ${
        isFullscreen ? 'p-6' : ''
      }`}
    >
      {/* Top sticky exam bar */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm z-30 mb-6">
        <div>
          <h2 className="font-extrabold text-slate-800 dark:text-white line-clamp-1">{test.name}</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Question {currentIndex + 1} of {totalQuestions}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-slate-500" /> : <Maximize className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Time Countdown block */}
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border font-black text-sm transition-all duration-300 ${
            timeLeft < 300 
              ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 animate-pulse' 
              : 'bg-indigo-50/50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/10 dark:border-indigo-900/20 dark:text-indigo-400'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main split-screen panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Question Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card className="flex-1 flex flex-col justify-between" hover={false}>
            {/* Question Text */}
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800/30">
                  Question Marks: {currentQuestion.marks} | Difficulty: {currentQuestion.difficulty}
                </span>
                <button
                  onClick={handleToggleReview}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                    currentAnswer?.markedForReview
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {currentAnswer?.markedForReview ? '★ Marked for Review' : '☆ Mark for Review'}
                </button>
              </div>

              <div className="text-base font-bold text-slate-800 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </div>

              {/* Radio options container */}
              <div className="flex flex-col gap-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = currentAnswer?.selectedAnswer === idx;
                  return (
                    <label
                      key={idx}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? 'border-blue-500 dark:border-indigo-500 bg-blue-50/20 dark:bg-indigo-950/15'
                          : 'border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion._id}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(idx)}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700/80 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {option}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                icon={ChevronLeft}
              >
                Previous
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => handleSelectOption(null)}
                  disabled={currentAnswer?.selectedAnswer === null || currentAnswer?.selectedAnswer === undefined}
                  className="text-slate-500 dark:text-slate-400 font-bold"
                >
                  Clear Selection
                </Button>
                {currentIndex < totalQuestions - 1 ? (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    icon={ChevronRight}
                    iconPosition="right"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => setSubmitOpen(true)}
                    className="from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/10"
                    icon={CheckCircle}
                  >
                    Submit Test
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Question Palette Drawer */}
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-5 h-full justify-between" hover={false}>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">Question Grid</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                Use the numbers below to hop directly to any question. The border indicates status.
              </p>

              {/* Palette grid */}
              <div className="grid grid-cols-5 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const ans = answers[q._id];
                  const isCurrent = idx === currentIndex;
                  const isAnswered = ans?.selectedAnswer !== null && ans?.selectedAnswer !== undefined;
                  const isMarked = ans?.markedForReview;
                  const isVisited = ans?.visited;

                  let btnClass = 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'; // Default unanswered
                  if (isVisited) {
                    btnClass = 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-500/10 dark:border-rose-500/30';
                  }
                  if (isAnswered) {
                    btnClass = 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10';
                  }
                  if (isMarked) {
                    btnClass = 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/10';
                  }
                  if (isCurrent) {
                    btnClass = 'border-blue-500 dark:border-indigo-500 ring-2 ring-blue-500/35 dark:ring-indigo-500/35 text-blue-600 dark:text-indigo-400';
                  }

                  return (
                    <button
                      key={q._id}
                      onClick={() => handlePaletteSelect(idx)}
                      className={`h-10 rounded-xl text-xs font-bold border transition-all duration-200 ${btnClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legends */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Palette Status</h4>
              <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shrink-0" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shrink-0" />
                  <span>Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md border border-slate-200 dark:border-slate-800 shrink-0" />
                  <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 shrink-0" />
                  <span>Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md border-2 border-blue-500 shrink-0" />
                  <span>Current</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onConfirm={() => executeSubmission(false)}
        title="Submit Test"
        message={`Are you sure you want to finish and submit your answers? You have answered ${
          Object.values(answers).filter(a => a.selectedAnswer !== null && a.selectedAnswer !== undefined).length
        } out of ${totalQuestions} questions.`}
        confirmText="Yes, Submit Test"
        cancelText="Review Questions"
        variant="success"
      />
    </div>
  );
};

export default TestTaking;

