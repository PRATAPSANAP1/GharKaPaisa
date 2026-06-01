import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Code2, Trash2, Edit2, AlertCircle, Award } from 'lucide-react';
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

const ManageCodingProblems = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);

  const fetchProblemsList = async () => {
    try {
      setLoading(true);
      const params = { includeInactive: 'true' };
      if (selectedCategory) params.category = selectedCategory;
      if (difficulty) params.difficulty = difficulty;

      const res = await adminService.getCodingProblems(params);
      let list = res.data.problems || [];

      if (search) {
        list = list.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
      }

      setProblems(list);
    } catch (err) {
      console.error('Error fetching coding problems:', err.message);
      toast.error('Failed to load coding problems');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await adminService.getCategories({ type: 'coding' });
        const opts = res.data.map(c => ({ label: c.name, value: c._id }));
        setCategories(opts);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    fetchProblemsList();
  }, [selectedCategory, difficulty, search]);

  const handleDeleteTrigger = (id) => {
    setTargetId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await adminService.deleteCodingProblem(targetId);
      toast.success('Coding challenge deleted successfully.');
      setDeleteOpen(false);
      fetchProblemsList();
    } catch (err) {
      console.error('Error deleting coding problem:', err.message);
      toast.error('Failed to delete coding problem.');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Coding Problems</h1>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={PlusCircle}
          onClick={() => navigate('/admin/coding/add')}
          className="font-bold text-xs"
        >
          Add Problem
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4" hover={false}>
        <SearchInput
          placeholder="Search by problem title..."
          value={search}
          onChange={setSearch}
        />
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            placeholder="All Categories"
            value={selectedCategory}
            options={categories}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-48"
          />
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
        <TableSkeleton rows={4} cols={5} />
      ) : problems.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Coding Problems"
          description="There are no programming challenges matching your search filters."
        />
      ) : (
        <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                <th className="px-6 py-4">Problem Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">Points</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-200">
              {problems.map((row) => (
                <tr
                  key={row._id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200"
                >
                  <td className="px-6 py-4">
                    <p className="text-slate-800 dark:text-white text-sm font-bold truncate max-w-[200px]" title={row.title}>
                      {row.title}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {row.category?.name || 'Coding'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getDifficultyVariant(row.difficulty)} size="sm">
                      {row.difficulty}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-indigo-500 dark:text-indigo-400">
                    <span className="flex items-center gap-1"><Award className="w-4 h-4" /> {row.points} pts</span>
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
                        onClick={() => navigate(`/admin/coding/edit/${row._id}`)}
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
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Coding Problem"
        message="Are you sure you want to delete this coding problem? It will be removed from the list for students, but past submissions will be preserved."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default ManageCodingProblems;

