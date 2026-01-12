/**
 * @file Google Sheets連携サービス
 * @description スクレイピング結果をGoogleスプレッドシートに同期するサービス
 */

import { google, sheets_v4 } from 'googleapis';

// ============================================
// Types
// ============================================

export interface GoogleSheetsConfig {
  /** サービスアカウントの認証情報JSON */
  credentials: string | object;
  /** スプレッドシートID */
  spreadsheetId: string;
  /** シート名 */
  sheetName?: string;
}

export interface SheetRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface SyncResult {
  success: boolean;
  rowsUpdated: number;
  rowsAppended: number;
  errors: string[];
}

export interface SpreadsheetInfo {
  spreadsheetId: string;
  title: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    rowCount: number;
    columnCount: number;
  }>;
}

// ============================================
// Google Sheets Service
// ============================================

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets | null = null;
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
  }

  /**
   * Google Sheets APIクライアントを初期化
   */
  private async getClient(): Promise<sheets_v4.Sheets> {
    if (this.sheets) {
      return this.sheets;
    }

    const credentials =
      typeof this.config.credentials === 'string'
        ? JSON.parse(this.config.credentials)
        : this.config.credentials;

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    return this.sheets;
  }

  /**
   * スプレッドシートの情報を取得
   */
  async getSpreadsheetInfo(): Promise<SpreadsheetInfo> {
    const client = await this.getClient();

    const response = await client.spreadsheets.get({
      spreadsheetId: this.config.spreadsheetId,
    });

    const spreadsheet = response.data;

    return {
      spreadsheetId: spreadsheet.spreadsheetId || '',
      title: spreadsheet.properties?.title || '',
      sheets:
        spreadsheet.sheets?.map((sheet) => ({
          sheetId: sheet.properties?.sheetId || 0,
          title: sheet.properties?.title || '',
          rowCount: sheet.properties?.gridProperties?.rowCount || 0,
          columnCount: sheet.properties?.gridProperties?.columnCount || 0,
        })) || [],
    };
  }

  /**
   * シートからデータを読み込む
   * @param range A1表記の範囲（例: 'Sheet1!A1:D10'）
   */
  async readRange(range: string): Promise<string[][]> {
    const client = await this.getClient();

    const response = await client.spreadsheets.values.get({
      spreadsheetId: this.config.spreadsheetId,
      range,
    });

    return (response.data.values as string[][]) || [];
  }

  /**
   * シートにデータを書き込む（上書き）
   * @param range A1表記の範囲
   * @param values 書き込むデータ
   */
  async writeRange(range: string, values: (string | number | boolean | null)[][]): Promise<number> {
    const client = await this.getClient();

    const response = await client.spreadsheets.values.update({
      spreadsheetId: this.config.spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    return response.data.updatedRows || 0;
  }

  /**
   * シートにデータを追記
   * @param range A1表記の範囲
   * @param values 追記するデータ
   */
  async appendRange(range: string, values: (string | number | boolean | null)[][]): Promise<number> {
    const client = await this.getClient();

    const response = await client.spreadsheets.values.append({
      spreadsheetId: this.config.spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });

    return response.data.updates?.updatedRows || 0;
  }

  /**
   * シートをクリア
   * @param range A1表記の範囲
   */
  async clearRange(range: string): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.values.clear({
      spreadsheetId: this.config.spreadsheetId,
      range,
    });
  }

  /**
   * オブジェクト配列をシートに同期（ヘッダー行付き）
   * @param sheetName シート名
   * @param data 同期するデータ
   * @param options 同期オプション
   */
  async syncData(
    sheetName: string,
    data: SheetRow[],
    options: {
      clearExisting?: boolean;
      includeHeader?: boolean;
      keyColumn?: string;
    } = {}
  ): Promise<SyncResult> {
    const { clearExisting = false, includeHeader = true, keyColumn } = options;
    const errors: string[] = [];
    let rowsUpdated = 0;
    let rowsAppended = 0;

    try {
      if (data.length === 0) {
        return { success: true, rowsUpdated: 0, rowsAppended: 0, errors: [] };
      }

      // ヘッダーを取得（最初のオブジェクトのキー）
      const headers = Object.keys(data[0]);
      const range = `${sheetName}!A1`;

      if (clearExisting) {
        // 既存データをクリアして書き込み
        await this.clearRange(`${sheetName}!A:ZZ`);

        const values: (string | number | boolean | null)[][] = [];

        if (includeHeader) {
          values.push(headers);
        }

        for (const row of data) {
          values.push(headers.map((h) => row[h] ?? null));
        }

        rowsUpdated = await this.writeRange(range, values);
      } else if (keyColumn) {
        // キーカラムに基づいて更新または追記
        const existingData = await this.readRange(`${sheetName}!A:ZZ`);

        if (existingData.length === 0) {
          // シートが空の場合は新規作成
          const values: (string | number | boolean | null)[][] = [];

          if (includeHeader) {
            values.push(headers);
          }

          for (const row of data) {
            values.push(headers.map((h) => row[h] ?? null));
          }

          rowsAppended = await this.writeRange(range, values);
        } else {
          const existingHeaders = existingData[0];
          const keyIndex = existingHeaders.indexOf(keyColumn);

          if (keyIndex === -1) {
            errors.push(`Key column "${keyColumn}" not found in existing sheet`);
            return { success: false, rowsUpdated, rowsAppended, errors };
          }

          // 既存のキー値をマップ
          const existingKeys = new Map<string, number>();
          for (let i = 1; i < existingData.length; i++) {
            const keyValue = existingData[i][keyIndex];
            if (keyValue) {
              existingKeys.set(String(keyValue), i + 1); // 1-indexed row number
            }
          }

          // 更新または追記
          const toAppend: (string | number | boolean | null)[][] = [];

          for (const row of data) {
            const keyValue = String(row[keyColumn] ?? '');
            const existingRowNum = existingKeys.get(keyValue);

            if (existingRowNum) {
              // 既存行を更新
              const rowValues = existingHeaders.map((h) => row[h] ?? null);
              await this.writeRange(`${sheetName}!A${existingRowNum}`, [rowValues]);
              rowsUpdated++;
            } else {
              // 新規行として追記
              toAppend.push(existingHeaders.map((h) => row[h] ?? null));
            }
          }

          if (toAppend.length > 0) {
            rowsAppended = await this.appendRange(`${sheetName}!A:A`, toAppend);
          }
        }
      } else {
        // 単純追記
        const values = data.map((row) => headers.map((h) => row[h] ?? null));
        rowsAppended = await this.appendRange(range, values);
      }

      return { success: true, rowsUpdated, rowsAppended, errors };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return { success: false, rowsUpdated, rowsAppended, errors };
    }
  }

  /**
   * 新しいシートを作成
   * @param title シートのタイトル
   */
  async createSheet(title: string): Promise<number> {
    const client = await this.getClient();

    const response = await client.spreadsheets.batchUpdate({
      spreadsheetId: this.config.spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title,
              },
            },
          },
        ],
      },
    });

    return response.data.replies?.[0]?.addSheet?.properties?.sheetId || 0;
  }

  /**
   * シートを削除
   * @param sheetId シートID
   */
  async deleteSheet(sheetId: number): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId: this.config.spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteSheet: {
              sheetId,
            },
          },
        ],
      },
    });
  }

  /**
   * シートの書式を設定
   * @param sheetId シートID
   * @param options 書式オプション
   */
  async formatSheet(
    sheetId: number,
    options: {
      freezeRows?: number;
      freezeColumns?: number;
      headerBold?: boolean;
      autoResizeColumns?: boolean;
    }
  ): Promise<void> {
    const client = await this.getClient();
    const requests: sheets_v4.Schema$Request[] = [];

    if (options.freezeRows !== undefined || options.freezeColumns !== undefined) {
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId,
            gridProperties: {
              frozenRowCount: options.freezeRows,
              frozenColumnCount: options.freezeColumns,
            },
          },
          fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount',
        },
      });
    }

    if (options.headerBold) {
      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true,
              },
            },
          },
          fields: 'userEnteredFormat.textFormat.bold',
        },
      });
    }

    if (options.autoResizeColumns) {
      requests.push({
        autoResizeDimensions: {
          dimensions: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 26, // A-Z
          },
        },
      });
    }

    if (requests.length > 0) {
      await client.spreadsheets.batchUpdate({
        spreadsheetId: this.config.spreadsheetId,
        requestBody: { requests },
      });
    }
  }
}

// ============================================
// Factory Function
// ============================================

/**
 * Google Sheetsサービスを作成
 */
export function createGoogleSheetsService(config: GoogleSheetsConfig): GoogleSheetsService {
  return new GoogleSheetsService(config);
}

/**
 * 環境変数からGoogle Sheetsサービスを作成
 */
export function createGoogleSheetsServiceFromEnv(spreadsheetId: string): GoogleSheetsService {
  const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;

  if (!credentials) {
    throw new Error('GOOGLE_SHEETS_CREDENTIALS environment variable is not set');
  }

  return createGoogleSheetsService({
    credentials,
    spreadsheetId,
  });
}
