import React from 'react';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

const EmptyState = ({
  icon: Icon = AlertCircle,
  title = 'No Data Available',
  description = 'There is nothing to display here right now.',
  action = null, // { text, onClick, icon }
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50/20 dark:bg-slate-900/10 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-5 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <Button
          variant="primary"
          icon={action.icon}
          onClick={action.onClick}
          size="md"
        >
          {action.text}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

