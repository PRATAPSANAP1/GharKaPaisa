import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Save, ChevronLeft, Plus, Loader2, Trash2, ChevronDown, ChevronUp, Shuffle, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';

const newSection = () => ({ id: Date.now(), category: '', mode: 'automatic', count: 10, selectedQuestions: [], pool: [], loadingPool: false, expanded: true });

const CreateTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState('mixed');
  const [totalTime, setTotalTime] = useState(30);
  const [passingMarks, setPassingMarks] = useState(10);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkValue, setNegativeMarkValue] = useState(0.25);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [isDynamic, setIsDynamic] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sections, setSections] = useState([newSection()]);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState(null);

  const totalSelected = sections.reduce((sum, s) => {
    if (s.mode === 'manual') return sum + s.selectedQuestions.length;
    const available = s.pool.length;
    return sum + Math.min(s.count || 0, available);
  }, 0);

  useEffect(() => {
    adminService.getCategories()
      .then(res => {
        setCategories(res.data || []);
        if (!isEdit) {
          const defaultCat = searchParams.get('category');
          if (defaultCat) {
            setSections(prev => {
              const updated = [...prev];
              updated[0] = { ...updated[0], category: defaultCat };
              return updated;
            });
            // Let the category change handler logic handle loading the pool or do it explicitly here:
            // But to avoid stale closures, we can just let it run.
          }
        }
      })
      .catch(() => {});
  }, [isEdit, searchParams]);

  const loadPoolForSection = useCallback(async (sectionId, categoryId) => {
    if (!categoryId) return;
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, loadingPool: true, pool: [] } : s));
    try {
      const res = await adminService.getQuestions({ category: categoryId, limit: 500, includeInactive: 'true' });
      const pool = (res.data.questions || []).filter(q => q.isActive);
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, pool, loadingPool: false } : s));
    } catch {
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, loadingPool: false } : s));
    }
  }, []);

  useEffect(() => {
    if (!isEdit) {
      const defaultCat = searchParams.get('category');
      if (defaultCat && sections.length > 0 && sections[0].id && !sections[0].pool.length && !sections[0].loadingPool && sections[0].category === defaultCat) {
        loadPoolForSection(sections[0].id, defaultCat);
      }
    }
  }, [isEdit, searchParams, sections, loadPoolForSection]);

  // Edit mode
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminService.getTest(id);
        const test = res.data;
        setName(test.name);
        setDifficulty(test.difficulty || 'mixed');
        setTotalTime(test.totalTime);
        setPassingMarks(test.passingMarks || 0);
        setNegativeMarking(test.negativeMarking || false);
        setNegativeMarkValue(test.negativeMarkValue || 0.25);
        setRandomizeQuestions(test.randomizeQuestions !== undefined ? test.randomizeQuestions : true);
        setShuffleOptions(test.shuffleOptions || false);
        setIsDynamic(test.isDynamic || false);
        setIsActive(test.isActive !== undefined ? test.isActive : true);
        if (test.startDate) setStartDate(new Date(test.startDate).toISOString().slice(0, 16));
        if (test.endDate) setEndDate(new Date(test.endDate).toISOString().slice(0, 16));

        // Group by category, IDs
        const questions = test.questions || [];
        const catMap = {};
        questions.forEach(q => {
          const catId = q.category?._id || q.category || 'unknown';
          if (!catMap[catId]) catMap[catId] = [];
          catMap[catId].push(q._id || q);
        });

        const builtSections = Object.entries(catMap).map(([catId, qs]) => ({
          id: Date.now() + Math.random(),
          category: catId,
          mode: test.isDynamic ? 'automatic' : 'manual',
          count: qs.length,
          selectedQuestions: qs,
          pool: [],
          loadingPool: false,
          expanded: true,
        }));
        
        // If it's dynamic, reconstruct from dynamicConfig instead
        if (test.isDynamic && test.dynamicConfig && test.dynamicConfig.length > 0) {
          const dynSections = test.dynamicConfig.map((cfg, i) => ({
            id: Date.now() + i,
            category: cfg.category?._id || cfg.category || '',
            mode: 'automatic',
            count: cfg.count,
            selectedQuestions: [],
            pool: [],
            loadingPool: false,
            expanded: true,
          }));
          setSections(dynSections.length > 0 ? dynSections : [newSection()]);
          dynSections.forEach(s => loadPoolForSection(s.id, s.category));
        } else {
          setSections(builtSections.length > 0 ? builtSections : [newSection()]);
          builtSections.forEach(s => loadPoolForSection(s.id, s.category));
        }
      } catch {
        toast.error('Failed to load test details.');
        navigate('/admin/tests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate, loadPoolForSection]);

  const handleSectionCategoryChange = (sectionId, categoryId) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, category: categoryId, pool: [] } : s
    ));
    if (categoryId) loadPoolForSection(sectionId, categoryId);
  };

  const handleSectionModeChange = (sectionId, mode) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, mode } : s));
  };

  const handleToggleQuestion = (sectionId, questionId) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const selected = s.selectedQuestions.includes(questionId)
        ? s.selectedQuestions.filter(id => id !== questionId)
        : [...s.selectedQuestions, questionId];
      return { ...s, selectedQuestions: selected, count: selected.length };
    }));
  };
  const handleCountChange = (sectionId, value) => {
    const num = Math.max(1, parseInt(value) || 1);
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, count: num } : s));
  };

  // Auto-select `count` random questions from pool
  const autoSelectQuestions = (pool, count) => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, pool.length)).map(q => q._id);
  };

  const addSection = () => setSections(prev => [...prev, newSection()]);

  const removeSection = (sectionId) => {
    if (sections.length === 1) { toast.error('At least one section is required.'); return; }
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const toggleExpand = (sectionId) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, expanded: !s.expanded } : s));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Test name is required.'); return; }

    const sectionsWithCat = sections.filter(s => s.category && s.pool.length > 0);
    if (sectionsWithCat.length === 0) { toast.error('Please select a category with available questions.'); return; }

    // Validate counts and manual selections
    for (const s of sectionsWithCat) {
      if (s.mode === 'automatic' && s.count > s.pool.length) {
        const catName = categories.find(c => c._id === s.category)?.name || 'section';
        toast.error(`${catName}: only ${s.pool.length} questions available, but ${s.count} requested.`);
        return;
      }
      if (s.mode === 'manual' && s.selectedQuestions.length === 0) {
        const catName = categories.find(c => c._id === s.category)?.name || 'section';
        toast.error(`${catName}: Manual mode is selected but no questions were chosen.`);
        return;
      }
    }

    // Process questions per section based on mode
    const allQuestions = isDynamic ? [] : sectionsWithCat.flatMap(s => 
      s.mode === 'manual' ? s.selectedQuestions : autoSelectQuestions(s.pool, s.count)
    );
    
    const dynamicConfig = isDynamic ? sectionsWithCat.map(s => ({
      category: s.category,
      difficulty: 'mixed', // could extend to allow per-section difficulty later
      count: s.count
    })) : [];

    const primaryCategory = sectionsWithCat[0]?.category || null;
    const totalQCount = isDynamic ? sectionsWithCat.reduce((sum, s) => sum + s.count, 0) : allQuestions.length;

    const payload = {
      name: name.trim(),
      category: primaryCategory,
      difficulty,
      totalTime: parseInt(totalTime, 10),
      passingMarks: parseFloat(passingMarks),
      negativeMarking,
      negativeMarkValue: negativeMarking ? parseFloat(negativeMarkValue) : 0,
      randomizeQuestions,
      shuffleOptions,
      isDynamic,
      dynamicConfig,
      questions: allQuestions,
      totalQuestions: totalQCount,
      isActive,
      startDate: startDate || null,
      endDate: endDate || null,
    };

    try {
      setLoading(true);
      if (isEdit) {
        await adminService.updateTest(id, payload);
        toast.success('Test updated successfully!');
      } else {
        await adminService.createTest(payload);
        toast.success('Test created successfully!');
      }
      navigate('/admin/tests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving test.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !name) return <Loader />;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div>
        <Link to="/admin/tests" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Back to Tests List
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">{isEdit ? 'Modify Test' : 'Create Test'}</h1>
        <p className="text-sm text-slate-400 mt-0.5">Select a category and enter how many questions to auto-pick per section.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Basic Config */}
          <Card hover={false} className="p-6 flex flex-col gap-5">
            <h3 className="font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Basic Configuration</h3>
            <Input label="Test Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Quantitative Reasoning Mock 1" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Select label="Difficulty" value={difficulty}
                options={[{ label: 'Easy', value: 'easy' }, { label: 'Medium', value: 'medium' }, { label: 'Hard', value: 'hard' }, { label: 'Mixed', value: 'mixed' }]}
                onChange={e => setDifficulty(e.target.value)} />
              <Input label="Duration (mins)" type="number" value={totalTime} onChange={e => setTotalTime(e.target.value)} />
              <Input label="Passing Score" type="number" value={passingMarks} onChange={e => setPassingMarks(e.target.value)} />
            </div>
          </Card>

          {/* Sections */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Question Sections</h3>
                <p className="text-xs text-slate-400 mt-0.5">{totalSelected} questions will be auto-selected across {sections.length} section{sections.length > 1 ? 's' : ''}</p>
              </div>
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addSection} className="text-xs font-bold">
                Add Section
              </Button>
            </div>

            {sections.map((section, idx) => {
              const catName = categories.find(c => c._id === section.category)?.name;
              const available = section.pool.length;
              const countExceeds = section.count > available && available > 0;

              return (
                <Card key={section.id} hover={false} className="p-0 overflow-hidden">
                  {/* Section header */}
                  <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center">{idx + 1}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{catName || 'Select a category'}</p>
                        <p className="text-[10px] text-slate-400">
                          {available > 0 ? `${Math.min(section.count, available)} of ${available} questions` : 'No questions loaded'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => toggleExpand(section.id)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                        {section.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {sections.length > 1 && (
                        <button type="button" onClick={() => removeSection(section.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {section.expanded && (
                    <div className="p-5 flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Category */}
                        <Select
                          label="Category"
                          placeholder="Select category"
                          value={section.category}
                          options={categories.map(c => ({ label: c.name, value: c._id }))}
                          onChange={e => handleSectionCategoryChange(section.id, e.target.value)}
                        />

                        {/* Selection Mode */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Selection Mode
                          </label>
                          <Select
                            value={isDynamic ? 'automatic' : section.mode}
                            options={[{ label: 'Automatic (Random)', value: 'automatic' }, { label: 'Manual Selection', value: 'manual' }]}
                            onChange={e => handleSectionModeChange(section.id, e.target.value)}
                            disabled={!section.category || isDynamic}
                          />
                        </div>

                        {section.mode === 'automatic' || isDynamic ? (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              No. of Questions to Pick
                            </label>
                            <div className="relative">
                              <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                              <input
                                type="number"
                                min={1}
                                max={available || 999}
                                value={section.count}
                                onChange={e => handleCountChange(section.id, e.target.value)}
                                disabled={!section.category}
                                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all focus:outline-none ${
                                  countExceeds
                                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                              />
                            </div>
                            {section.loadingPool && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading questions...
                              </p>
                            )}
                            {!section.loadingPool && available > 0 && (
                              <p className={`text-[10px] font-semibold ${countExceeds ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {countExceeds
                                  ? `Only ${available} questions available`
                                  : `${available} questions available · ${Math.min(section.count, available)} will be randomly picked`}
                              </p>
                            )}
                            {!section.loadingPool && section.category && available === 0 && (
                              <p className="text-[10px] text-rose-500 font-semibold">No active questions in this category</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Selected Questions
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!section.category || section.loadingPool}
                              onClick={() => {
                                setCurrentSectionId(section.id);
                                setManualModalOpen(true);
                              }}
                              className="w-full justify-between"
                            >
                              <span>{section.selectedQuestions.length} Selected</span>
                              <span className="text-xs text-indigo-500">Edit Selection</span>
                            </Button>
                            {section.loadingPool && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading questions...
                              </p>
                            )}
                            {!section.loadingPool && available > 0 && (
                              <p className="text-[10px] font-semibold text-emerald-500">
                                {available} questions available to choose from
                              </p>
                            )}
                            {!section.loadingPool && section.category && available === 0 && (
                              <p className="text-[10px] text-rose-500 font-semibold">No active questions in this category</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Auto-select info */}
                      {section.mode === 'automatic' && available > 0 && (
                        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2.5">
                          <Shuffle className="w-4 h-4 text-indigo-500 shrink-0" />
                          <p className="text-xs text-indigo-600 dark:text-indigo-400">
                            <span className="font-bold">{Math.min(section.count, available)} questions</span> will be randomly auto-selected from the pool of {available} on save.
                          </p>
                        </div>
                      )}
                      {section.mode === 'manual' && (
                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            <span className="font-bold">{section.selectedQuestions.length} specific questions</span> selected for this section.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right: Advanced settings */}
        <div className="flex flex-col gap-6">
          <Card hover={false} className="p-6 flex flex-col gap-5">
            <h3 className="font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Advanced Controls</h3>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Negative Penalty</label>
                <p className="text-[10px] text-slate-400 mt-0.5">Deduct marks for wrong answers.</p>
              </div>
              <input type="checkbox" checked={negativeMarking} onChange={e => setNegativeMarking(e.target.checked)}
                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
            </div>
            {negativeMarking && (
              <Input label="Penalty Value" type="number" step="0.05" value={negativeMarkValue} onChange={e => setNegativeMarkValue(e.target.value)} />
            )}

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Randomize Questions</label>
                  <p className="text-[10px] text-slate-400 mt-0.5">Shuffle question order.</p>
                </div>
                <input type="checkbox" checked={randomizeQuestions} onChange={e => setRandomizeQuestions(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shuffle Options</label>
                  <p className="text-[10px] text-slate-400 mt-0.5">Scramble answer choices.</p>
                </div>
                <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Dynamic Generation</label>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px]">Each student gets a uniquely randomized set of questions generated on the fly.</p>
                </div>
                <input type="checkbox" checked={isDynamic} onChange={e => setIsDynamic(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1" />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">Start Date (Optional)</label>
                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">End Date (Optional)</label>
                <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none transition-all" />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Set Active</label>
                  <p className="text-[10px] text-slate-400 mt-0.5">Visible to students immediately.</p>
                </div>
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
              </div>
            </div>
          </Card>

          {/* Summary */}
          <Card hover={false} className="p-5 bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-500/20">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Test Summary</h4>
            <div className="space-y-2">
              {sections.map((s, i) => {
                const cat = categories.find(c => c._id === s.category);
                const pick = Math.min(s.count, s.pool.length);
                return (
                  <div key={s.id} className="flex justify-between text-xs">
                    <span className="text-slate-500">Section {i + 1}: {cat?.name || 'No category'}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{pick} Qs</span>
                  </div>
                );
              })}
              <div className="border-t border-indigo-500/20 pt-2 flex justify-between text-xs font-black">
                <span className="text-slate-700 dark:text-slate-300">Total Questions</span>
                <span className="text-indigo-600 dark:text-indigo-400">{totalSelected}</span>
              </div>
            </div>
          </Card>

          <Button variant="primary" type="submit" loading={loading} icon={Save} fullWidth className="font-bold py-3 shadow-indigo-500/10">
            {isEdit ? 'Save Changes' : 'Create Test'}
          </Button>
        </div>

      </form>

      {/* Manual Selection Modal */}
      <Modal isOpen={manualModalOpen} onClose={() => setManualModalOpen(false)} title="Select Questions Manually">
        {(() => {
          const s = sections.find(sec => sec.id === currentSectionId);
          if (!s) return null;
          return (
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
              <p className="text-sm text-slate-500">Select which questions to include in this section. ({s.selectedQuestions.length} selected)</p>
              {s.pool.map(q => (
                <div key={q._id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={s.selectedQuestions.includes(q._id)}
                    onChange={() => handleToggleQuestion(s.id, q._id)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-white" dangerouslySetInnerHTML={{ __html: q.questionText }}></p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {s.pool.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-8">No questions available in this category.</p>
              )}
            </div>
          );
        })()}
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={() => setManualModalOpen(false)} variant="primary">Done</Button>
        </div>
      </Modal>

    </div>
  );
};

export default CreateTest;
