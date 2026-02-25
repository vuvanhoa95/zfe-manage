'use client';

import { useState } from 'react';

interface TechnicalTableColumn {
  key: string;
  label: string;
  technical?: boolean; // Use monospace font
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface TechnicalTableProps<T> {
  columns: TechnicalTableColumn[];
  data: T[];
  technicalColumns?: string[]; // Column keys that should use monospace
  showRowNumbers?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
}

export default function TechnicalTable<T extends Record<string, any>>({
  columns,
  data,
  technicalColumns = [],
  showRowNumbers = false,
  className = '',
  onRowClick,
}: TechnicalTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;

    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (aVal === bVal) return 0;

    const comparison = aVal < bVal ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const isTechnicalColumn = (columnKey: string) => {
    return technicalColumns.includes(columnKey) || columns.find((c) => c.key === columnKey)?.technical;
  };

  return (
    <div className={`overflow-x-auto border-technical rounded-lg ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zf-primary">
          {showRowNumbers && (
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-b border-zf-graphite/15">
              #
            </th>
          )}
          {columns.map((column) => (
            <th
              key={column.key}
              className={`px-4 py-3 text-xs font-medium text-white uppercase tracking-wider border-b border-zf-graphite/15 ${
                column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
              } ${column.sortable ? 'cursor-pointer hover:bg-zf-primary-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent' : ''}`}
              onClick={() => column.sortable && handleSort(column.key)}
              onKeyDown={(e) => {
                if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleSort(column.key);
                }
              }}
              tabIndex={column.sortable ? 0 : undefined}
              aria-label={column.sortable ? `${column.label}. Click to sort. ${sortColumn === column.key ? `Sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'Not sorted'}` : column.label}
              role={column.sortable ? 'button' : undefined}
            >
              <div className="flex items-center gap-2">
                <span>{column.label}</span>
                {column.sortable && sortColumn === column.key && (
                  <span className="text-xs font-technical" aria-hidden="true">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
          ))}
        </tr>
        </thead>
        <tbody className="divide-y divide-zf-graphite/10">
          {sortedData.map((row, index) => (
            <tr
              key={index}
              className={`hover:bg-zf-bg-secondary transition-colors ${onRowClick ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent' : ''}`}
              onClick={() => onRowClick?.(row)}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              aria-label={onRowClick ? `Row ${index + 1}. Press Enter to select.` : undefined}
            >
              {showRowNumbers && (
                <td className="px-4 py-3 text-sm text-technical-secondary font-technical">
                  {index + 1}
                </td>
              )}
              {columns.map((column) => {
                const isTechnical = isTechnicalColumn(column.key);
                const cellValue = row[column.key];
                
                return (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-sm ${
                      isTechnical ? 'font-technical text-technical-primary' : 'text-zf-graphite'
                    } ${
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {cellValue ?? '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
