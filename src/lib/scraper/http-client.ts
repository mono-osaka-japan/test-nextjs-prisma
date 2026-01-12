import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';

// ============================================
// Types
// ============================================

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  proxy?: ProxyConfig | null;
}

export interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

export interface HttpResponse<T = string> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  url: string;
  timing: {
    start: number;
    end: number;
    duration: number;
  };
}

export interface HttpError {
  message: string;
  status?: number;
  code?: string;
  retryable: boolean;
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: Required<Omit<HttpClientConfig, 'baseURL' | 'proxy'>> = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
  },
};

// ============================================
// Retry Logic
// ============================================

const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const RETRYABLE_ERROR_CODES = [
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ENETUNREACH',
  'EAI_AGAIN',
];

function isRetryable(error: AxiosError): boolean {
  if (error.response) {
    return RETRYABLE_STATUS_CODES.includes(error.response.status);
  }
  if (error.code) {
    return RETRYABLE_ERROR_CODES.includes(error.code);
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number = 30000
): number {
  const delay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, maxDelay);
}

// ============================================
// HttpClient Class
// ============================================

export class HttpClient {
  private client: AxiosInstance;
  private config: Required<Omit<HttpClientConfig, 'baseURL' | 'proxy'>> &
    Pick<HttpClientConfig, 'baseURL' | 'proxy'>;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      headers: {
        ...DEFAULT_CONFIG.headers,
        ...config.headers,
      },
    };

    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    };

    if (this.config.proxy) {
      axiosConfig.proxy = {
        host: this.config.proxy.host,
        port: this.config.proxy.port,
        auth: this.config.proxy.auth,
      };
    }

    this.client = axios.create(axiosConfig);
  }

  async get<T = string>(
    url: string,
    options: Partial<HttpClientConfig> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T = string>(
    url: string,
    data?: unknown,
    options: Partial<HttpClientConfig> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, data, options);
  }

  private async request<T>(
    method: 'GET' | 'POST',
    url: string,
    data?: unknown,
    options: Partial<HttpClientConfig> = {}
  ): Promise<HttpResponse<T>> {
    const retries = options.retries ?? this.config.retries;
    const retryDelay = options.retryDelay ?? this.config.retryDelay;

    let lastError: HttpError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();

        const response: AxiosResponse<T> = await this.client.request({
          method,
          url,
          data,
          headers: options.headers,
          timeout: options.timeout ?? this.config.timeout,
        });

        const endTime = Date.now();

        return {
          status: response.status,
          statusText: response.statusText,
          headers: this.normalizeHeaders(response.headers),
          data: response.data,
          url: response.config.url || url,
          timing: {
            start: startTime,
            end: endTime,
            duration: endTime - startTime,
          },
        };
      } catch (error) {
        const axiosError = error as AxiosError;
        const httpError = this.toHttpError(axiosError);
        lastError = httpError;

        if (!httpError.retryable || attempt === retries) {
          throw httpError;
        }

        const backoff = calculateBackoff(attempt, retryDelay);
        await sleep(backoff);
      }
    }

    throw lastError;
  }

  private normalizeHeaders(
    headers: AxiosResponse['headers']
  ): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        normalized[key.toLowerCase()] = value;
      } else if (Array.isArray(value)) {
        normalized[key.toLowerCase()] = value.join(', ');
      }
    }
    return normalized;
  }

  private toHttpError(error: AxiosError): HttpError {
    return {
      message: error.message,
      status: error.response?.status,
      code: error.code,
      retryable: isRetryable(error),
    };
  }

  setHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }

  removeHeader(key: string): void {
    delete this.client.defaults.headers.common[key];
  }
}

// ============================================
// Factory Function
// ============================================

export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
