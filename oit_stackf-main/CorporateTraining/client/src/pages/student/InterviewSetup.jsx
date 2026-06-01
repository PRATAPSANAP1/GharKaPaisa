import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ShieldCheck, HelpCircle, ArrowRight, UserCheck, Code2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const InterviewSetup = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null); // 'hr' or 'technical'

  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [checkingMic, setCheckingMic] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then((permissionStatus) => {
          setMicPermission(permissionStatus.state);
          permissionStatus.onchange = () => {
            setMicPermission(permissionStatus.state);
          };
        })
        .catch(err => console.error('Error querying permissions status:', err));
    }
  }, []);

  const requestMicPermission = async () => {
    try {
      setCheckingMic(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      toast.success('Microphone permission granted successfully!');
    } catch (err) {
      console.error('Mic request error:', err);
      setMicPermission('denied');
      toast.error('Microphone access denied. Please grant permission in your browser settings.');
    } finally {
      setCheckingMic(false);
    }
  };

  const handleStart = () => {
    if (!selectedType) {
      toast.error('Please select an interview category to proceed.');
      return;
    }

    navigate(`/student/interview/session?type=${selectedType}`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">AI-Powered Mock Placement Interview</h1>
      </div>

      {/* Grid containing category selections */}
      <div>
        <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">Select Interview Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            onClick={() => setSelectedType('hr')}
            className={`flex flex-col gap-4 p-6 cursor-pointer border-2 transition-all duration-300 ${
              selectedType === 'hr'
                ? 'border-blue-500 bg-blue-50/20 dark:bg-indigo-950/10'
                : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200'
            }`}
            hover={selectedType !== 'hr'}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Human Resources (HR) Round</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Covers behavior questions, communication skills, situational scenarios, leadership abilities, strengths, weaknesses, and cultural compatibility.
              </p>
            </div>
          </Card>

          <Card
            onClick={() => setSelectedType('technical')}
            className={`flex flex-col gap-4 p-6 cursor-pointer border-2 transition-all duration-300 ${
              selectedType === 'technical'
                ? 'border-blue-500 bg-blue-50/20 dark:bg-indigo-950/10'
                : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200'
            }`}
            hover={selectedType !== 'technical'}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Technical Engineering Round</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Covers algorithms, data structures (arrays, trees, graphs), operating systems, object-oriented concepts, and relational databases.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Setup check and instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

        {/* Hardware Checks */}
        <Card hover={false} className="flex flex-col gap-4 justify-between">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-2">Hardware Check</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              We recommend using a microphone to answer dynamically and test your communication skills.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/30 text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Speech Engine</span>
                <span className="font-bold">{speechSupported ? 'Supported' : 'Not Supported'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/30 text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Mic className="w-4 h-4 text-indigo-500" /> Microphone</span>
                <span className="font-bold capitalize">{micPermission}</span>
              </div>
            </div>
          </div>

          {micPermission !== 'granted' && (
            <Button
              variant="outline"
              size="sm"
              loading={checkingMic}
              onClick={requestMicPermission}
              icon={Mic}
              className="w-full text-xs font-bold"
            >
              Request Access
            </Button>
          )}
        </Card>

        {/* Guidelines and instructions */}
        <Card hover={false} className="md:col-span-2 flex flex-col gap-4">
          <h4 className="font-bold text-slate-800 dark:text-white">Guidelines for Best Outcome</h4>
          <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-2.5 leading-relaxed">
            <li>Find a quiet space to attempt the session. Background ambient noise may distort transcription checks.</li>
            <li>The interview consists of <strong>5 sequential questions</strong>. The bot will automatically advance after you submit your answer.</li>
            <li>You can speak by clicking the <span className="font-bold text-blue-500">Microphone</span> icon and toggling recording. Click it again to stop and review your text before sending.</li>
            <li>If your mic fails or transcription is inaccurate, you can directly type your answer into the chat field.</li>
            <li>After the 5th response, click 'End Interview' to save the feedback session and view your score.</li>
          </ul>

          {/* Fallback Warning */}
          {!speechSupported && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-950/30 rounded-xl flex gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-500" />
              <p className="text-[11px] leading-relaxed">
                Your browser does not support the Web Speech API (e.g. Firefox/Safari). The voice microphone recording will be disabled, but you can still fully type your answers using the text input field.
              </p>
            </div>
          )}

          <div className="flex gap-4 mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button
              variant="primary"
              onClick={handleStart}
              disabled={!selectedType}
              icon={ArrowRight}
              iconPosition="right"
              className="px-6 font-bold shadow-blue-500/10"
            >
              Start Session
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InterviewSetup;

