import { HttpClient, HttpResponse, createHttpClient, HttpClientConfig } from './http-client';
import {
  extract,
  ExtractionRule,
  ExtractionResult,
  extractLinks,
  extractMetadata,
} from './extractors';
import {
  VariableContext,
  createVariableContext,
  updateUrlContext,
  updatePaginationContext,
  mergeExtracted,
  setSharedVariable,
  resolveTemplate,
  resolveUrl,
  resolveObject,
} from './variable-resolver';

// ============================================
// Types
// ============================================

export type StepType = 'request' | 'extract' | 'paginate' | 'loop' | 'condition' | 'save';

export interface BaseStep {
  name: string;
  type: StepType;
  description?: string;
  continueOnError?: boolean;
}

export interface RequestStep extends BaseStep {
  type: 'request';
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
  saveAs?: string;
}

export interface ExtractStep extends BaseStep {
  type: 'extract';
  rules: ExtractionRule[];
  source?: string; // Variable name containing HTML, defaults to last response
}

export interface PaginateStep extends BaseStep {
  type: 'paginate';
  nextPageSelector?: string;
  maxPages?: number;
  delay?: number;
  steps: ScrapingStep[];
}

export interface LoopStep extends BaseStep {
  type: 'loop';
  items: string; // Variable name containing array
  as: string; // Variable name for current item
  steps: ScrapingStep[];
}

export interface ConditionStep extends BaseStep {
  type: 'condition';
  condition: string; // Template that resolves to truthy/falsy
  then: ScrapingStep[];
  else?: ScrapingStep[];
}

export interface SaveStep extends BaseStep {
  type: 'save';
  variable: string;
  value: string; // Template
}

export type ScrapingStep =
  | RequestStep
  | ExtractStep
  | PaginateStep
  | LoopStep
  | ConditionStep
  | SaveStep;

export interface ScrapingConfig {
  name: string;
  description?: string;
  startUrl: string;
  steps: ScrapingStep[];
  httpConfig?: HttpClientConfig;
  maxRetries?: number;
  requestDelay?: number;
}

export interface ScrapingResult {
  success: boolean;
  data: ExtractionResult;
  metadata: {
    startedAt: Date;
    finishedAt: Date;
    duration: number;
    requestCount: number;
    errorCount: number;
    pagesVisited: string[];
  };
  errors: ScrapingError[];
}

export interface ScrapingError {
  step: string;
  message: string;
  url?: string;
  timestamp: Date;
}

export interface EngineOptions {
  onStepStart?: (step: ScrapingStep, context: VariableContext) => void;
  onStepComplete?: (step: ScrapingStep, result: unknown) => void;
  onError?: (error: ScrapingError) => void;
  onProgress?: (progress: { current: number; total: number; step: string }) => void;
}

// ============================================
// Scraping Engine
// ============================================

export class ScrapingEngine {
  private httpClient: HttpClient;
  private config: ScrapingConfig;
  private context: VariableContext;
  private options: EngineOptions;
  private lastResponse: HttpResponse | null = null;
  private requestCount = 0;
  private errors: ScrapingError[] = [];
  private pagesVisited: string[] = [];

  constructor(
    config: ScrapingConfig,
    initialContext: Partial<VariableContext> = {},
    options: EngineOptions = {}
  ) {
    this.config = config;
    this.httpClient = createHttpClient(config.httpConfig);
    this.context = createVariableContext(initialContext);
    this.options = options;
  }

