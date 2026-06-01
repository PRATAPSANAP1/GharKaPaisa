import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, Clock, HelpCircle, Trophy, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import testService from '../../services/testService';
import categoryService from '../../services/categoryService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import CardSkeleton from '../../components/skeletons/CardSkeleton';

const TestList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        const catOptions = res.data.map(cat => ({
          label: cat.name,
          value: cat._id
        }));
        setCategories(catOptions);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
  }, [searchParams]);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedCategory) {
          const matchedCat = categories.find(
            c => c.label.toLowerCase() === selectedCategory.toLowerCase() || c.value === selectedCategory
          );
          if (matchedCat) {
            params.category = matchedCat.value;
          } else {
            params.category = selectedCategory;
          }
        }
        if (difficulty) {
          params.difficulty = difficulty;
        }

        const res = await testService.getTests(params);

        let filteredTests = res.data;
        if (search) {
          filteredTests = filteredTests.filter(t => 
            t.name.toLowerCase().includes(search.toLowerCase()) || 
            (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
          );
        }
        setTests(filteredTests);
      } catch (err) {
        console.error('Error fetching tests:', err.message);
        toast.error('Failed to load tests list');
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [selectedCategory, difficulty, search, categories]);

  const getDifficultyVariant = (diff) => {
    switch (diff) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Placement Preparation Tests</h1>
      </div>

      {/* Filter Row */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4" hover={false}>
        <SearchInput
          placeholder="Search by test name..."
          value={search}
          onChange={setSearch}
        />
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Select
            placeholder="All Categories"
            value={selectedCategory}
            options={categories}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-44"
          />
          <Select
            placeholder="All Difficulties"
            value={difficulty}
            options={[
              { label: 'Easy', value: 'easy' },
              { label: 'Medium', value: 'medium' },
              { label: 'Hard', value: 'hard' },
              { label: 'Mixed', value: 'mixed' }
            ]}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(idx => <CardSkeleton key={idx} />)}
        </div>
      ) : tests.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Tests Found"
          description="There are no tests matching your search query or chosen filters. Try clearing filters or try a different keyword."
          action={{
            text: 'Reset Filters',
            onClick: () => {
              setSearch('');
              setSelectedCategory('');
              setDifficulty('');
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Card
              key={test._id}
              className="flex flex-col justify-between border-slate-100 dark:border-slate-800/80 hover:border-blue-500/20"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <Badge variant="gray" size="sm">
                    {test.category?.name || 'Category'}
                  </Badge>
                  <Badge variant={getDifficultyVariant(test.difficulty)} size="sm">
                    {test.difficulty}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">
                  {test.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 leading-relaxed min-h-[32px]">
                  {test.description || 'Practice this test to test your abilities and speed under timed circumstances.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2 text-center text-slate-500 dark:text-slate-400">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Questions</p>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 mt-0.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> {test.totalQuestions}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duration</p>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> {test.totalTime}m
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pass Mark</p>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 mt-0.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" /> {test.passingMarks}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="font-bold py-2"
                  onClick={() => navigate(`/student/tests/${test._id}`)}
                >
                  View Details & Start
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestList;

