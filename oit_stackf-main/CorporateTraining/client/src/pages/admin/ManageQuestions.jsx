import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, HelpCircle, FileDown, Trash2, Edit2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import TableSkeleton from '../../components/skeletons/TableSkeleton';

const APTITUDE_CATEGORIES = ['quantitative aptitude', 'verbal ability', 'logical reasoning'];

const ManageQuestions = ({ defaultCategoryName, hideHeader, group }) => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);

  const fetchQuestionsList = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 500,
        includeInactive: 'true'
      };
      if (selectedCategory) params.category = selectedCategory;
      if (difficulty) params.difficulty = difficulty;
      if (search) params.search = search;

      const res = await adminService.getQuestions(params);
      let list = res.data.questions || [];

      if (group) {
        list = list.filter(q => {
          const catName = (q.category?.name || '').toLowerCase();
          const isAptitude = APTITUDE_CATEGORIES.includes(catName);
          return group === 'aptitude' ? isAptitude : !isAptitude;
        });
      }

      setQuestions(list);
    } catch (err) {
      console.error('Error fetching questions:', err.message);
      toast.error('Failed to load questions pool');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await adminService.getCategories();
        let catData = res.data;
        if (group) {
          catData = catData.filter(c => {
            const isAptitude = APTITUDE_CATEGORIES.includes((c.name || '').toLowerCase());
            return group === 'aptitude' ? isAptitude : !isAptitude;
          });
        }
        
        const opts = catData.map(c => ({ label: c.name, value: c._id }));
        setCategories(opts);
        if (defaultCategoryName) {
          const match = catData.find(c => c.name.toLowerCase() === defaultCategoryName.toLowerCase());
          if (match) setSelectedCategory(match._id);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
  }, [defaultCategoryName]);

  useEffect(() => {
    fetchQuestionsList();
  }, [selectedCategory, difficulty, search]);

  const handleDeleteTrigger = (id) => {
    setTargetId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await adminService.deleteQuestion(targetId);
      toast.success('Question soft-deleted successfully.');
      setDeleteOpen(false);
      fetchQuestionsList();
    } catch (err) {
      console.error('Error deleting question:', err.message);
      toast.error('Failed to delete question.');
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    setImportErrors([]);
    if (!bulkJson.trim()) {
      toast.error('Please paste valid JSON questions array.');
      return;
    }

    try {
      setImporting(true);
      const parsed = JSON.parse(bulkJson);

      const res = await adminService.bulkImportQuestions({ questions: parsed });
      toast.success(res.message || `Successfully imported ${res.data?.importedCount || 0} questions!`);
      setBulkOpen(false);
      setBulkJson('');
      setImportErrors([]);
      fetchQuestionsList();
    } catch (err) {
      console.error('Bulk import error:', err);
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setImportErrors(err.response.data.errors);
        toast.error('Validation failed for some questions. Check details above the input.');
      } else {
        toast.error(err.response?.data?.message || 'Invalid JSON format or field validation error. Please review and try again.');
      }
    } finally {
      setImporting(false);
    }
  };

  const getDifficultyVariant = (diff) => {
    switch (diff) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'info';
    }
  };

  const sampleJson = `[
  {
    "question": "What is the time complexity of searching in a Hash Map in average case?",
    "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    "correctAnswer": 0,
    "explanation": "Hash table lookups are O(1) on average due to key hashing.",
    "difficulty": "easy",
    "category": "<paste_category_id_here>",
    "marks": 1,
    "timeLimit": 60,
    "type": "mcq"
  }
]`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Questions Repository</h1>
            {questions.length > 0 && (
              <p className="text-sm text-slate-400 mt-0.5">{questions.length} questions found</p>
            )}
          </div>
  
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={FileSpreadsheet}
              onClick={() => setBulkOpen(true)}
              className="font-bold text-xs"
            >
              Bulk Import JSON
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => navigate(`/admin/questions/add${selectedCategory ? `?category=${selectedCategory}` : ''}`)}
              className="font-bold text-xs"
            >
              Add Question
            </Button>
          </div>
        </div>
      )}

      {hideHeader && document.getElementById('admin-hub-actions')
        ? createPortal(
            <>
              <Button
                variant="outline"
                size="sm"
                icon={FileSpreadsheet}
                onClick={() => setBulkOpen(true)}
                className="font-bold text-xs"
              >
                Bulk Import JSON
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => navigate(`/admin/questions/add${selectedCategory ? `?category=${selectedCategory}` : ''}`)}
                className="font-bold text-xs"
              >
                Add Question
              </Button>
            </>,
            document.getElementById('admin-hub-actions')
          )
        : hideHeader && (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                icon={FileSpreadsheet}
                onClick={() => setBulkOpen(true)}
                className="font-bold text-xs"
              >
                Bulk Import JSON
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => navigate(`/admin/questions/add${selectedCategory ? `?category=${selectedCategory}` : ''}`)}
                className="font-bold text-xs"
              >
                Add Question
              </Button>
            </div>
          )}

      {/* Filters Card */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4" hover={false}>
        <SearchInput
          placeholder="Search by question text..."
          value={search}
          onChange={setSearch}
        />
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!defaultCategoryName && (
            <Select
              placeholder="All Categories"
              value={selectedCategory}
              options={categories}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-48"
            />
          )}
          <Select
            placeholder="All Difficulties"
            value={difficulty}
            options={[
              { label: 'Easy', value: 'easy' },
              { label: 'Medium', value: 'medium' },
              { label: 'Hard', value: 'hard' }
            ]}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Questions Pool"
          description="There are no MCQs matching your search keywords or category filters."
        />
      ) : (
        <div className="w-full flex flex-col gap-4">
          <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                  <th className="px-6 py-4">Question Text</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Difficulty</th>
                  <th className="px-6 py-4">Marks</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-200">
                {questions.map((row) => (
                  <tr
                    key={row._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <p className="text-slate-800 dark:text-white text-xs font-bold truncate max-w-[300px]" title={row.question}>
                        {row.question}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {row.category?.name || 'Aptitude'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getDifficultyVariant(row.difficulty)} size="sm">
                        {row.difficulty}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {row.marks} marks
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={row.isActive ? 'success' : 'gray'} size="sm">
                        {row.isActive ? 'Active' : 'Deleted'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit2}
                          onClick={() => navigate(`/admin/questions/edit/${row._id}`)}
                          className="py-1.5 px-3 font-bold text-xs"
                        >
                          Edit
                        </Button>
                        {row.isActive && (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDeleteTrigger(row._id)}
                            className="py-1.5 px-2 text-xs"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Question"
        message="Are you sure you want to soft-delete this question? It will not be assigned to future tests, but historical student results will still preserve it."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Bulk JSON Import Modal */}
      <Modal
        isOpen={bulkOpen}
        onClose={() => { setBulkOpen(false); setImportErrors([]); }}
        title="Bulk Import Questions (JSON)"
        size="lg"
      >
        <form onSubmit={handleBulkImport} className="flex flex-col gap-4">
          <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800/30 rounded-2xl">
            <p className="font-bold mb-1">JSON Template format:</p>
            <pre className="text-[10px] font-mono whitespace-pre overflow-x-auto text-slate-600 dark:text-slate-400 bg-slate-950/20 p-2.5 rounded-lg border border-slate-950/30 mt-1 max-h-[140px]">
              {sampleJson}
            </pre>
            <p className="mt-2 text-rose-500">
              * Note: Remember to paste valid Category and Subcategory Mongo IDs.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            {importErrors.length > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 text-xs mb-2">
                <p className="font-bold mb-1">Validation Errors:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {importErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Paste JSON Array
            </label>
            <textarea
              rows={8}
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder="[ { ... }, { ... } ]"
              className="w-full py-3 px-4 font-mono text-[11px] rounded-xl transition-all duration-300 bg-white dark:bg-slate-800 text-slate-950 dark:text-white border-2 border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3.5 mt-2">
            <Button variant="secondary" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={importing}
              className="font-bold px-6"
            >
              Start Import
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageQuestions;

