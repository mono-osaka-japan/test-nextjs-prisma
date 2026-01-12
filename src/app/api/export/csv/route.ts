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
  // NOTE: Shift-JISはiconv-lite等のライブラリが必要なため、現在はUTF-8のみサポート
  encoding: z.literal('utf-8').default('utf-8'),
});

// ============================================
// Utility Functions
// ============================================

/**
 * CSV数式インジェクション対策: 危険な先頭文字をエスケープ
 * Excel等で数式として解釈される文字 (=, +, -, @, タブ, CR) の前にシングルクォートを付与
 * 先頭の空白を除去した後にチェックし、該当する場合は常に先頭に'を付与
 */
function escapeFormulaInjection(str: string): string {
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  // 先頭の空白を除去してチェック（" =1+1"のようなケース対策）
  const trimmed = str.trimStart();
  if (dangerousChars.some((char) => trimmed.startsWith(char))) {
    // 元の文字列の先頭に'を付与（空白も保持）
    return `'${str}`;
  }
  return str;
}

/**
 * 値をCSVセーフな文字列に変換
 * - 数式インジェクション対策
 * - 特殊文字のエスケープ
 */
function escapeCSVValue(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // 数式インジェクション対策
  str = escapeFormulaInjection(str);

  // ダブルクォート、改行、デリミタを含む場合はエスケープ
  if (str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes(delimiter)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * ファイル名をサニタイズ（ヘッダーインジェクション対策）
 * 英数字、ハイフン、アンダースコア、ピリオドのみ許可
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 100);
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

      // 認可チェック: ジョブの所有者を確認
      // userIdが未設定のジョブはセキュリティ上の理由でアクセス拒否
      const jobUserId = job.data?.metadata?.userId as string | undefined;
      if (!jobUserId) {
        // 所有者情報がないジョブは誰もエクスポートできない（セキュリティ対策）
        return NextResponse.json(
          { error: 'ジョブに所有者情報がありません' },
          { status: 403 }
        );
      }
      if (jobUserId !== authResult.user.id) {
        return NextResponse.json(
          { error: 'このジョブへのアクセス権限がありません' },
          { status: 403 }
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

    // UTF-8エンコーディング（BOM付与でExcel互換性を確保）
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const encoder = new TextEncoder();
    const content = encoder.encode(csvContent);
    const contentBytes = new Uint8Array(bom.length + content.length);
    contentBytes.set(bom);
    contentBytes.set(content, bom.length);

    // ファイル名を生成（サニタイズしてヘッダーインジェクション対策）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeFilename = sanitizeFilename(options.filename);
    const filename = `${safeFilename}_${timestamp}.csv`;

    // レスポンスを返す
    return new NextResponse(contentBytes.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'text/csv; charset=UTF-8',
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
