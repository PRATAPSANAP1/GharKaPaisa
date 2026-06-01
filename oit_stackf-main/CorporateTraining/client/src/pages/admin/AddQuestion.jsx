import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Save, ChevronLeft, Plus, Trash2, HelpCircle, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const AddQuestion = () => {
  const { id } = useParams(); // exists in edit mode
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [question, setQuestion] = useState('');
  const [type, setType] = useState('mcq');
  const [options, setOptions] = useState(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [marks, setMarks] = useState(1);
  const [negativeMark, setNegativeMark] = useState(0);
  const [timeLimit, setTimeLimit] = useState(60);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await adminService.getCategories();
        setCategories(res.data || []);
        
        if (!isEdit) {
          const defaultCat = searchParams.get('category');
          if (defaultCat) {
            setCategory(defaultCat);
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, [isEdit, searchParams]);

  useEffect(() => {
    if (!category) {
      setSubcategories([]);
      return;
    }
    const loadSubcategories = async () => {
      try {
        const res = await adminService.getSubcategories(category);
        setSubcategories(res.data || []);
      } catch (err) {
        console.error('Error fetching subcategories:', err);
      }
    };
    loadSubcategories();
  }, [category]);

  useEffect(() => {
    if (!isEdit) return;

    const loadQuestionData = async () => {
      try {
        setLoading(true);
        const res = await adminService.getQuestion(id);
        const q = res.data;

        setQuestion(q.question);
        setType(q.type || 'mcq');
        setOptions(q.options || ['', '']);
        setCorrectAnswer(q.correctAnswer);
        setExplanation(q.explanation || '');
        setCategory(q.category?._id || q.category);
        setSubcategory(q.subcategory?._id || q.subcategory || '');
        setDifficulty(q.difficulty || 'medium');
        setMarks(q.marks || 1);
        setNegativeMark(q.negativeMark || 0);
        setTimeLimit(q.timeLimit || 60);
      } catch (err) {
        console.error('Error loading question details:', err.message);
        toast.error('Failed to load question details.');
        navigate('/admin/questions');
      } finally {
        setLoading(false);
      }
    };
    loadQuestionData();
  }, [id, isEdit, navigate]);

  const handleAddOption = () => {
    if (options.length >= 6) {
      toast.error('A question can have a maximum of 6 options.');
      return;
    }
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      toast.error('A question must have at least 2 options.');
      return;
    }
    const nextOpts = options.filter((_, i) => i !== index);
    setOptions(nextOpts);

    if (correctAnswer === index) {
      setCorrectAnswer(0);
    } else if (correctAnswer > index) {
      setCorrectAnswer(correctAnswer - 1);
    }
  };

  const handleOptionTextChange = (index, text) => {
    const nextOpts = [...options];
    nextOpts[index] = text;
    setOptions(nextOpts);
  };

  const handleTypeChange = (e) => {
    const nextType = e.target.value;
    setType(nextType);
    if (nextType === 'true-false') {
      setOptions(['True', 'False']);
      setCorrectAnswer(0);
    } else {
      setOptions(['', '']);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error('Question text is required.');
      return;
    }
    if (!category) {
      toast.error('Please assign a Category.');
      return;
    }

    const filteredOpts = options.map(o => o.trim());
    if (filteredOpts.some(o => !o)) {
      toast.error('All option text fields must be filled.');
      return;
    }

    const payload = {
      question: question.trim(),
      type,
      options: filteredOpts,
      correctAnswer,
      explanation: explanation.trim(),
      category,
      subcategory: subcategory || null,
      difficulty,
      marks: parseFloat(marks),
      negativeMark: parseFloat(negativeMark),
      timeLimit: parseInt(timeLimit, 10),
    };

    try {
      setLoading(true);
      if (isEdit) {
        await adminService.updateQuestion(id, payload);
        toast.success('Question updated successfully!');
      } else {
        await adminService.createQuestion(payload);
        toast.success('Question created successfully!');
      }
      navigate('/admin/questions');
    } catch (err) {
      console.error('Error saving question:', err.message);
      toast.error(err.response?.data?.message || 'Error saving question details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !question) return <Loader />;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Link
          to="/admin/questions"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Back to Questions Pool
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">
          {isEdit ? 'Modify Question' : 'Add MCQ Question'}
        </h1>
      </div>

      {/* Grid containing form and visual preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Form Panel */}
        <Card hover={false} className="lg:col-span-2 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Type & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Select
                label="Question Format"
                value={type}
                options={[
                  { label: 'Multiple Choice (MCQ)', value: 'mcq' },
                  { label: 'True / False', value: 'true-false' }
                ]}
                onChange={handleTypeChange}
              />
              <Select
                label="Difficulty Level"
                value={difficulty}
                options={[
                  { label: 'Easy', value: 'easy' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'Hard', value: 'hard' }
                ]}
                onChange={(e) => setDifficulty(e.target.value)}
              />
            </div>

            {/* Category selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Select
                label="Parent Category"
                placeholder="Select Category"
                value={category}
                options={categories.map(c => ({ label: c.name, value: c._id }))}
                onChange={(e) => setCategory(e.target.value)}
              />
              <Select
                label="Subcategory (Optional)"
                placeholder="Select Subcategory"
                value={subcategory}
                options={subcategories.map(s => ({ label: s.name, value: s._id }))}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={!category}
              />
            </div>

            {/* Question Text */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Question Description
              </label>
              <textarea
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Which of the following is an OS kernel scheduling algorithm?"
                className="w-full py-2.5 px-4 rounded-xl text-sm transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Marks & Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Input
                label="Marks Value"
                type="number"
                step="0.5"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
              <Input
                label="Negative Penalty"
                type="number"
                step="0.05"
                value={negativeMark}
                onChange={(e) => setNegativeMark(e.target.value)}
              />
              <Input
                label="Time Limit (Secs)"
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
              />
            </div>

            {/* Options list */}
            <div className="space-y-3.5 border-t border-slate-50 dark:border-slate-800/80 pt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Answer Options & Key</h4>
                {type === 'mcq' && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {/* Correct answer check radio */}
                    <input
                      type="radio"
                      name="correct-answer-radio"
                      checked={correctAnswer === idx}
                      onChange={() => setCorrectAnswer(idx)}
                      className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700/80 cursor-pointer"
                      title="Set as correct answer"
                    />

                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      disabled={type === 'true-false'}
                      className="flex-1 py-2 px-4 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />

                    {type === 'mcq' && options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="flex flex-col gap-1.5 border-t border-slate-50 dark:border-slate-800/80 pt-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Explanation Key (Optional)
              </label>
              <textarea
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain the rationale or calculation behind the correct answer..."
                className="w-full py-2.5 px-4 rounded-xl text-sm transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 mt-2">
              <Button
                variant="primary"
                type="submit"
                loading={loading}
                icon={Save}
                className="px-6 font-bold shadow-indigo-500/10"
              >
                {isEdit ? 'Save Changes' : 'Create Question'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/questions')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        {/* Visual Preview Panel */}
        <div className="flex flex-col gap-4">
          <Card hover={false} className="border-slate-200/80 dark:border-slate-800 p-6 bg-slate-50/20">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">
              <Eye className="w-4 h-4" /> Live Visual Preview
            </div>

            <div className="flex flex-col gap-5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Marks: {marks} | Penalty: -{negativeMark}
              </div>

              <div className="text-xs font-extrabold text-slate-800 dark:text-white leading-relaxed">
                {question || 'How will the question description appear to students?'}
              </div>

              <div className="flex flex-col gap-2.5">
                {options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold ${
                      correctAnswer === oIdx
                        ? 'border-emerald-500/50 bg-emerald-50/5 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt || `Option ${oIdx + 1}`}</span>
                    {correctAnswer === oIdx && (
                      <span className="text-[9px] uppercase font-black text-emerald-500 tracking-wider">Correct Key</span>
                    )}
                  </div>
                ))}
              </div>

              {explanation && (
                <div className="p-3 bg-blue-50/20 dark:bg-slate-800/40 border border-blue-50/10 rounded-xl text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  <p className="font-bold text-blue-500 dark:text-indigo-400 mb-1 flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Explanation</p>
                  {explanation}
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default AddQuestion;

