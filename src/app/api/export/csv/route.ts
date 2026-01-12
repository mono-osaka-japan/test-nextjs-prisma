/**
 * @file CSV出力API
 * @description スクレイピング結果をCSV形式でエクスポートするAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';
import { getJob } from '@/lib/queue/scraping-queue';

// ============================================
// Validation Schemas
// ============================================

const exportSchema = z.object({
  jobId: z.string().optional(),
  data: z.array(z.record(z.string(), z.unknown())).optional(),
  columns: z.array(z.string()).optional(),
  filename: z.string().default('export'),
  delimiter: z.enum([',', ';', '\t']).default(','),
  includeHeader: z.boolean().default(true),
  encoding: z.enum(['utf-8', 'shift-jis']).default('utf-8'),
});

// ============================================
// Utility Functions
// ============================================

/**
 * 値をCSVセーフな文字列に変換
 */
function escapeCSVValue(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // ダブルクォート、改行、デリミタを含む場合はエスケープ
  if (str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes(delimiter)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * データ配列をCSV文字列に変換
 */
function convertToCSV(
  data: Record<string, unknown>[],
  options: {
    columns?: string[];
    delimiter: string;
    includeHeader: boolean;
  }
): string {
  if (data.length === 0) {
    return '';
  }

  // カラムを決定（指定がなければ最初のオブジェクトのキーを使用）
  const columns = options.columns || Object.keys(data[0]);
  const lines: string[] = [];

  // ヘッダー行
  if (options.includeHeader) {
    lines.push(columns.map((col) => escapeCSVValue(col, options.delimiter)).join(options.delimiter));
  }

  // データ行
  for (const row of data) {
    const values = columns.map((col) => escapeCSVValue(row[col], options.delimiter));
    lines.push(values.join(options.delimiter));
  }

  return lines.join('\r\n');
}

/**
 * UTF-8からShift-JISに変換（簡易版）
 * 注: 本番環境ではiconvなどのライブラリを使用することを推奨
 */
async function convertToShiftJIS(text: string): Promise<Uint8Array> {
  // Node.js環境ではTextEncoderを使用
  // Shift-JISへの変換はブラウザと異なる処理が必要
  // 簡易実装としてUTF-8をそのまま返す（本番ではiconv-liteを使用）
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

// ============================================
// POST /api/export/csv
// ============================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const options = exportSchema.parse(body);

    // データソースを決定
    let exportData: Record<string, unknown>[] = [];

    if (options.data && options.data.length > 0) {
      exportData = options.data;
    } else if (options.jobId) {
      const job = await getJob(options.jobId);

      if (!job) {
        return NextResponse.json(
          { error: 'ジョブが見つかりません' },
          { status: 404 }
        );
      }

      const result = job.returnvalue;
      if (!result?.result?.data) {
        return NextResponse.json(
          { error: 'ジョブにデータがありません' },
          { status: 400 }
        );
      }

      // 抽出データをフラットな配列に変換
      const extractedData = result.result.data;

      for (const [key, value] of Object.entries(extractedData)) {
        if (Array.isArray(value)) {
          exportData.push(
            ...value.map((item) => ({
              _source: key,
              ...(typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : { value: item }),
            }))
          );
        } else if (typeof value === 'object' && value !== null) {
          exportData.push({ _source: key, ...(value as Record<string, unknown>) });
        } else {
          exportData.push({ _source: key, value });
        }
      }
    } else {
      return NextResponse.json(
        { error: 'dataまたはjobIdのいずれかを指定してください' },
        { status: 400 }
      );
    }

    if (exportData.length === 0) {
      return NextResponse.json(
        { error: 'エクスポートするデータがありません' },
        { status: 400 }
      );
    }

    // CSVに変換
    const csvContent = convertToCSV(exportData, {
      columns: options.columns,
      delimiter: options.delimiter,
      includeHeader: options.includeHeader,
    });

    // エンコーディング処理
    let contentBytes: Uint8Array;
    let charset: string;

    if (options.encoding === 'shift-jis') {
      contentBytes = await convertToShiftJIS(csvContent);
      charset = 'Shift_JIS';
    } else {
      // UTF-8の場合はBOMを付与
      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const encoder = new TextEncoder();
      const content = encoder.encode(csvContent);
      contentBytes = new Uint8Array(bom.length + content.length);
      contentBytes.set(bom);
      contentBytes.set(content, bom.length);
      charset = 'UTF-8';
    }

    // ファイル名を生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${options.filename}_${timestamp}.csv`;

    // レスポンスを返す
    return new NextResponse(contentBytes.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': `text/csv; charset=${charset}`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(contentBytes.length),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to export CSV:', error);
    return NextResponse.json(
      { error: 'CSVエクスポートに失敗しました' },
      { status: 500 }
    );
  }
}
