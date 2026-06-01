import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ChevronLeft, Plus, Trash2, Eye, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const AddCodingProblem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('');
  const [constraints, setConstraints] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');

  const [examples, setExamples] = useState([{ input: '', output: '', explanation: '' }]);

  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '', isHidden: false }]);

  const [timeLimit, setTimeLimit] = useState(2);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [points, setPoints] = useState(100);
  const [tags, setTags] = useState('');
  const [companies, setCompanies] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await adminService.getCategories({ type: 'coding' });
        setCategories(res.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    const loadProblemData = async () => {
      try {
        setLoading(true);
        const res = await adminService.getCodingProblem(id);
        const p = res.data;

        setTitle(p.title);
        setDescription(p.description);
        setDifficulty(p.difficulty || 'medium');
        setCategory(p.category?._id || p.category || '');
        setConstraints(p.constraints || '');
        setInputFormat(p.inputFormat || '');
        setOutputFormat(p.outputFormat || '');
        setExamples(p.examples || [{ input: '', output: '', explanation: '' }]);
        setTestCases(p.testCases || [{ input: '', expectedOutput: '', isHidden: false }]);
        setTimeLimit(p.timeLimit || 2);
        setMemoryLimit(p.memoryLimit || 256);
        setPoints(p.points || 100);
        setTags(p.tags ? p.tags.join(', ') : '');
        setCompanies(p.companies ? p.companies.join(', ') : '');
        setIsActive(p.isActive !== undefined ? p.isActive : true);
      } catch (err) {
        console.error('Error loading problem details:', err.message);
        toast.error('Failed to load coding problem details.');
        navigate('/admin/coding');
      } finally {
        setLoading(false);
      }
    };
    loadProblemData();
  }, [id, isEdit, navigate]);

  const handleAddExample = () => {
    setExamples([...examples, { input: '', output: '', explanation: '' }]);
  };
  const handleRemoveExample = (idx) => {
    if (examples.length <= 1) {
      toast.error('A problem must include at least 1 example case.');
      return;
    }
    setExamples(examples.filter((_, i) => i !== idx));
  };
  const handleExampleChange = (idx, field, val) => {
    const nextEx = [...examples];
    nextEx[idx][field] = val;
    setExamples(nextEx);
  };

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', isHidden: false }]);
  };
  const handleRemoveTestCase = (idx) => {
    if (testCases.length <= 1) {
      toast.error('A problem must include at least 1 testing unit.');
      return;
    }
    setTestCases(testCases.filter((_, i) => i !== idx));
  };
  const handleTestCaseChange = (idx, field, val) => {
    const nextTc = [...testCases];
    nextTc[idx][field] = val;
    setTestCases(nextTc);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Problem title is required.');
      return;
    }
    if (!description.trim()) {
      toast.error('Description is required.');
      return;
    }

    const filteredExamples = examples.map(ex => ({
      input: ex.input.trim(),
      output: ex.output.trim(),
      explanation: ex.explanation.trim()
    })).filter(ex => ex.input || ex.output);

    const filteredTestCases = testCases.map(tc => ({
      input: tc.input.trim(),
      expectedOutput: tc.expectedOutput.trim(),
      isHidden: tc.isHidden
    })).filter(tc => tc.input || tc.expectedOutput);

    if (filteredTestCases.length === 0) {
      toast.error('Please configure at least one test case.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      category: category || null,
      constraints: constraints.trim(),
      inputFormat: inputFormat.trim(),
      outputFormat: outputFormat.trim(),
      examples: filteredExamples,
      testCases: filteredTestCases,
      timeLimit: parseFloat(timeLimit),
      memoryLimit: parseInt(memoryLimit, 10),
      points: parseInt(points, 10),
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      companies: companies ? companies.split(',').map(c => c.trim()).filter(c => c) : [],
      isActive,
    };

    try {
      setLoading(true);
      if (isEdit) {
        await adminService.updateCodingProblem(id, payload);
        toast.success('Coding problem saved successfully!');
      } else {
        await adminService.createCodingProblem(payload);
        toast.success('Coding problem created successfully!');
      }
      navigate('/admin/coding');
    } catch (err) {
      console.error('Error saving problem:', err.message);
      toast.error(err.response?.data?.message || 'Failed to save coding problem.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !title) return <Loader />;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Link
          to="/admin/coding"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Back to Coding Problems
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white font-black">
          {isEdit ? 'Modify Coding Challenge' : 'Add Coding Challenge'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Basic Panel */}
        <Card hover={false} className="p-6 flex flex-col gap-5">
          <h3 className="font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-50 dark:border-slate-800">Problem Metadata</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Input
              label="Problem Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Find First Duplicate Index"
              className="sm:col-span-2"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select
              label="Parent Category"
              placeholder="Select Category"
              value={category}
              options={categories.map(c => ({ label: c.name, value: c._id }))}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Input
              label="Reward Points"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Problem Description
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed outline of the task, constraints, input criteria..."
              className="w-full py-2.5 px-4 rounded-xl text-sm transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Input
              label="CPU Time Limit (Secs)"
              type="number"
              step="0.5"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
            />
            <Input
              label="Memory Overhead (MB)"
              type="number"
              value={memoryLimit}
              onChange={(e) => setMemoryLimit(e.target.value)}
            />
            <div className="flex items-center justify-between border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 mt-4 select-none">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Set Active</label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Formats and constraints */}
        <Card hover={false} className="p-6 flex flex-col gap-5">
          <h3 className="font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-50 dark:border-slate-800">Formatting & Constraints</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Input format description</label>
              <textarea
                rows={2}
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                placeholder="e.g. First line contains integer N, followed by N integers..."
                className="w-full py-2.5 px-4 rounded-xl text-sm transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Output format description</label>
              <textarea
                rows={2}
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                placeholder="e.g. Return the duplicate element value, or -1 if no duplicates exist."
                className="w-full py-2.5 px-4 rounded-xl text-sm transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Numerical / String Constraints</label>
            <textarea
              rows={2}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g. 1 <= N <= 10^5\n-10^9 <= Arr[i] <= 10^9"
              className="w-full py-2.5 px-4 rounded-xl text-sm transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </Card>

        {/* Example cases panel */}
        <Card hover={false} className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white">Example Cases ({examples.length})</h3>
            <button
              type="button"
              onClick={handleAddExample}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Case
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {examples.map((ex, idx) => (
              <div key={idx} className="p-4 bg-slate-50/50 dark:bg-slate-800/25 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-3 relative">
                <div className="flex justify-between items-center">
                  <span className="text-sm uppercase font-bold text-slate-400">Example {idx + 1}</span>
                  {examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExample(idx)}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase">Input</label>
                    <textarea
                      rows={2}
                      value={ex.input}
                      onChange={(e) => handleExampleChange(idx, 'input', e.target.value)}
                      className="w-full py-2 px-3 rounded-xl text-xs bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase">Output</label>
                    <textarea
                      rows={2}
                      value={ex.output}
                      onChange={(e) => handleExampleChange(idx, 'output', e.target.value)}
                      className="w-full py-2 px-3 rounded-xl text-xs bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <Input
                  label="Explanation"
                  value={ex.explanation}
                  onChange={(e) => handleExampleChange(idx, 'explanation', e.target.value)}
                  placeholder="Describe why this input gives this output..."
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Compiler test cases */}
        <Card hover={false} className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white">Compiler Evaluation Test Cases ({testCases.length})</h3>
            <button
              type="button"
              onClick={handleAddTestCase}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Testcase
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {testCases.map((tc, idx) => (
              <div key={idx} className="p-4 bg-slate-50/50 dark:bg-slate-800/25 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm uppercase font-bold text-slate-400">Test Case {idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) => handleTestCaseChange(idx, 'isHidden', e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        id={`hide-${idx}`}
                      />
                      <label htmlFor={`hide-${idx}`} className="text-sm font-bold text-slate-500 select-none cursor-pointer">
                        Hidden Case
                      </label>
                    </div>
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTestCase(idx)}
                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase">Input stdin</label>
                    <textarea
                      rows={2}
                      value={tc.input}
                      onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                      className="w-full py-2 px-3 rounded-xl text-xs bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase">Expected stdout</label>
                    <textarea
                      rows={2}
                      value={tc.expectedOutput}
                      onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                      className="w-full py-2 px-3 rounded-xl text-xs bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Extra info & Save */}
        <Card hover={false} className="p-6 flex flex-col gap-5">
          <h3 className="font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-50 dark:border-slate-800">Taxonomy & Save</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Tags (Comma Separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Arrays, hashing, logic"
            />
            <Input
              label="Companies (Comma Separated)"
              value={companies}
              onChange={(e) => setCompanies(e.target.value)}
              placeholder="e.g. Amazon, Google, Infosys"
            />
          </div>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            icon={Save}
            className="px-8 font-bold shadow-indigo-500/10"
          >
            Save Problem
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/coding')}
          >
            Cancel
          </Button>
        </div>

      </form>
    </div>
  );
};

export default AddCodingProblem;

