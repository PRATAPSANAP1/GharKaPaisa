import React from 'react';
import Pagination from './Pagination';
import TableSkeleton from '../skeletons/TableSkeleton';
import EmptyState from './EmptyState';
import { ArrowUpDown, FileText } from 'lucide-react';

const Table = ({
  columns = [],
  data = [],
  loading = false,
  pagination = null, // { page, totalPages, onPageChange }
  onSort = null,
  emptyMessage = 'No records found',
  className = '',
}) => {
  return (
    <div className={`w-full flex flex-col gap-4 ${className}`}>
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                  className={`px-6 py-4 select-none ${col.sortable ? 'cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <ArrowUpDown className="w-3.5 h-3.5" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8">
                  <div className="flex flex-col gap-4 animate-pulse">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="flex gap-4 h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                    ))}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-slate-400" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row._id || row.id || rowIdx}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 font-medium whitespace-nowrap">
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-end pr-2">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default Table;

