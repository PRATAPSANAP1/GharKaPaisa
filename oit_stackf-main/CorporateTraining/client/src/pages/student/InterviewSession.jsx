import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Mic, MicOff, Send, HelpCircle, StopCircle, User, Bot, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import interviewService from '../../services/interviewService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const InterviewSession = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'hr';
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]); // [{ role: 'assistant'|'user', content: string }]
  const [answer, setAnswer] = useState('');
  const [questionCount, setQuestionCount] = useState(1);
  const [sessionTimer, setSessionTimer] = useState(0); // seconds
  const [isRecording, setIsRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);

  const chatEndRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const startSession = async () => {
      try {
        setLoading(true);
        const res = await interviewService.startInterview(type);
        setMessages(res.data.history || []);

        timerRef.current = setInterval(() => {
          setSessionTimer(prev => prev + 1);
        }, 1000);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';

          rec.onstart = () => {
            setIsRecording(true);
          };

          rec.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              }
            }
            if (finalTranscript) {
              setAnswer(prev => prev + (prev ? ' ' : '') + finalTranscript);
            }
          };

          rec.onerror = (e) => {
            console.error('Speech recognition error:', e);
            if (e.error === 'not-allowed') {
              toast.error('Microphone access denied. Switching to text fallback.');
              setIsRecording(false);
            }
          };

          rec.onend = () => {
            setIsRecording(false);
          };

          recognitionRef.current = rec;
        }

      } catch (err) {
        console.error('Error starting interview session:', err.message);
        toast.error('Failed to initialize interview round.');
        navigate('/student/interview');
      } finally {
        setLoading(false);
      }
    };
    startSession();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [type, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiLoading]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in this browser. Please type your answers.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;

    if (isRecording) {
      recognitionRef.current.stop();
    }

    const currentAnswer = answer;
    setAnswer('');

    const historyPayload = [...messages];
    setMessages(prev => [...prev, { role: 'user', content: currentAnswer }]);
    setQuestionCount(prev => prev + 1);

    try {
      setAiLoading(true);
      const res = await interviewService.sendAnswer(historyPayload, currentAnswer, type);
      setMessages(res.data.history || []);
    } catch (err) {
      console.error('Error sending answer:', err.message);
      toast.error('Failed to get feedback from AI Interviewer.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleEndInterview = async () => {
    setEndConfirmOpen(false);

    try {
      setLoading(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const res = await interviewService.endInterview(messages, sessionTimer, type);
      const record = res.data;
      toast.success('Interview evaluated successfully! Redirecting...');

      navigate(`/student/interview/result?id=${record._id}`);
    } catch (err) {
      console.error('End interview error:', err.message);
      toast.error('Failed to submit interview session for evaluation');
      setLoading(false);
    }
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  if (loading) return <Loader />;

  const isComplete = questionCount > 5;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto h-[calc(100vh-120px)]">
      {/* Session Header */}
      <div className="flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 px-6 py-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black">
            AI
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white capitalize">
              AI {type} Placement Round
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Question {Math.min(questionCount, 5)} of 5
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Duration Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs">
            <Clock className="w-4 h-4" />
            <span>{formatTimer(sessionTimer)}</span>
          </div>

          <Button
            variant="danger"
            size="sm"
            icon={StopCircle}
            onClick={() => setEndConfirmOpen(true)}
            className="font-bold py-1.5 px-3 text-xs"
          >
            End Interview
          </Button>
        </div>
      </div>

      {/* Message Chat Pane */}
      <Card className="flex-1 flex flex-col justify-between overflow-hidden p-0 border-slate-100 dark:border-slate-800/80" hover={false}>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/10 dark:bg-slate-900/10">
          {messages.map((msg, idx) => {
            const isBot = msg.role === 'assistant';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[80%] ${isBot ? 'self-start' : 'self-end flex-row-reverse ml-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white ${
                  isBot ? 'bg-indigo-500' : 'bg-blue-500'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message bubble */}
                <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed ${
                  isBot
                    ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 shadow-sm'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10'
                }`}>
                  {msg.content}
                </div>
              </div>
            );
          })}

          {aiLoading && (
            <div className="flex gap-3 max-w-[80%] self-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 text-slate-400 flex items-center gap-2 text-xs shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Interviewer is analyzing your response...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input box bottom bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shrink-0">
          {isComplete ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-blue-50 dark:bg-indigo-950/20 border border-blue-100/30 dark:border-indigo-950/40">
              <div className="flex items-center gap-2 text-blue-800 dark:text-indigo-300">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold">
                  All 5 rounds are completed! Please click 'End Interview' to submit your transcript for AI performance evaluation.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleEndInterview}
                className="font-bold text-xs"
              >
                Submit Now
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-3">
              {/* Mic recording button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-xl border-2 transition-all duration-300 relative flex items-center justify-center shrink-0 ${
                  isRecording
                    ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                    : 'border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={isRecording ? 'Listening... Speak now and press microphone button to save.' : 'Type your interview response here...'}
                className="flex-1 py-3 px-4 rounded-xl text-xs transition-all duration-300 bg-slate-50 dark:bg-slate-800/60 text-slate-950 dark:text-white border-2 border-slate-100 dark:border-slate-800/80 focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
                disabled={aiLoading}
              />

              <button
                type="submit"
                disabled={!answer.trim() || aiLoading}
                className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </Card>

      <ConfirmDialog
        isOpen={endConfirmOpen}
        onClose={() => setEndConfirmOpen(false)}
        onConfirm={handleEndInterview}
        title="End Interview"
        message="Are you sure you want to end this interview round prematurely? Your transcript up to this point will be sent for evaluation and saved."
        confirmText="Yes, Submit & End"
        cancelText="Resume Interview"
        variant="danger"
      />
    </div>
  );
};

export default InterviewSession;

