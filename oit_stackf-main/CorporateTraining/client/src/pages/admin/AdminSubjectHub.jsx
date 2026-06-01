import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ManageTests from './ManageTests';
import ManageQuestions from './ManageQuestions';
import { Brain, Calculator, AlignLeft, Shapes, Terminal, BookOpen, Mic } from 'lucide-react';

const subjectMap = {
  'math': { label: 'Math', icon: Calculator, defaultCategory: 'Quantitative Aptitude' },
  'verbal': { label: 'Verbal', icon: AlignLeft, defaultCategory: 'Verbal Ability' },
  'non-verbal': { label: 'Non-Verbal', icon: Shapes, defaultCategory: 'Logical Reasoning' },
  'mcq': { label: 'MCQ Tests', icon: BookOpen, defaultCategory: null }, 
  'interview': { label: 'Interview', icon: Mic, defaultCategory: 'Interview' }, 
};

const AdminSubjectHub = ({ group }) => {
  const { subject } = useParams();
  const [activeTab, setActiveTab] = useState('tests');

  if (group === 'technical' && (!subject || !subjectMap[subject])) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const info = group === 'aptitude' 
    ? { label: 'Aptitude Hub', icon: Brain, defaultCategory: null } 
    : subjectMap[subject];

  const Icon = info.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* Header removed as requested */}
      <div className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex">
        <button
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'tests' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('tests')}
        >
          Tests
        </button>
        <button
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'questions' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('questions')}
        >
          Questions Pool
        </button>
        </div>
        <div id="admin-hub-actions" className="flex items-center gap-3 pb-2 pr-2"></div>
      </div>

      <div className="mt-2">
        {activeTab === 'tests' && (
          <ManageTests defaultCategoryName={info.defaultCategory} hideHeader={true} group={group} />
        )}
        {activeTab === 'questions' && (
          <ManageQuestions defaultCategoryName={info.defaultCategory} hideHeader={true} group={group} />
        )}
      </div>
    </div>
  );
};

export default AdminSubjectHub;
