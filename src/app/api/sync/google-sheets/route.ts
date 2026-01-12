/**
 * @file Google Sheets同期API
 * @description スクレイピング結果をGoogleスプレッドシートに同期するAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';
import { getJob } from '@/lib/queue/scraping-queue';
import {
  createGoogleSheetsServiceFromEnv,
  GoogleSheetsService,
} from '@/lib/services/google-sheets';

// ============================================
// Validation Schemas
// ============================================

const syncSchema = z.object({
  spreadsheetId: z.string().min(1),
  sheetName: z.string().min(1).default('Sheet1'),
  jobId: z.string().optional(),
  data: z.array(z.record(z.string(), z.unknown())).optional(),
  options: z.object({
    clearExisting: z.boolean().default(false),
    includeHeader: z.boolean().default(true),
    keyColumn: z.string().optional(),
  }).optional(),
});

const infoSchema = z.object({
  spreadsheetId: z.string().min(1),
});

// ============================================
// POST /api/sync/google-sheets
// ============================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const { spreadsheetId, sheetName, jobId, data, options } = syncSchema.parse(body);

    // データソースを決定
    let syncData: Record<string, unknown>[] = [];

    if (data && data.length > 0) {
      // 直接データが指定された場合
      syncData = data;
    } else if (jobId) {
      // ジョブIDからデータを取得
      const job = await getJob(jobId);

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

      // データ構造に応じて処理
      // 配列の場合はそのまま使用、オブジェクトの場合は配列に変換
      for (const [key, value] of Object.entries(extractedData)) {
        if (Array.isArray(value)) {
          // 配列の各要素にキー情報を追加
          syncData.push(...value.map((item) => ({
            _source: key,
            ...(typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : { value: item }),
          })));
        } else if (typeof value === 'object' && value !== null) {
          syncData.push({ _source: key, ...(value as Record<string, unknown>) });
        } else {
          syncData.push({ _source: key, value });
        }
      }
    } else {
      return NextResponse.json(
        { error: 'dataまたはjobIdのいずれかを指定してください' },
        { status: 400 }
      );
    }

    if (syncData.length === 0) {
      return NextResponse.json(
        { error: '同期するデータがありません' },
        { status: 400 }
      );
    }

    // Google Sheetsサービスを作成
    let sheetsService: GoogleSheetsService;

    try {
      sheetsService = createGoogleSheetsServiceFromEnv(spreadsheetId);
    } catch {
      return NextResponse.json(
        { error: 'Google Sheetsの認証情報が設定されていません' },
        { status: 500 }
      );
    }

    // データを同期 (unknownをstring | number | boolean | null | undefinedに変換)
    const typedSyncData = syncData.map((row) => {
      const typedRow: Record<string, string | number | boolean | null | undefined> = {};
      for (const [key, value] of Object.entries(row)) {
        if (value === null || value === undefined) {
          typedRow[key] = value;
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          typedRow[key] = value;
        } else {
          typedRow[key] = JSON.stringify(value);
        }
      }
      return typedRow;
    });

    const result = await sheetsService.syncData(sheetName, typedSyncData, {
      clearExisting: options?.clearExisting ?? false,
      includeHeader: options?.includeHeader ?? true,
      keyColumn: options?.keyColumn,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: '同期に失敗しました', details: result.errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'データを同期しました',
      result: {
        spreadsheetId,
        sheetName,
        rowsUpdated: result.rowsUpdated,
        rowsAppended: result.rowsAppended,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to sync to Google Sheets:', error);
    return NextResponse.json(
      { error: 'Google Sheetsへの同期に失敗しました' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/sync/google-sheets
// ============================================

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const { spreadsheetId } = infoSchema.parse({
      spreadsheetId: searchParams.get('spreadsheetId'),
    });

    // Google Sheetsサービスを作成
    let sheetsService: GoogleSheetsService;

    try {
      sheetsService = createGoogleSheetsServiceFromEnv(spreadsheetId);
    } catch {
      return NextResponse.json(
        { error: 'Google Sheetsの認証情報が設定されていません' },
        { status: 500 }
      );
    }

    // スプレッドシート情報を取得
    const info = await sheetsService.getSpreadsheetInfo();

    return NextResponse.json({
      spreadsheet: info,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to get spreadsheet info:', error);
    return NextResponse.json(
      { error: 'スプレッドシート情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
