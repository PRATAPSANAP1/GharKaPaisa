import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Clock, HelpCircle, Trophy, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import testService from '../../services/testService';
import categoryService from '../../services/categoryService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import CardSkeleton from '../../components/skeletons/CardSkeleton';

const AptitudeHub = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryService.getCategories()
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await testService.getTests({ limit: 100 });
        const all = Array.isArray(res.data) ? res.data : [];
        setTests(all.filter(t => t.category?.type === 'aptitude'));
      } catch {
        toast.error('Failed to load tests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Aptitude Tests</h1>
          <p className="text-sm text-slate-400 mt-0.5">Practice aptitude, verbal, and logical reasoning tests</p>
        </div>
      </div>

      {/* Tests */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700" />
          <p className="text-slate-400 font-medium">No tests available for Aptitude yet.</p>
          <p className="text-xs text-slate-400">Ask your admin to create tests under this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tests.map(test => (
            <Card key={test._id} className="flex flex-col justify-between hover:border-blue-500/20">
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <Badge variant="gray" size="sm">{test.category?.name || 'Aptitude'}</Badge>
                  <Badge variant={test.difficulty === 'easy' ? 'success' : test.difficulty === 'hard' ? 'danger' : 'warning'} size="sm">
                    {test.difficulty}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">{test.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">
                  {test.description || 'Practice this test to improve your aptitude skills.'}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Questions</p>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 mt-0.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-500" />{test.totalQuestions}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Duration</p>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />{test.totalTime}m
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
      )}
    </div>
  );
};

export default AptitudeHub;
