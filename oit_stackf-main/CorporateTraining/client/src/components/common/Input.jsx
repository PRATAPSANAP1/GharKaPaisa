import React from 'react';

const Input = ({
  label,
  type = 'text',
  error,
  icon: Icon,
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
        {Icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          className={`w-full py-2.5 rounded-xl text-sm transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 
            ${Icon ? 'pl-11' : 'pl-4'} pr-4
            ${error 
              ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
              : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-indigo-500'
            }
            focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 shadow-sm`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-rose-500 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;

