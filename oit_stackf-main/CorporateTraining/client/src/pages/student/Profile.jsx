import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Phone, BookOpen, GraduationCap, Calendar, Save, Edit2, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { loadUser } from '../../store/slices/authSlice';
import authService from '../../services/authService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    college: user?.college || 'OIT_STACK',
    branch: user?.branch || '',
    year: user?.year || '',
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name field cannot be left blank.');
      return;
    }

    try {
      setSaving(true);
      await authService.updateProfile(formData);
      toast.success('Profile details updated successfully!');

      dispatch(loadUser());
      setEditMode(false);
    } catch (err) {
      console.error('Update profile error:', err.message);
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white font-black">Student Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Avatar Details card */}
        <Card hover={false} className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/25 mb-4">
            {user?.name?.slice(0, 2)?.toUpperCase() || 'ST'}
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white truncate max-w-[220px]">{user?.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{user?.email}</p>
          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] uppercase font-bold text-slate-500 mt-3 select-none">
            {user?.role || 'Student'}
          </span>

          <div className="w-full border-t border-slate-50 dark:border-slate-800/80 mt-6 pt-5 flex flex-col gap-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>College: {user?.college || 'OIT_STACK'}</span>
            </div>
          </div>
        </Card>

        {/* Right Side: Profile Forms */}
        <Card hover={false} className="md:col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">Personal Academic Details</h3>
            <button
              onClick={() => {
                if (editMode) {
                  setFormData({
                    name: user?.name || '',
                    phone: user?.phone || '',
                    college: user?.college || 'OIT_STACK',
                    branch: user?.branch || '',
                    year: user?.year || '',
                  });
                }
                setEditMode(!editMode);
              }}
              className="inline-flex items-center text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
            >
              {editMode ? 'Cancel' : <><Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Profile</>}
            </button>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!editMode}
                icon={User}
                placeholder="Name"
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!editMode}
                icon={Phone}
                placeholder="Phone number"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Input
                label="College Name"
                value={formData.college}
                onChange={(e) => handleInputChange('college', e.target.value)}
                disabled={!editMode}
                icon={BookOpen}
                placeholder="e.g. OIT_STACK"
                className="sm:col-span-2"
              />
              <Input
                label="Academic Year"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                disabled={!editMode}
                icon={GraduationCap}
                placeholder="e.g. 4th Year"
              />
            </div>

            <Input
              label="Engineering Branch / Department"
              value={formData.branch}
              onChange={(e) => handleInputChange('branch', e.target.value)}
              disabled={!editMode}
              icon={GraduationCap}
              placeholder="e.g. Computer Science & Engineering"
            />

            {!editMode && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/40 flex gap-2 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                <ShieldAlert className="w-5 h-5 shrink-0 text-slate-400" />
                <p>
                  To change your registration email address or account role, please coordinate directly with the Placement Committee Office administrators.
                </p>
              </div>
            )}

            {editMode && (
              <div className="flex gap-3 justify-end mt-2">
                <Button
                  variant="primary"
                  type="submit"
                  loading={saving}
                  icon={Save}
                  className="font-bold py-2 px-6 shadow-blue-500/10"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

