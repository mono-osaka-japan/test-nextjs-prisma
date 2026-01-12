"use client";

import { type ReactNode, type ThHTMLAttributes, type TdHTMLAttributes } from "react";

// Table Container
export interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

// Table Header
export function TableHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <thead className={`bg-gray-50 dark:bg-gray-800 ${className}`}>{children}</thead>;
}

// Table Body
export function TableBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>{children}</tbody>;
}

// Table Row
export interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function TableRow({ children, className = "", onClick, hoverable = true }: TableRowProps) {
  return (
    <tr
      className={`
        ${hoverable ? "hover:bg-gray-50 dark:hover:bg-gray-800/50" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

// Table Header Cell
export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  sortable?: boolean;
  sorted?: "asc" | "desc" | false;
  onSort?: () => void;
}

export function TableHead({ children, className = "", sortable, sorted, onSort, ...props }: TableHeadProps) {
  return (
    <th
      className={`
        px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider
        ${sortable ? "cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300" : ""}
        ${className}
      `}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <span className="text-gray-400">
            {sorted === "asc" && "↑"}
            {sorted === "desc" && "↓"}
            {!sorted && "↕"}
          </span>
        )}
      </div>
    </th>
  );
}

// Table Data Cell
export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export function TableCell({ children, className = "", ...props }: TableCellProps) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${className}`} {...props}>
      {children}
    </td>
  );
}

// Empty State
export function TableEmpty({ message = "データがありません", colSpan }: { message?: string; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
        {message}
      </td>
    </tr>
  );
}
