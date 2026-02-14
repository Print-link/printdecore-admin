import { ReactNode } from 'react';
import '../styles/table.css';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  render?: (value: any, row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export const DataTable = <T extends { _id: string }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available',
}: DataTableProps<T>) => {
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const getCellValue = (column: Column<T>, row: T) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  };

  return (
    <div className="table-container">
      <table className="table">
        <thead className="table-header">
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="table-body">
          {data.map((row, rowIndex) => (
            <tr key={row._id} className="table-row">
              {columns.map((column, colIndex) => {
                const value = getCellValue(column, row);
                return (
                  <td key={colIndex} className="table-cell">
                    {column.render ? column.render(value, row) : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