  async run(): Promise<ScrapingResult> {
    const startedAt = new Date();

    try {
      // Initialize with start URL
      const startUrl = resolveUrl(this.config.startUrl, this.context);
      this.context = updateUrlContext(this.context, startUrl);

      // Execute all steps
      await this.executeSteps(this.config.steps);

      const finishedAt = new Date();

      return {
        success: this.errors.length === 0,
        data: this.context.extracted,
        metadata: {
          startedAt,
          finishedAt,
          duration: finishedAt.getTime() - startedAt.getTime(),
          requestCount: this.requestCount,
          errorCount: this.errors.length,
          pagesVisited: this.pagesVisited,
        },
        errors: this.errors,
      };
    } catch (error) {
      const finishedAt = new Date();

      return {
        success: false,
        data: this.context.extracted,
        metadata: {
          startedAt,
          finishedAt,
          duration: finishedAt.getTime() - startedAt.getTime(),
          requestCount: this.requestCount,
          errorCount: this.errors.length + 1,
          pagesVisited: this.pagesVisited,
        },
        errors: [
          ...this.errors,
          {
            step: 'engine',
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
          },
        ],
      };
    }
  }

  private async executeSteps(steps: ScrapingStep[]): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      this.options.onProgress?.({
        current: i + 1,
        total: steps.length,
        step: step.name,
      });

      this.options.onStepStart?.(step, this.context);

      try {
        await this.executeStep(step);
        this.options.onStepComplete?.(step, null);
      } catch (error) {
        const scrapingError: ScrapingError = {
          step: step.name,
          message: error instanceof Error ? error.message : String(error),
          url: this.context.url.full,
          timestamp: new Date(),
        };

        this.errors.push(scrapingError);
        this.options.onError?.(scrapingError);

        if (!step.continueOnError) {
          throw error;
        }
      }

