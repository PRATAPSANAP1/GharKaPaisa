import React from 'react';

const Select = ({
  label,
  options = [], // [{ label, value }]
  value,
  onChange,
  error,
  placeholder,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className={`flex flex-col w-full gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`w-full py-2.5 px-4 rounded-xl text-sm transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 appearance-none
            ${error 
              ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
              : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-indigo-500'
            }
            focus:outline-none shadow-sm`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-xs text-rose-500 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;

