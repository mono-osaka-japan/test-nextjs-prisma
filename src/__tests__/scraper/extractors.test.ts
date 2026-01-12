import {
  extract,
  extractByCss,
  extractByRegex,
  extractByJson,
  extractLinks,
  extractMetadata,
  ExtractionRule,
} from '@/lib/scraper/extractors';
import { load } from 'cheerio';

describe('Extractors', () => {
  describe('extractByCss', () => {
    const html = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1 class="title">Hello World</h1>
          <p class="description">This is a test page</p>
          <ul class="items">
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
          <a href="https://example.com" class="link">Example Link</a>
          <span class="price">¥1,234</span>
        </body>
      </html>
    `;
    const $ = load(html);

    it('should extract text content', () => {
      const rule: ExtractionRule = {
        name: 'title',
        type: 'css',
        selector: 'h1.title',
      };

      const result = extractByCss($, rule);
      expect(result).toBe('Hello World');
    });

    it('should extract attribute value', () => {
      const rule: ExtractionRule = {
        name: 'link',
        type: 'css',
        selector: 'a.link',
        attribute: 'href',
      };

      const result = extractByCss($, rule);
      expect(result).toBe('https://example.com');
    });

    it('should extract multiple elements', () => {
      const rule: ExtractionRule = {
        name: 'items',
        type: 'css',
        selector: 'ul.items li',
        multiple: true,
      };

      const result = extractByCss($, rule);
      expect(result).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    it('should apply transform functions', () => {
      const rule: ExtractionRule = {
        name: 'price',
        type: 'css',
        selector: '.price',
        transform: ['extractNumbers', 'parseInt'],
      };

      const result = extractByCss($, rule);
      expect(result).toBe('1234');
    });

    it('should return default value when not found', () => {
      const rule: ExtractionRule = {
        name: 'missing',
        type: 'css',
        selector: '.not-exists',
        default: 'N/A',
      };

      const result = extractByCss($, rule);
      expect(result).toBe('N/A');
    });

    it('should return null when not found and no default', () => {
      const rule: ExtractionRule = {
        name: 'missing',
        type: 'css',
        selector: '.not-exists',
      };

      const result = extractByCss($, rule);
      expect(result).toBeNull();
    });
  });

  describe('extractByRegex', () => {
    const content = `
      Email: test@example.com
      Phone: 123-456-7890
      Price: $99.99
      IDs: 001, 002, 003
    `;

    it('should extract single match', () => {
      const rule: ExtractionRule = {
        name: 'email',
        type: 'regex',
        selector: '[\\w.-]+@[\\w.-]+\\.\\w+',
      };

      const result = extractByRegex(content, rule);
      expect(result).toBe('test@example.com');
    });

    it('should extract with capture group', () => {
      const rule: ExtractionRule = {
        name: 'price',
        type: 'regex',
        selector: '\\$([\\d.]+)',
      };

      const result = extractByRegex(content, rule);
      expect(result).toBe('99.99');
    });

    it('should extract multiple matches', () => {
      const rule: ExtractionRule = {
        name: 'ids',
        type: 'regex',
        selector: '\\d{3}',
        multiple: true,
      };

      const result = extractByRegex(content, rule);
      expect(result).toEqual(['123', '456', '789', '001', '002', '003']);
    });

    it('should return default on no match', () => {
      const rule: ExtractionRule = {
        name: 'missing',
        type: 'regex',
        selector: 'NOT_FOUND_PATTERN',
        default: 'unknown',
      };

      const result = extractByRegex(content, rule);
      expect(result).toBe('unknown');
    });
  });

  describe('extractByJson', () => {
    const jsonContent = JSON.stringify({
      user: {
        name: 'John',
        email: 'john@example.com',
        tags: ['admin', 'developer'],
      },
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
    });

    it('should extract nested value', () => {
      const rule: ExtractionRule = {
        name: 'userName',
        type: 'json',
        selector: 'user.name',
      };

      const result = extractByJson(jsonContent, rule);
      expect(result).toBe('John');
    });

    it('should extract array element', () => {
      const rule: ExtractionRule = {
        name: 'firstTag',
        type: 'json',
        selector: 'user.tags[0]',
      };

      const result = extractByJson(jsonContent, rule);
      expect(result).toBe('admin');
    });

    it('should extract array as multiple', () => {
      const rule: ExtractionRule = {
        name: 'tags',
        type: 'json',
        selector: 'user.tags',
        multiple: true,
      };

      const result = extractByJson(jsonContent, rule);
      expect(result).toEqual(['admin', 'developer']);
    });

    it('should return default on missing path', () => {
      const rule: ExtractionRule = {
        name: 'missing',
        type: 'json',
        selector: 'user.address.city',
        default: 'Unknown',
      };

      const result = extractByJson(jsonContent, rule);
      expect(result).toBe('Unknown');
    });
  });

  describe('extract (main function)', () => {
    const html = `
      <html>
        <head>
          <title>Product Page</title>
          <meta name="description" content="Buy our product">
        </head>
        <body>
          <h1 class="product-name">Awesome Product</h1>
          <span class="price">$49.99</span>
          <div class="rating">4.5 stars</div>
        </body>
      </html>
    `;

    it('should extract multiple rules', () => {
      const rules: ExtractionRule[] = [
        { name: 'title', type: 'css', selector: 'h1.product-name' },
        { name: 'price', type: 'css', selector: '.price' },
        { name: 'rating', type: 'regex', selector: '([\\d.]+) stars' },
      ];

      const result = extract({ html, url: 'https://example.com' }, rules);

      expect(result).toEqual({
        title: 'Awesome Product',
        price: '$49.99',
        rating: '4.5',
      });
    });

    it('should throw on required field not found', () => {
      const rules: ExtractionRule[] = [
        { name: 'required', type: 'css', selector: '.not-exists', required: true },
      ];

      expect(() => {
        extract({ html, url: 'https://example.com' }, rules);
      }).toThrow('Required field "required" not found');
    });
  });

  describe('extractLinks', () => {
    const html = `
      <html>
        <body>
          <a href="/page1">Page 1</a>
          <a href="/page2">Page 2</a>
          <a href="https://other.com/page">External</a>
          <a href="/page1">Duplicate</a>
        </body>
      </html>
    `;

    it('should extract all unique links', () => {
      const links = extractLinks(html, 'https://example.com');

      expect(links).toHaveLength(3);
      expect(links).toContain('https://example.com/page1');
      expect(links).toContain('https://example.com/page2');
      expect(links).toContain('https://other.com/page');
    });
  });

  describe('extractMetadata', () => {
    const html = `
      <html>
        <head>
          <title>Test Page Title</title>
          <meta name="description" content="Page description">
          <meta name="keywords" content="test, keywords">
          <meta property="og:title" content="OG Title">
          <meta property="og:image" content="https://example.com/image.jpg">
          <link rel="canonical" href="https://example.com/canonical">
        </head>
        <body></body>
      </html>
    `;

    it('should extract all metadata', () => {
      const metadata = extractMetadata(html);

      expect(metadata).toEqual({
        title: 'Test Page Title',
        description: 'Page description',
        keywords: 'test, keywords',
        ogTitle: 'OG Title',
        ogImage: 'https://example.com/image.jpg',
        canonical: 'https://example.com/canonical',
      });
    });
  });
});
