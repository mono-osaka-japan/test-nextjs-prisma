'use client';

import { useState, useCallback, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export type ExportFormat = 'csv' | 'json' | 'xlsx';

export interface ExportColumn {
  key: string;
  label: string;
  selected: boolean;
}

export interface ExportConfig {
  format: ExportFormat;
  columns: ExportColumn[];
  includeHeader: boolean;
  dateFormat: string;
  encoding: 'utf-8' | 'shift-jis';
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableColumns: ExportColumn[];
  data?: Record<string, unknown>[];
  onExport?: (config: ExportConfig) => Promise<Blob>;
  filename?: string;
}

const formatOptions: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'csv', label: 'CSV', description: 'カンマ区切りテキスト' },
  { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
  { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel形式' },
];

const dateFormatOptions = [
  { value: 'YYYY-MM-DD', label: '2024-01-15' },
  { value: 'YYYY/MM/DD', label: '2024/01/15' },
  { value: 'DD/MM/YYYY', label: '15/01/2024' },
  { value: 'MM/DD/YYYY', label: '01/15/2024' },
];

const encodingOptions = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'shift-jis', label: 'Shift-JIS (Windows/Excel)' },
];

export function ExportModal({
  isOpen,
  onClose,
  availableColumns,
  data = [],
  onExport,
  filename = 'export',
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [columns, setColumns] = useState<ExportColumn[]>(availableColumns);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [encoding, setEncoding] = useState<'utf-8' | 'shift-jis'>('utf-8');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync columns when availableColumns or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setColumns(availableColumns);
      setError(null);
    }
  }, [isOpen, availableColumns]);

  // Check if format requires onExport handler
  const requiresCustomHandler = format === 'xlsx';
  const canExport = !requiresCustomHandler || !!onExport;

  const toggleColumn = useCallback((key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, selected: !col.selected } : col
      )
    );
  }, []);

  const selectAllColumns = useCallback(() => {
    setColumns((prev) => prev.map((col) => ({ ...col, selected: true })));
  }, []);

  const deselectAllColumns = useCallback(() => {
    setColumns((prev) => prev.map((col) => ({ ...col, selected: false })));
  }, []);

  const selectedCount = columns.filter((c) => c.selected).length;

  const handleExport = async () => {
    if (selectedCount === 0) {
      setError('少なくとも1つの列を選択してください');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const config: ExportConfig = {
        format,
        columns,
        includeHeader,
        dateFormat,
        encoding,
      };

      let blob: Blob;

      if (onExport) {
        blob = await onExport(config);
      } else {
        // Default generation based on format
        const selectedCols = columns.filter((c) => c.selected);

        if (format === 'json') {
          // JSON generation
          const jsonData = data.map((item) => {
            const obj: Record<string, unknown> = {};
            for (const col of selectedCols) {
              obj[col.key] = item[col.key];
            }
            return obj;
          });
          blob = new Blob([JSON.stringify(jsonData, null, 2)], {
            type: 'application/json;charset=utf-8',
          });
        } else if (format === 'xlsx') {
          // Excel format requires custom handler
          throw new Error('Excel形式のエクスポートにはonExportハンドラが必要です');
        } else {
          // CSV generation
          const rows: string[] = [];

          if (includeHeader) {
            rows.push(selectedCols.map((c) => c.label).join(','));
          }

          for (const item of data) {
            const row = selectedCols
              .map((col) => {
                const value = item[col.key];
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && value.includes(',')) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return String(value);
              })
              .join(',');
            rows.push(row);
          }

          const csvContent = rows.join('\n');
          const bom = encoding === 'utf-8' ? '\uFEFF' : '';
          blob = new Blob([bom + csvContent], {
            type: 'text/csv;charset=' + encoding,
          });
        }
      }

      // Download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'エクスポートに失敗しました'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="データエクスポート" size="lg">
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            出力形式
          </label>
          <div className="grid grid-cols-3 gap-3">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value)}
                className={`rounded-lg border-2 p-3 text-left transition-colors ${
                  format === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                }`}
              >
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {option.label}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Column Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              エクスポートする列 ({selectedCount}/{columns.length})
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllColumns}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                すべて選択
              </button>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <button
                type="button"
                onClick={deselectAllColumns}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                すべて解除
              </button>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            {columns.map((column) => (
              <label
                key={column.key}
                className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2 last:border-b-0 cursor-pointer hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={column.selected}
                  onChange={() => toggleColumn(column.key)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {column.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4">
          {/* Date Format */}
          <div>
            <label
              htmlFor="date-format"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              日付形式
            </label>
            <select
              id="date-format"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {dateFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Encoding (only for CSV) */}
          {format === 'csv' && (
            <div>
              <label
                htmlFor="encoding"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                文字エンコーディング
              </label>
              <select
                id="encoding"
                value={encoding}
                onChange={(e) =>
                  setEncoding(e.target.value as 'utf-8' | 'shift-jis')
                }
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {encodingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Include Header */}
        {format !== 'json' && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHeader}
              onChange={(e) => setIncludeHeader(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              ヘッダー行を含める
            </span>
          </label>
        )}

        {/* Preview Info */}
        <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-medium">{data.length}</span> 件のデータを
            <span className="font-medium"> {format.toUpperCase()} </span>
            形式でエクスポートします
          </div>
        </div>

        {/* Excel format warning */}
        {requiresCustomHandler && !onExport && (
          <div className="rounded-lg bg-yellow-100 p-3 text-sm text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            Excel形式は現在利用できません。CSV または JSON を選択してください。
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <Button variant="secondary" onClick={onClose}>
          キャンセル
        </Button>
        <Button
          variant="primary"
          onClick={handleExport}
          isLoading={isExporting}
          disabled={selectedCount === 0 || !canExport}
        >
          エクスポート
        </Button>
      </div>
    </Modal>
  );
}
