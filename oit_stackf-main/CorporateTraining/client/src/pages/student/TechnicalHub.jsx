import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Mic, Code2, Clock, HelpCircle, Trophy, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import testService from '../../services/testService';
import codingService from '../../services/codingService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import CardSkeleton from '../../components/skeletons/CardSkeleton';

const sectionMap = {
  mcq: { label: 'MCQ Tests', icon: BookOpen, color: 'from-indigo-500 to-indigo-600', glow: 'shadow-indigo-500/20', desc: 'C, C++, Java, Python, DBMS, OS, CN, OOP multiple choice questions' },
  interview: { label: 'Interview', icon: Mic, color: 'from-purple-500 to-violet-600', glow: 'shadow-purple-500/20', desc: 'AI-powered mock HR & technical interview with real-time feedback' },
  coding: { label: 'Coding', icon: Code2, color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20', desc: 'DSA & algorithm problems with online judge (C, C++, Java, Python, JS)' },
};

const TechnicalHub = () => {
  const { section } = useParams(); // mcq | interview | coding
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const info = sectionMap[section];

  useEffect(() => {
    if (!section) return;
    const load = async () => {
      try {
        setLoading(true);
        if (section === 'mcq') {
          const res = await testService.getTests({ limit: 100 });
          const all = Array.isArray(res.data) ? res.data : [];
          setItems(all.filter(t => t.category?.type === 'technical' || (t.category?.name || '').toLowerCase().includes('technical')));
        } else if (section === 'coding') {
          const res = await codingService.getProblems({ limit: 100 });
          setItems(res.data.problems || []);
        }
        // interview is handled by redirect
      } catch {
        toast.error('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (section === 'interview') {
      navigate('/student/interview');
      return;
    }
    load();
  }, [section, navigate]);

  if (!info) { navigate('/student/dashboard'); return null; }

  const Icon = info.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center shadow-lg ${info.glow} shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Technical — {info.label}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{info.desc}</p>
        </div>
      </div>

      {/* Sub-section tabs */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(sectionMap).map(([key, val]) => {
          const SubIcon = val.icon;
          const active = key === section;
          return (
            <button key={key}
              onClick={() => key === 'interview' ? navigate('/student/interview') : navigate(`/student/technical/${key}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                active
                  ? `bg-gradient-to-r ${val.color} text-white border-transparent shadow-md`
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}>
              <SubIcon className="w-4 h-4" />
              {val.label}
            </button>
          );
        })}
      </div>

      {/* MCQ Tests */}
      {section === 'mcq' && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            <p className="text-slate-400 font-medium">No technical MCQ tests available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(test => (
              <Card key={test._id} className="flex flex-col justify-between hover:border-indigo-500/20">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <Badge variant="gray" size="sm">{test.category?.name || 'Technical'}</Badge>
                    <Badge variant={test.difficulty === 'easy' ? 'success' : test.difficulty === 'hard' ? 'danger' : 'warning'} size="sm">
                      {test.difficulty}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">{test.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">
                    {test.description || 'Test your technical knowledge with this MCQ exam.'}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Questions</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 mt-0.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />{test.totalQuestions}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Duration</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />{test.totalTime}m
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Pass</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 mt-0.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />{test.passingMarks}
                      </p>
                    </div>
                  </div>
                  <Button variant="primary" className="font-bold py-2" onClick={() => navigate(`/student/tests/${test._id}`)}>
                    Start Test <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Coding Problems */}
      {section === 'coding' && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            <p className="text-slate-400 font-medium">No coding problems available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(problem => (
              <Card key={problem._id} className="flex flex-col justify-between hover:border-emerald-500/20">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <Badge variant="gray" size="sm">{problem.category?.name || 'Coding'}</Badge>
                    <Badge variant={problem.difficulty === 'easy' ? 'success' : problem.difficulty === 'hard' ? 'danger' : 'warning'} size="sm">
                      {problem.difficulty}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">{problem.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {problem.tags?.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-500">{problem.points} pts</span>
                  <Button variant="outline" size="sm" className="font-bold" onClick={() => navigate(`/student/coding/${problem._id}`)}>
                    Solve <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default TechnicalHub;
