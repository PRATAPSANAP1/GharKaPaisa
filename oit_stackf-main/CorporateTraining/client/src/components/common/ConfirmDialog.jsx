import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
      btn: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
    },
    warning: {
      icon: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
      btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    },
    info: {
      icon: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      btn: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    },
  };

  const v = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in border border-gray-200/50 dark:border-slate-700/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${v.icon} shrink-0`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 ${v.btn}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

