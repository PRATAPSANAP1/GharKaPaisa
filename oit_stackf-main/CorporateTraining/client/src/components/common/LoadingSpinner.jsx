import React from 'react';

const LoadingSpinner = ({ size = 'md', text }) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className={`${sizeMap[size]} rounded-full border-[3px] border-gray-200 dark:border-slate-700`} />
        <div className={`absolute top-0 left-0 ${sizeMap[size]} rounded-full border-[3px] border-transparent border-t-indigo-500 border-r-purple-500 animate-spin`} />
      </div>
      {text && <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;

