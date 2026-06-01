import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  delay = 400,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(value);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onChange) {
        onChange(searchTerm);
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [searchTerm, delay]);

  const handleClear = () => {
    setSearchTerm('');
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className={`relative flex items-center w-full max-w-md ${className}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2.5 pl-11 pr-10 rounded-xl text-sm transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;

