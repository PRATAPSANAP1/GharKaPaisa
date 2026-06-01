import React from 'react';

const CardSkeleton = () => {
  return (
    <div className="p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm animate-pulse flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-md" />
        <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded-md" />
      </div>
      <div className="h-8 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-md mt-2" />
      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-md mt-1" />
      <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded-md mt-1" />
      <div className="flex gap-4 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded-md" />
        <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded-md" />
      </div>
    </div>
  );
};

export default CardSkeleton;

