import React from 'react';
import { MdBuild } from 'react-icons/md';

export default function ComingSoonModule({ title }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
        <MdBuild size={40} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-md">
        This enterprise module is currently under construction as part of the Phase 2+ rollout.
      </p>
    </div>
  );
}
