import React from 'react';

const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full flex flex-col gap-4 animate-pulse">
      <div className="w-full h-12 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800" />
      <div className="w-full flex flex-col gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex gap-4 items-center justify-between py-2.5">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className={`h-4 bg-slate-100 dark:bg-slate-800 rounded-md ${cIdx === 0 ? 'w-1/3' : 'w-1/6'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;

