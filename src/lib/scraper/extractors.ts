import { load, type CheerioAPI, type AnyNode } from 'cheerio';

// ============================================
// Types
// ============================================

export type ExtractorType = 'css' | 'xpath' | 'regex' | 'json' | 'text';

export interface ExtractionRule {
  name: string;
  type: ExtractorType;
  selector: string;
  attribute?: string;
  transform?: TransformFunction[];
  multiple?: boolean;
  required?: boolean;
  default?: string;
}

export type TransformFunction =
  | 'trim'
  | 'lowercase'
  | 'uppercase'
  | 'parseInt'
  | 'parseFloat'
  | 'removeWhitespace'
  | 'extractNumbers'
  | 'extractEmails'
  | 'extractUrls'
  | 'decodeHtml';

export interface ExtractionResult {
  [key: string]: string | string[] | number | null;
}

export interface ExtractorContext {
  html: string;
  url: string;
  contentType?: string;
}

// ============================================
// Transform Functions
// ============================================

const transforms: Record<TransformFunction, (value: string) => string | number> = {
  trim: (value) => value.trim(),
  lowercase: (value) => value.toLowerCase(),
  uppercase: (value) => value.toUpperCase(),
  parseInt: (value) => {
    const num = parseInt(value.replace(/[^\d-]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  },
  parseFloat: (value) => {
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
  },
  removeWhitespace: (value) => value.replace(/\s+/g, ' ').trim(),
  extractNumbers: (value) => {
    const match = value.match(/[\d,.]+/);
    return match ? match[0] : '';
  },
  extractEmails: (value) => {
    const match = value.match(/[\w.-]+@[\w.-]+\.\w+/);
    return match ? match[0] : '';
  },
  extractUrls: (value) => {
    const match = value.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/);
    return match ? match[0] : '';
  },
  decodeHtml: (value) => {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    };
    return value.replace(
      /&(?:amp|lt|gt|quot|#39|nbsp);/g,
      (match) => entities[match] || match
    );
  },
};

function applyTransforms(
  value: string,
  transformList?: TransformFunction[]
): string | number {
  if (!transformList || transformList.length === 0) {
    return value;
  }

  let result: string | number = value;
  for (const transform of transformList) {
    if (typeof result === 'string') {
      result = transforms[transform](result);
    }
  }
  return result;
}

// ============================================
// CSS Selector Extractor
// ============================================

export function extractByCss(
  $: CheerioAPI,
  rule: ExtractionRule
): string | string[] | null {
  const elements = $(rule.selector);

  if (elements.length === 0) {
    return rule.default ?? null;
  }

  const extractValue = (el: ReturnType<CheerioAPI>): string => {
    if (rule.attribute) {
      if (rule.attribute === 'text') {
        return el.text();
      }
      if (rule.attribute === 'html') {
        return el.html() || '';
      }
      return el.attr(rule.attribute) || '';
    }
    return el.text();
  };

  if (rule.multiple) {
    const values: string[] = [];
    elements.each((_: number, element: AnyNode) => {
      const value = extractValue($(element));
      const transformed = applyTransforms(value, rule.transform);
      values.push(String(transformed));
    });
    return values;
  }

  const value = extractValue(elements.first());
  const transformed = applyTransforms(value, rule.transform);
  return String(transformed);
}

// ============================================
// Regex Extractor
// ============================================

export function extractByRegex(
  content: string,
  rule: ExtractionRule
): string | string[] | null {
  try {
    const flags = rule.multiple ? 'g' : '';
    const regex = new RegExp(rule.selector, flags);

    if (rule.multiple) {
      const matches: string[] = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        const value = match[1] || match[0];
        const transformed = applyTransforms(value, rule.transform);
        matches.push(String(transformed));
      }
      return matches.length > 0 ? matches : (rule.default ?? null);
    }

    const match = content.match(regex);
    if (!match) {
      return rule.default ?? null;
    }

    const value = match[1] || match[0];
    const transformed = applyTransforms(value, rule.transform);
    return String(transformed);
  } catch (error) {
    console.error(`Regex extraction error: ${error}`);
    return rule.default ?? null;
  }
}

// ============================================
// JSON Extractor
// ============================================

export function extractByJson(
  content: string,
  rule: ExtractionRule
): string | string[] | null {
  try {
    const json = JSON.parse(content);
    const path = rule.selector.split('.');

    let current: unknown = json;
    for (const key of path) {
      if (current === null || current === undefined) {
        return rule.default ?? null;
      }

      // Handle array index notation like "items[0]"
      const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayKey, indexStr] = arrayMatch;
        const index = parseInt(indexStr, 10);
        current = (current as Record<string, unknown>)[arrayKey];
        if (Array.isArray(current)) {
          current = current[index];
        } else {
          return rule.default ?? null;
        }
      } else {
        current = (current as Record<string, unknown>)[key];
      }
    }

    if (current === null || current === undefined) {
      return rule.default ?? null;
    }

    if (rule.multiple && Array.isArray(current)) {
      return current.map((item) => {
        const value = String(item);
        const transformed = applyTransforms(value, rule.transform);
        return String(transformed);
      });
    }

    const value = String(current);
    const transformed = applyTransforms(value, rule.transform);
    return String(transformed);
  } catch (error) {
    console.error(`JSON extraction error: ${error}`);
    return rule.default ?? null;
  }
}

// ============================================
// Text Extractor (全文取得)
// ============================================

export function extractByText(
  $: CheerioAPI,
  rule: ExtractionRule
): string | null {
  const elements = $(rule.selector);

  if (elements.length === 0) {
    return rule.default ?? null;
  }

  const text = elements.first().text();
  const transformed = applyTransforms(text, rule.transform);
  return String(transformed);
}

// ============================================
// Main Extractor Function
// ============================================

export function extract(
  context: ExtractorContext,
  rules: ExtractionRule[]
): ExtractionResult {
  const $ = load(context.html);
  const result: ExtractionResult = {};

  for (const rule of rules) {
    let value: string | string[] | number | null = null;

    switch (rule.type) {
      case 'css':
        value = extractByCss($, rule);
        break;
      case 'regex':
        value = extractByRegex(context.html, rule);
        break;
      case 'json':
        value = extractByJson(context.html, rule);
        break;
      case 'text':
        value = extractByText($, rule);
        break;
      case 'xpath':
        // XPathはブラウザ環境でのみ完全サポート
        // Node.jsではCSSセレクタにフォールバック
        console.warn('XPath not fully supported, falling back to CSS selector');
        value = extractByCss($, { ...rule, type: 'css' });
        break;
    }

    if (value === null && rule.required) {
      throw new Error(`Required field "${rule.name}" not found`);
    }

    result[rule.name] = value;
  }

  return result;
}

// ============================================
// Utility Functions
// ============================================

export function extractLinks(html: string, baseUrl: string): string[] {
  const $ = load(html);
  const links: string[] = [];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        links.push(absoluteUrl);
      } catch {
        // Invalid URL, skip
      }
    }
  });

  return [...new Set(links)];
}

export function extractMetadata(html: string): Record<string, string | null> {
  const $ = load(html);

  return {
    title: $('title').text() || null,
    description:
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      null,
    keywords: $('meta[name="keywords"]').attr('content') || null,
    ogTitle: $('meta[property="og:title"]').attr('content') || null,
    ogImage: $('meta[property="og:image"]').attr('content') || null,
    canonical: $('link[rel="canonical"]').attr('href') || null,
  };
}
