// ============================================
// Types
// ============================================

export interface VariableContext {
  // 環境変数
  env: Record<string, string | undefined>;
  // 抽出結果
  extracted: Record<string, string | string[] | number | null>;
  // ステップ間で共有される変数
  shared: Record<string, unknown>;
  // ページネーション用変数
  pagination: {
    page: number;
    offset: number;
    limit: number;
    hasNext: boolean;
  };
  // 現在のURL情報
  url: {
    full: string;
    protocol: string;
    host: string;
    pathname: string;
    search: string;
    hash: string;
  };
  // タイムスタンプ
  timestamp: {
    now: number;
    iso: string;
    date: string;
    time: string;
  };
}

export interface ResolveOptions {
  throwOnMissing?: boolean;
  defaultValue?: string;
}

// ============================================
// Variable Pattern
// ============================================

// ${variable} or ${variable.nested.path} or ${variable|default:value}
const VARIABLE_PATTERN = /\$\{([^}]+)\}/g;

// ============================================
// Path Resolution
// ============================================

function resolvePath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array index notation like "items[0]"
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, indexStr] = arrayMatch;
      const index = parseInt(indexStr, 10);
      current = (current as Record<string, unknown>)[key];
      if (Array.isArray(current)) {
        current = current[index];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

// ============================================
// Variable Parser
// ============================================

interface ParsedVariable {
  path: string;
  defaultValue?: string;
  filters: string[];
}

function parseVariable(expression: string): ParsedVariable {
  const parts = expression.split('|');
  const path = parts[0].trim();
  const filters: string[] = [];
  let defaultValue: string | undefined;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part.startsWith('default:')) {
      defaultValue = part.slice(8);
    } else {
      filters.push(part);
    }
  }

  return { path, defaultValue, filters };
}

// ============================================
// Filters
// ============================================

type FilterFunction = (value: string) => string;

const filters: Record<string, FilterFunction> = {
  trim: (value) => value.trim(),
  lowercase: (value) => value.toLowerCase(),
  uppercase: (value) => value.toUpperCase(),
  urlencode: (value) => encodeURIComponent(value),
  urldecode: (value) => decodeURIComponent(value),
  base64encode: (value) => Buffer.from(value).toString('base64'),
  base64decode: (value) => Buffer.from(value, 'base64').toString('utf-8'),
  json: (value) => {
    try {
      return JSON.stringify(JSON.parse(value));
    } catch {
      return value;
    }
  },
  first: (value) => {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? String(arr[0] ?? '') : value;
    } catch {
      return value;
    }
  },
  last: (value) => {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? String(arr[arr.length - 1] ?? '') : value;
    } catch {
      return value;
    }
  },
  join: (value) => {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? arr.join(',') : value;
    } catch {
      return value;
    }
  },
  length: (value) => {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? String(arr.length) : String(value.length);
    } catch {
      return String(value.length);
    }
  },
};

function applyFilters(value: string, filterNames: string[]): string {
  let result = value;
  for (const filterName of filterNames) {
    const filter = filters[filterName];
    if (filter) {
      result = filter(result);
    }
  }
  return result;
}

// ============================================
// Context Builder
// ============================================