      // Apply request delay if configured
      if (this.config.requestDelay && step.type === 'request') {
        await this.sleep(this.config.requestDelay);
      }
    }
  }

  private async executeStep(step: ScrapingStep): Promise<void> {
    switch (step.type) {
      case 'request':
        await this.executeRequest(step);
        break;
      case 'extract':
        await this.executeExtract(step);
        break;
      case 'paginate':
        await this.executePaginate(step);
        break;
      case 'loop':
        await this.executeLoop(step);
        break;
      case 'condition':
        await this.executeCondition(step);
        break;
      case 'save':
        await this.executeSave(step);
        break;
    }
  }

  private async executeRequest(step: RequestStep): Promise<void> {
    const url = resolveUrl(step.url, this.context);
    const method = step.method || 'GET';
    const headers = step.headers
      ? resolveObject(step.headers, this.context)
      : undefined;

    let body: unknown;
    if (step.body) {
      if (typeof step.body === 'string') {
        body = resolveTemplate(step.body, this.context);
      } else {
        body = resolveObject(step.body, this.context);
      }
    }

    this.requestCount++;
    this.pagesVisited.push(url);

    const response =
      method === 'POST'
        ? await this.httpClient.post(url, body, { headers })
        : await this.httpClient.get(url, { headers });

    this.lastResponse = response;
    this.context = updateUrlContext(this.context, url);

    if (step.saveAs) {
      this.context = setSharedVariable(this.context, step.saveAs, response.data);
    }
  }

  private async executeExtract(step: ExtractStep): Promise<void> {
    let html: string;

    if (step.source) {
      const sourceValue = this.context.shared[step.source];
      if (typeof sourceValue !== 'string') {
        throw new Error(`Source "${step.source}" is not a string`);
      }
      html = sourceValue;
    } else if (this.lastResponse) {
      html = String(this.lastResponse.data);
    } else {
      throw new Error('No HTML content available for extraction');
    }

    const result = extract(
      {
        html,
        url: this.context.url.full,
      },
      step.rules
    );

    this.context = mergeExtracted(this.context, result);
  }

  private async executePaginate(step: PaginateStep): Promise<void> {
    const maxPages = step.maxPages || 100;
    let currentPage = 1;

    this.context = updatePaginationContext(this.context, {
      page: currentPage,
      hasNext: true,
    });

    while (currentPage <= maxPages) {
      // Execute steps for current page
      await this.executeSteps(step.steps);

      currentPage++;
      this.context = updatePaginationContext(this.context, {
        page: currentPage,
        offset: (currentPage - 1) * this.context.pagination.limit,
      });

      // Find next page link
      if (step.nextPageSelector && this.lastResponse) {
        const html = String(this.lastResponse.data);
        const links = extractLinks(html, this.context.url.full);

        // Look for next page link using selector
        const $ = (await import('cheerio')).load(html);
        const nextLink = $(step.nextPageSelector).attr('href');

        if (!nextLink) {
          this.context = updatePaginationContext(this.context, { hasNext: false });
          break;
        }

        // Navigate to next page
        const nextUrl = new URL(nextLink, this.context.url.full).href;
        this.requestCount++;
        this.pagesVisited.push(nextUrl);

        this.lastResponse = await this.httpClient.get(nextUrl);
        this.context = updateUrlContext(this.context, nextUrl);

        if (step.delay) {
          await this.sleep(step.delay);
        }
      } else {
        // No next page selector, stop pagination
        this.context = updatePaginationContext(this.context, { hasNext: false });
        break;
      }
    }
  }

  private async executeLoop(step: LoopStep): Promise<void> {
    const items = this.context.extracted[step.items];

    if (!Array.isArray(items)) {
      throw new Error(`Loop items "${step.items}" is not an array`);
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.context = setSharedVariable(this.context, step.as, item);
      this.context = setSharedVariable(this.context, `${step.as}_index`, i);

      await this.executeSteps(step.steps);
    }
  }

  private async executeCondition(step: ConditionStep): Promise<void> {
    const conditionValue = resolveTemplate(step.condition, this.context);
    const isTruthy =
      conditionValue !== '' &&
      conditionValue !== 'false' &&
      conditionValue !== '0' &&
      conditionValue !== 'null' &&
      conditionValue !== 'undefined';

    if (isTruthy) {
      await this.executeSteps(step.then);
    } else if (step.else) {
      await this.executeSteps(step.else);
    }
  }

  private async executeSave(step: SaveStep): Promise<void> {
    const value = resolveTemplate(step.value, this.context);
    this.context = setSharedVariable(this.context, step.variable, value);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================
  // Public Utility Methods
  // ============================================

  getContext(): VariableContext {
    return this.context;
  }

  getLastResponse(): HttpResponse | null {
    return this.lastResponse;
  }

  getExtractedData(): ExtractionResult {
    return this.context.extracted;
  }

  getMetadata(): Record<string, string | null> | null {
    if (!this.lastResponse) return null;
    return extractMetadata(String(this.lastResponse.data));
  }

  getLinks(): string[] {
    if (!this.lastResponse) return [];
    return extractLinks(String(this.lastResponse.data), this.context.url.full);
  }
}

// ============================================
// Factory Function
// ============================================

export function createScrapingEngine(
  config: ScrapingConfig,
  initialContext?: Partial<VariableContext>,
  options?: EngineOptions
): ScrapingEngine {
  return new ScrapingEngine(config, initialContext, options);
}

// ============================================
// Simple Scraping Functions
// ============================================

export async function scrapeUrl(
  url: string,
  rules: ExtractionRule[],
  httpConfig?: HttpClientConfig
): Promise<ExtractionResult> {
  const engine = createScrapingEngine({
    name: 'simple-scrape',
    startUrl: url,
    steps: [
      { name: 'fetch', type: 'request', url },
      { name: 'extract', type: 'extract', rules },
    ],
    httpConfig,
  });

  const result = await engine.run();

  if (!result.success) {
    throw new Error(result.errors.map((e) => e.message).join(', '));
  }

  return result.data;
}

export async function fetchAndExtract(
  url: string,
  selector: string,
  attribute?: string
): Promise<string | null> {
  const result = await scrapeUrl(url, [
    {
      name: 'value',
      type: 'css',
      selector,
      attribute,
    },
  ]);

  const value = result['value'];
  return typeof value === 'string' ? value : null;
}
