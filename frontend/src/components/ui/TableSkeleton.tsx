import React from 'react';

export interface TableSkeletonProps {
  /** Number of skeleton body rows to render. */
  rows?: number;
  /** Number of columns per row. Accepts a count or per-column width hints. */
  columns?: number | Array<string | number>;
  /** Optional className applied to the wrapping table element. */
  className?: string;
  /** Accessible label announced while loading. */
  label?: string;
}

const DEFAULT_COLUMN_WIDTHS = ['40%', '25%', '20%', '15%'];

function resolveWidths(columns: TableSkeletonProps['columns']): string[] {
  if (typeof columns === 'number') {
    const count = Math.max(1, columns);
    return Array.from({ length: count }, (_, index) => {
      const fallback = DEFAULT_COLUMN_WIDTHS[index % DEFAULT_COLUMN_WIDTHS.length];
      return fallback;
    });
  }

  if (Array.isArray(columns) && columns.length > 0) {
    return columns.map((width) =>
      typeof width === 'number' ? `${width}%` : width,
    );
  }

  return DEFAULT_COLUMN_WIDTHS;
}

/**
 * Unified skeleton loader for tabular data.
 *
 * Renders configurable pulse rows whose column widths mirror the table header
 * layout, using the shared surface design tokens for consistent theming.
 */
export function TableSkeleton({
  rows = 5,
  columns = DEFAULT_COLUMN_WIDTHS.length,
  className = '',
  label = 'Loading table data',
}: TableSkeletonProps) {
  const widths = resolveWidths(columns);
  const rowCount = Math.max(0, rows);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className="w-full"
    >
      <table className={`w-full border-collapse ${className}`.trim()}>
        <thead>
          <tr>
            {widths.map((width, columnIndex) => (
              <th
                key={`head-${columnIndex}`}
                scope="col"
                className="px-4 py-3 text-left"
              >
                <span
                  className="block h-3 animate-pulse rounded bg-surface-200"
                  style={{ width }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="border-t border-surface-200">
              {widths.map((width, columnIndex) => (
                <td key={`cell-${rowIndex}-${columnIndex}`} className="px-4 py-3">
                  <span
                    className="block h-3 animate-pulse rounded bg-surface-200"
                    style={{ width }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableSkeleton;
