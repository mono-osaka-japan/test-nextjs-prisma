import {
  createVariableContext,
  resolveVariable,
  resolveTemplate,
  resolveUrl,
  resolveObject,
  updateUrlContext,
  updatePaginationContext,
  mergeExtracted,
  setSharedVariable,
  findVariables,
  validateTemplate,
  VariableContext,
} from '@/lib/scraper/variable-resolver';

describe('Variable Resolver', () => {
  let context: VariableContext;

  beforeEach(() => {
    context = createVariableContext({
      extracted: {
        title: 'Test Title',
        price: '1234',
        items: ['a', 'b', 'c'],
      },
      shared: {
        userId: 'user123',
        config: {
          nested: {
            value: 'deep',
          },
        },
      },
      pagination: {
        page: 2,
        offset: 10,
        limit: 10,
        hasNext: true,
      },
    });
    context = updateUrlContext(context, 'https://example.com/path?query=1#hash');
  });

  describe('createVariableContext', () => {
    it('should create context with defaults', () => {
      const ctx = createVariableContext();

      expect(ctx.extracted).toEqual({});
      expect(ctx.shared).toEqual({});
      expect(ctx.pagination.page).toBe(1);
      expect(ctx.timestamp.now).toBeDefined();
    });

    it('should merge partial context', () => {
      const ctx = createVariableContext({
        extracted: { key: 'value' },
      });

      expect(ctx.extracted).toEqual({ key: 'value' });
      expect(ctx.shared).toEqual({});
    });
  });

  describe('resolveVariable', () => {
    it('should resolve extracted variable', () => {
      const result = resolveVariable('extracted.title', context);
      expect(result).toBe('Test Title');
    });

    it('should resolve shared variable', () => {
      const result = resolveVariable('shared.userId', context);
      expect(result).toBe('user123');
    });

    it('should resolve nested path', () => {
      const result = resolveVariable('shared.config.nested.value', context);
      expect(result).toBe('deep');
    });

    it('should resolve pagination variable', () => {
      const result = resolveVariable('pagination.page', context);
      expect(result).toBe('2');
    });

    it('should resolve url variable', () => {
      const result = resolveVariable('url.host', context);
      expect(result).toBe('example.com');
    });

    it('should resolve timestamp variable', () => {
      const result = resolveVariable('timestamp.date', context);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should use default value on missing', () => {
      const result = resolveVariable('missing|default:N/A', context);
      expect(result).toBe('N/A');
    });

    it('should apply trim filter', () => {
      context = mergeExtracted(context, { spaced: '  hello  ' });
      const result = resolveVariable('extracted.spaced|trim', context);
      expect(result).toBe('hello');
    });

    it('should apply urlencode filter', () => {
      context = mergeExtracted(context, { query: 'hello world' });
      const result = resolveVariable('extracted.query|urlencode', context);
      expect(result).toBe('hello%20world');
    });

    it('should throw on missing required variable', () => {
      expect(() => {
        resolveVariable('missing', context, { throwOnMissing: true });
      }).toThrow('Variable not found: missing');
    });

    it('should resolve shorthand path from extracted', () => {
      const result = resolveVariable('title', context);
      expect(result).toBe('Test Title');
    });
  });

  describe('resolveTemplate', () => {
    it('should resolve single variable', () => {
      const result = resolveTemplate('Hello ${extracted.title}!', context);
      expect(result).toBe('Hello Test Title!');
    });

    it('should resolve multiple variables', () => {
      const result = resolveTemplate(
        'Page ${pagination.page} - ${extracted.title}',
        context
      );
      expect(result).toBe('Page 2 - Test Title');
    });

    it('should preserve text without variables', () => {
      const result = resolveTemplate('No variables here', context);
      expect(result).toBe('No variables here');
    });

    it('should handle missing with default', () => {
      const result = resolveTemplate('Value: ${missing|default:none}', context);
      expect(result).toBe('Value: none');
    });
  });

  describe('resolveUrl', () => {
    it('should resolve URL with variables', () => {
      context = setSharedVariable(context, 'category', 'electronics');
      const result = resolveUrl(
        'https://example.com/search?cat=${shared.category}&page=${pagination.page}',
        context
      );
      expect(result).toBe('https://example.com/search?cat=electronics&page=2');
    });

    it('should resolve relative URL', () => {
      const result = resolveUrl('/page/${pagination.page}', context);
      expect(result).toBe('https://example.com/page/2');
    });
  });

  describe('resolveObject', () => {
    it('should resolve all string values', () => {
      const obj = {
        title: '${extracted.title}',
        page: '${pagination.page}',
      };

      const result = resolveObject(obj, context);

      expect(result).toEqual({
        title: 'Test Title',
        page: '2',
      });
    });

    it('should resolve nested objects', () => {
      const obj = {
        outer: {
          inner: '${extracted.title}',
        },
      };

      const result = resolveObject(obj, context);

      expect(result).toEqual({
        outer: {
          inner: 'Test Title',
        },
      });
    });

    it('should resolve arrays', () => {
      const obj = {
        items: ['${extracted.title}', '${pagination.page}'],
      };

      const result = resolveObject(obj, context);

      expect(result).toEqual({
        items: ['Test Title', '2'],
      });
    });
  });

  describe('context update functions', () => {
    it('updateUrlContext should update URL info', () => {
      const updated = updateUrlContext(context, 'https://new.com/path');

      expect(updated.url.full).toBe('https://new.com/path');
      expect(updated.url.host).toBe('new.com');
    });

    it('updatePaginationContext should update pagination', () => {
      const updated = updatePaginationContext(context, { page: 5 });

      expect(updated.pagination.page).toBe(5);
      expect(updated.pagination.limit).toBe(10); // unchanged
    });

    it('mergeExtracted should merge extracted data', () => {
      const updated = mergeExtracted(context, { newKey: 'newValue' });

      expect(updated.extracted.title).toBe('Test Title');
      expect(updated.extracted.newKey).toBe('newValue');
    });

    it('setSharedVariable should set shared variable', () => {
      const updated = setSharedVariable(context, 'key', 'value');

      expect(updated.shared.key).toBe('value');
    });
  });

  describe('validation functions', () => {
    it('findVariables should find all variables', () => {
      const template = 'Hello ${name}, page ${page|default:1}';
      const vars = findVariables(template);

      expect(vars).toEqual(['name', 'page|default:1']);
    });

    it('validateTemplate should report missing variables', () => {
      const template = '${extracted.title} - ${missing}';
      const validation = validateTemplate(template, context);

      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('missing');
    });

    it('validateTemplate should pass with defaults', () => {
      const template = '${extracted.title} - ${missing|default:N/A}';
      const validation = validateTemplate(template, context);

      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });
  });
});