export function createVariableContext(
  partial: Partial<VariableContext> = {}
): VariableContext {
  const now = new Date();

  return {
    env: partial.env ?? process.env,
    extracted: partial.extracted ?? {},
    shared: partial.shared ?? {},
    pagination: partial.pagination ?? {
      page: 1,
      offset: 0,
      limit: 10,
      hasNext: false,
    },
    url: partial.url ?? {
      full: '',
      protocol: '',
      host: '',
      pathname: '',
      search: '',
      hash: '',
    },
    timestamp: {
      now: now.getTime(),
      iso: now.toISOString(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
    },
  };
}

export function updateUrlContext(
  context: VariableContext,
  url: string
): VariableContext {
  try {
    const parsed = new URL(url);
    return {
      ...context,
      url: {
        full: url,
        protocol: parsed.protocol,
        host: parsed.host,
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
      },
    };
  } catch {
    return context;
  }
}

export function updatePaginationContext(
  context: VariableContext,
  updates: Partial<VariableContext['pagination']>
): VariableContext {
  return {
    ...context,
    pagination: {
      ...context.pagination,
      ...updates,
    },
  };
}

export function mergeExtracted(
  context: VariableContext,
  extracted: VariableContext['extracted']
): VariableContext {
  return {
    ...context,
    extracted: {
      ...context.extracted,
      ...extracted,
    },
  };
}

export function setSharedVariable(
  context: VariableContext,
  key: string,
  value: unknown
): VariableContext {
  return {
    ...context,
    shared: {
      ...context.shared,
      [key]: value,
    },
  };
}

// ============================================
// Main Resolver
// ============================================

export function resolveVariable(
  expression: string,
  context: VariableContext,
  options: ResolveOptions = {}
): string {
  const parsed = parseVariable(expression);
  let value: unknown;

  // Try to resolve from different sources
  if (parsed.path.startsWith('env.')) {
    value = resolvePath(context, parsed.path);
  } else if (parsed.path.startsWith('extracted.')) {
    value = resolvePath(context, parsed.path);
  } else if (parsed.path.startsWith('shared.')) {
    value = resolvePath(context, parsed.path);
  } else if (parsed.path.startsWith('pagination.')) {
    value = resolvePath(context, parsed.path);
  } else if (parsed.path.startsWith('url.')) {
    value = resolvePath(context, parsed.path);
  } else if (parsed.path.startsWith('timestamp.')) {
    value = resolvePath(context, parsed.path);
  } else {
    // Default: try extracted first, then shared
    value = resolvePath({ extracted: context.extracted }, `extracted.${parsed.path}`);
    if (value === undefined) {
      value = resolvePath({ shared: context.shared }, `shared.${parsed.path}`);
    }
  }

  // Handle undefined values
  if (value === undefined || value === null) {
    if (parsed.defaultValue !== undefined) {
      return parsed.defaultValue;
    }
    if (options.defaultValue !== undefined) {
      return options.defaultValue;
    }
    if (options.throwOnMissing) {
      throw new Error(`Variable not found: ${parsed.path}`);
    }
    return '';
  }

  // Convert to string
  let stringValue: string;
  if (typeof value === 'object') {
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value);
  }

  // Apply filters
  return applyFilters(stringValue, parsed.filters);
}

export function resolveTemplate(
  template: string,
  context: VariableContext,
  options: ResolveOptions = {}
): string {
  return template.replace(VARIABLE_PATTERN, (_, expression) => {
    return resolveVariable(expression, context, options);
  });
}

export function resolveUrl(
  urlTemplate: string,
  context: VariableContext
): string {
  const resolved = resolveTemplate(urlTemplate, context);
  // Ensure URL is valid
  try {
    new URL(resolved);
    return resolved;
  } catch {
    // If it's a relative URL, try to resolve against current URL
    if (context.url.full) {
      try {
        return new URL(resolved, context.url.full).href;
      } catch {
        // Return as-is
      }
    }
    return resolved;
  }
}

export function resolveObject<T extends Record<string, unknown>>(
  obj: T,
  context: VariableContext,
  options: ResolveOptions = {}
): T {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      resolved[key] = resolveTemplate(value, context, options);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      resolved[key] = resolveObject(value as Record<string, unknown>, context, options);
    } else if (Array.isArray(value)) {
      resolved[key] = value.map((item) => {
        if (typeof item === 'string') {
          return resolveTemplate(item, context, options);
        }
        if (typeof item === 'object' && item !== null) {
          return resolveObject(item as Record<string, unknown>, context, options);
        }
        return item;
      });
    } else {
      resolved[key] = value;
    }
  }

  return resolved as T;
}

// ============================================
// Validation
// ============================================

export function findVariables(template: string): string[] {
  const matches = template.matchAll(VARIABLE_PATTERN);
  return [...matches].map((match) => match[1]);
}

export function validateTemplate(
  template: string,
  context: VariableContext
): { valid: boolean; missing: string[] } {
  const variables = findVariables(template);
  const missing: string[] = [];

  for (const variable of variables) {
    const parsed = parseVariable(variable);
    if (parsed.defaultValue !== undefined) {
      continue; // Has default, always valid
    }

    try {
      const resolved = resolveVariable(variable, context, { throwOnMissing: true });
      if (resolved === '') {
        missing.push(parsed.path);
      }
    } catch {
      missing.push(parsed.path);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
