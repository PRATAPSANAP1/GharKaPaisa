import React, { useEffect, useState } from 'react';
import { PlusCircle, FolderTree, Edit2, Trash2, AlertCircle, Folder, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEditMode, setCatEditMode] = useState(false);
  const [catId, setCatId] = useState(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState('aptitude');
  const [catSaving, setCatSaving] = useState(false);

  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subEditMode, setSubEditMode] = useState(false);
  const [subId, setSubId] = useState(null);
  const [subName, setSubName] = useState('');
  const [subSaving, setSubSaving] = useState(false);

  const [activeParent, setActiveParent] = useState('');

  const [deleteCatOpen, setDeleteCatOpen] = useState(false);
  const [deleteSubOpen, setDeleteSubOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);

  const fetchCategoriesList = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCategories();
      const list = res.data || [];
      setCategories(list);
      if (list.length > 0 && !activeParent) {
        setActiveParent(list[0]._id);
      }
    } catch (err) {
      console.error('Error fetching categories:', err.message);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategoriesList = async (parentId) => {
    if (!parentId) return;
    try {
      setLoadingSubs(true);
      const res = await adminService.getSubcategories(parentId);
      setSubcategories(res.data || []);
    } catch (err) {
      console.error('Error fetching subcategories:', err.message);
      toast.error('Failed to load subcategories');
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    fetchCategoriesList();
  }, []);

  useEffect(() => {
    if (activeParent) {
      fetchSubcategoriesList(activeParent);
    }
  }, [activeParent]);

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error('Category name is required.');
      return;
    }

    const payload = {
      name: catName.trim(),
      type: catType,
    };

    try {
      setCatSaving(true);
      if (catEditMode) {
        await adminService.updateCategory(catId, payload);
        toast.success('Category updated successfully!');
      } else {
        await adminService.createCategory(payload);
        toast.success('Category created successfully!');
      }
      setCatModalOpen(false);
      fetchCategoriesList();
    } catch (err) {
      console.error('Error saving category:', err.message);
      toast.error(err.response?.data?.message || 'Error saving category.');
    } finally {
      setCatSaving(false);
    }
  };

  const handleEditCategoryTrigger = (cat) => {
    setCatId(cat._id);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatEditMode(true);
    setCatModalOpen(true);
  };

  const handleDeleteCategoryTrigger = (id) => {
    setTargetId(id);
    setDeleteCatOpen(true);
  };

  const handleConfirmDeleteCategory = async () => {
    try {
      await adminService.deleteCategory(targetId);
      toast.success('Category deleted successfully.');
      setDeleteCatOpen(false);
      fetchCategoriesList();
      if (activeParent === targetId) {
        setActiveParent('');
      }
    } catch (err) {
      console.error('Delete category error:', err.message);
      toast.error(err.response?.data?.message || 'Failed to delete category.');
      setDeleteCatOpen(false);
    }
  };

  const handleSaveSubcategory = async (e) => {
    e.preventDefault();
    if (!subName.trim()) {
      toast.error('Subcategory name is required.');
      return;
    }

    const payload = {
      name: subName.trim(),
    };

    try {
      setSubSaving(true);
      if (subEditMode) {
        await adminService.updateSubcategory(subId, payload);
        toast.success('Subcategory updated successfully!');
      } else {
        await adminService.createSubcategory(activeParent, payload);
        toast.success('Subcategory created successfully!');
      }
      setSubModalOpen(false);
      fetchSubcategoriesList(activeParent);
    } catch (err) {
      console.error('Error saving subcategory:', err.message);
      toast.error(err.response?.data?.message || 'Error saving subcategory.');
    } finally {
      setSubSaving(false);
    }
  };

  const handleEditSubcategoryTrigger = (sub) => {
    setSubId(sub._id);
    setSubName(sub.name);
    setSubEditMode(true);
    setSubModalOpen(true);
  };

  const handleDeleteSubcategoryTrigger = (id) => {
    setTargetId(id);
    setDeleteSubOpen(true);
  };

  const handleConfirmDeleteSubcategory = async () => {
    try {
      await adminService.deleteSubcategory(targetId);
      toast.success('Subcategory deleted successfully.');
      setDeleteSubOpen(false);
      fetchSubcategoriesList(activeParent);
    } catch (err) {
      console.error('Delete subcategory error:', err.message);
      toast.error(err.response?.data?.message || 'Failed to delete subcategory.');
      setDeleteSubOpen(false);
    }
  };

  if (loading && categories.length === 0) return <Loader />;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Category Directory</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Left Side: Categories grid */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider">Parent Categories</h3>
            <Button
              variant="outline"
              size="sm"
              icon={PlusCircle}
              onClick={() => {
                setCatName('');
                setCatType('aptitude');
                setCatEditMode(false);
                setCatModalOpen(true);
              }}
              className="text-xs py-1.5 px-3 font-bold"
            >
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {categories.map((cat) => {
              const isActiveNode = activeParent === cat._id;
              return (
                <Card
                  key={cat._id}
                  onClick={() => setActiveParent(cat._id)}
                  className={`p-5 flex flex-col justify-between border-2 cursor-pointer transition-all duration-200 ${
                    isActiveNode
                      ? 'border-indigo-500 bg-indigo-50/10 dark:bg-slate-900/60'
                      : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200'
                  }`}
                  hover={!isActiveNode}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">{cat.name}</h4>
                        <p className="text-[10px] text-slate-400 capitalize mt-0.5">{cat.type} Type</p>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategoryTrigger(cat);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md"
                        title="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategoryTrigger(cat._id);
                        }}
                        className="p-1 text-rose-400 hover:text-rose-600 rounded-md"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>


                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Side: Subcategories table */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider">Granular Topics / Subcategories</h3>
            <Button
              variant="outline"
              size="sm"
              icon={PlusCircle}
              disabled={!activeParent}
              onClick={() => {
                setSubName('');
                setSubEditMode(false);
                setSubModalOpen(true);
              }}
              className="text-xs py-1.5 px-3 font-bold"
            >
              Add Topic
            </Button>
          </div>

          <Card hover={false} className="p-0 border-slate-100 dark:border-slate-800/80">
            {loadingSubs ? (
              <div className="py-24 flex justify-center">
                <Loader />
              </div>
            ) : !activeParent ? (
              <div className="py-24 text-center text-slate-400 text-xs">
                Select a parent category on the left to review its subcategories list.
              </div>
            ) : subcategories.length === 0 ? (
              <div className="py-24 text-center text-slate-400 text-xs">
                No subcategories found for this category. Add topics above.
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-3">Topic Title</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-200">
                    {subcategories.map((sub) => (
                      <tr key={sub._id} className="hover:bg-slate-50/20">
                        <td className="px-6 py-3 font-extrabold">{sub.name}</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleEditSubcategoryTrigger(sub)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategoryTrigger(sub._id)}
                              className="p-1 text-rose-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* Category Modal Dialog */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={catEditMode ? 'Modify Category' : 'Create Parent Category'}
        size="md"
      >
        <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
          <Input
            label="Category Title"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="e.g. Quantitative Aptitude"
          />

          <Select
            label="Platform Category Type"
            value={catType}
            options={[
              { label: 'Quantitative & Logical Aptitude', value: 'aptitude' },
              { label: 'Technical Core MCQ Subjects', value: 'technical' },
              { label: 'Coding Problems', value: 'coding' }
            ]}
            onChange={(e) => setCatType(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCatModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={catSaving} className="font-bold px-6 shadow-indigo-500/10">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Subcategory Modal Dialog */}
      <Modal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        title={subEditMode ? 'Modify Topic' : 'Add Granular Topic'}
        size="md"
      >
        <form onSubmit={handleSaveSubcategory} className="flex flex-col gap-4">
          <Input
            label="Topic Title"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            placeholder="e.g. Speed, Time & Distance"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setSubModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={subSaving} className="font-bold px-6 shadow-indigo-500/10">
              Save Topic
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmations */}
      <ConfirmDialog
        isOpen={deleteCatOpen}
        onClose={() => setDeleteCatOpen(false)}
        onConfirm={handleConfirmDeleteCategory}
        title="Delete Category"
        message="Are you sure you want to permanently delete this parent category and all its topics? Note that the system blocks deletion if active questions or tests exist."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={deleteSubOpen}
        onClose={() => setDeleteSubOpen(false)}
        onConfirm={handleConfirmDeleteSubcategory}
        title="Delete Topic"
        message="Are you sure you want to delete this subcategory/topic?"
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default ManageCategories;

