import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, ClipboardList, Clock, HelpCircle, ToggleLeft, ToggleRight, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TableSkeleton from '../../components/skeletons/TableSkeleton';

const APTITUDE_CATEGORIES = ['quantitative aptitude', 'verbal ability', 'logical reasoning'];

const ManageTests = ({ defaultCategoryName, hideHeader, group }) => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);

  const fetchTestsList = async () => {
    try {
      setLoading(true);
      const params = { includeInactive: 'true' };
      if (selectedCategory) params.category = selectedCategory;
      if (difficulty) params.difficulty = difficulty;

      const res = await adminService.getTests(params);
      let list = res.data || [];

      if (search) {
        list = list.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
      }

      if (group) {
        list = list.filter(t => {
          const catName = (t.category?.name || '').toLowerCase();
          const isAptitude = APTITUDE_CATEGORIES.includes(catName);
          return group === 'aptitude' ? isAptitude : !isAptitude;
        });
      }

      setTests(list);
    } catch (err) {
      console.error('Error fetching tests:', err.message);
      toast.error('Failed to load placement tests list');
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
    fetchTestsList();
  }, [selectedCategory, difficulty, search]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await adminService.toggleTestStatus(id, !currentStatus);
      toast.success(`Test status toggled to ${!currentStatus ? 'Active' : 'Inactive'}.`);
      fetchTestsList();
    } catch (err) {
      console.error('Error toggling test status:', err.message);
      toast.error('Failed to modify test active status.');
    }
  };

  const handleDeleteTrigger = (id) => {
    setTargetId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await adminService.deleteTest(targetId);
      toast.success('Test soft-deleted successfully.');
      setDeleteOpen(false);
      fetchTestsList();
    } catch (err) {
      console.error('Error deleting test:', err.message);
      toast.error('Failed to delete test.');
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Active Placement Tests</h1>
          </div>
  
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => navigate(`/admin/tests/create${selectedCategory ? `?category=${selectedCategory}` : ''}`)}
            className="font-bold text-xs"
          >
            Create Test
          </Button>
        </div>
      )}

      {/* When hideHeader is true, we render the button into the AdminSubjectHub's portal if it exists */}
      {hideHeader && document.getElementById('admin-hub-actions')
        ? createPortal(
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => navigate(`/admin/tests/create${selectedCategory ? `?category=${selectedCategory}` : ''}`)}
              className="font-bold text-xs"
            >
              Create Test
            </Button>,
            document.getElementById('admin-hub-actions')
          )
        : hideHeader && (
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => navigate(`/admin/tests/create${selectedCategory ? `?category=${selectedCategory}` : ''}`)}
                className="font-bold text-xs"
              >
                Create Test
              </Button>
            </div>
          )}

      {/* Filters Card */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4" hover={false}>
        <SearchInput
          placeholder="Search by test name..."
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
              { label: 'Hard', value: 'hard' },
              { label: 'Mixed', value: 'mixed' }
            ]}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : tests.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Tests Configured"
          description="There are no timed test sessions matching your search query or categories."
        />
      ) : (
        <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                <th className="px-6 py-4">Test Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Questions</th>
                <th className="px-6 py-4 text-center">Duration</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-200">
              {tests.map((row) => (
                <tr
                  key={row._id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200"
                >
                  <td className="px-6 py-4">
                    <p className="text-slate-800 dark:text-white text-sm font-bold truncate max-w-[200px]" title={row.name}>
                      {row.name}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {row.category?.name || 'Aptitude'}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                    <span className="flex items-center justify-center gap-1.5"><HelpCircle className="w-4 h-4 text-slate-400" /> {row.questions?.length || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                    <span className="flex items-center justify-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {row.totalTime} mins</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getDifficultyVariant(row.difficulty)} size="sm">
                      {row.difficulty}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(row._id, row.isActive)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                      title="Toggle active status"
                    >
                      {row.isActive ? (
                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit2}
                        onClick={() => navigate(`/admin/tests/edit/${row._id}`)}
                        className="py-1.5 px-3 font-bold text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDeleteTrigger(row._id)}
                        className="py-1.5 px-2 text-xs"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Test Session"
        message="Are you sure you want to soft-delete this test session? Students will no longer see it, but their past attempt history remains intact."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default ManageTests;

