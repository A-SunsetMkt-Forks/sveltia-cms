import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import unsplashService from './unsplash';

// Mock dependencies
vi.mock('svelte/store', () => ({
  get: vi.fn(),
}));

vi.mock('svelte-i18n', () => ({
  locale: { subscribe: vi.fn() },
}));

vi.mock('@sveltia/utils/misc', () => ({
  sleep: vi.fn(),
}));

// Setup global fetch mock
global.fetch = vi.fn();

describe('integrations/media-libraries/stock/unsplash', () => {
  const mockApiKey = 'test-api-key-12345678901234567890';

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock the locale store to return 'en-US'
    const { get } = await import('svelte/store');

    vi.mocked(get).mockReturnValue('en-US');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('service configuration', () => {
    it('should have correct service configuration', () => {
      expect(unsplashService.serviceType).toBe('stock_assets');
      expect(unsplashService.serviceId).toBe('unsplash');
      expect(unsplashService.serviceLabel).toBe('Unsplash');
      expect(unsplashService.serviceURL).toBe('https://unsplash.com/');
      expect(unsplashService.showServiceLink).toBe(true);
      expect(unsplashService.hotlinking).toBe(true);
      expect(unsplashService.authType).toBe('api_key');
      expect(unsplashService.developerURL).toBe('https://unsplash.com/developers');
      expect(unsplashService.apiKeyURL).toBe('https://unsplash.com/oauth/applications');
      expect(unsplashService.apiKeyPattern).toBeInstanceOf(RegExp);
    });

    it('should validate API key pattern', () => {
      const { apiKeyPattern } = unsplashService;

      if (apiKeyPattern) {
        // Valid API keys
        expect(apiKeyPattern.test('abcd1234-efgh5678-ijkl9012-mnop3456-qrst7890')).toBe(true);
        expect(apiKeyPattern.test('1234567890abcdef1234567890abcdef12345678')).toBe(true);

        // Invalid API keys
        expect(apiKeyPattern.test('short')).toBe(false);
        expect(apiKeyPattern.test('contains@special#chars')).toBe(false);
        expect(apiKeyPattern.test('')).toBe(false);
      }
    });
  });

  describe('search function', () => {
    const mockSearchResponse = {
      results: [
        {
          id: '12345',
          description: 'Beautiful sunset over mountains',
          alt_description: 'Mountain landscape at sunset',
          urls: {
            regular:
              'https://images.unsplash.com/photo-12345?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MDcxMzJ8MHwxfHNlYXJjaHwxfHxzdW5zZXR8ZW58MHx8fHwxNjk5NTczNjAw&ixlib=rb-4.0.3&q=80&w=1080',
            thumb:
              'https://images.unsplash.com/photo-12345?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MDcxMzJ8MHwxfHNlYXJjaHwxfHxzdW5zZXR8ZW58MHx8fHwxNjk5NTczNjAw&ixlib=rb-4.0.3&q=80&w=200',
          },
          user: {
            username: 'johndoe',
            name: 'John Doe',
          },
        },
        {
          id: '67890',
          description: null,
          alt_description: 'Ocean waves crashing on shore',
          urls: {
            regular:
              'https://images.unsplash.com/photo-67890?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MDcxMzJ8MHwxfHNlYXJjaHwyfHxzdW5zZXR8ZW58MHx8fHwxNjk5NTczNjAw&ixlib=rb-4.0.3&q=80&w=1080',
            thumb:
              'https://images.unsplash.com/photo-67890?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MDcxMzJ8MHwxfHNlYXJjaHwyfHxzdW5zZXR8ZW58MHx8fHwxNjk5NTczNjAw&ixlib=rb-4.0.3&q=80&w=200',
          },
          user: {
            username: 'janesmith',
            name: 'Jane Smith',
          },
        },
      ],
      total_pages: 1,
    };

    const mockCuratedResponse = [
      {
        id: '11111',
        description: 'City skyline at night',
        alt_description: 'Urban landscape with lights',
        urls: {
          regular:
            'https://images.unsplash.com/photo-11111?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MDcxMzJ8MHwxfHJhbmRvbXx8fHx8fHx8fDE2OTk1NzM2MDA&ixlib=rb-4.0.3&q=80&w=1080',
          thumb:
            'https://images.unsplash.com/photo-11111?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MDcxMzJ8MHwxfHJhbmRvbXx8fHx8fHx8fDE2OTk1NzM2MDA&ixlib=rb-4.0.3&q=80&w=200',
        },
        user: {
          username: 'photographer',
          name: 'Pro Photographer',
        },
      },
    ];

    it('should search for images with query', async () => {
      const fetchMock = vi.mocked(fetch);

      fetchMock.mockResolvedValueOnce(
        /** @type {any} */ ({
          ok: true,
          json: vi.fn().mockResolvedValue(mockSearchResponse),
        }),
      );

      const results = await unsplashService.search('sunset', { apiKey: mockApiKey });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('https://api.unsplash.com/search/photos'),
        expect.objectContaining({
          headers: { Authorization: `Client-ID ${mockApiKey}` },
        }),
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        id: '12345',
        description: 'Beautiful sunset over mountains — Mountain landscape at sunset',
        previewURL: expect.stringContaining('photo-12345'),
        downloadURL: expect.stringContaining('photo-12345'),
        fileName: 'john-doe-12345-unsplash.jpg',
        kind: 'image',
        credit: expect.stringContaining('John Doe'),
      });

      expect(results[1]).toMatchObject({
        id: '67890',
        description: 'Ocean waves crashing on shore',
        fileName: 'jane-smith-67890-unsplash.jpg',
        kind: 'image',
      });
    });

    it('should fetch curated photos when no query is provided', async () => {
      const fetchMock = vi.mocked(fetch);

      fetchMock.mockResolvedValueOnce(
        /** @type {any} */ ({
          ok: true,
          json: vi.fn().mockResolvedValue(mockCuratedResponse),
        }),
      );

      const results = await unsplashService.search('', { apiKey: mockApiKey });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('https://api.unsplash.com/photos'),
        expect.objectContaining({
          headers: { Authorization: `Client-ID ${mockApiKey}` },
        }),
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: '11111',
        description: 'City skyline at night — Urban landscape with lights',
        fileName: 'pro-photographer-11111-unsplash.jpg',
        kind: 'image',
      });
    });

    it('should handle multiple pages of search results', async () => {
      const { sleep } = await import('@sveltia/utils/misc');
      const sleepMock = vi.mocked(sleep);
      const fetchMock = vi.mocked(fetch);

      // Mock first page response
      fetchMock.mockResolvedValueOnce(
        /** @type {any} */ ({
          ok: true,
          json: vi.fn().mockResolvedValue({
            results: [mockSearchResponse.results[0]],
            total_pages: 2,
          }),
        }),
      );

      // Mock second page response
      fetchMock.mockResolvedValueOnce(
        /** @type {any} */ ({
          ok: true,
          json: vi.fn().mockResolvedValue({
            results: [mockSearchResponse.results[1]],
            total_pages: 2,
          }),
        }),
      );

      const results = await unsplashService.search('nature', { apiKey: mockApiKey });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(sleepMock).toHaveBeenCalledWith(50);
      expect(results).toHaveLength(2);
    });

    it('should handle API errors', async () => {
      const fetchMock = vi.mocked(fetch);

      fetchMock.mockResolvedValueOnce(
        /** @type {any} */ ({
          ok: false,
          status: 401,
        }),
      );

      await expect(unsplashService.search('test', { apiKey: mockApiKey })).rejects.toBeUndefined();
    });

    it('should use supported locale in search parameters', async () => {
      const { get } = await import('svelte/store');

      vi.mocked(get).mockReturnValue('ja-JP'); // Japanese locale

      const fetchMock = vi.mocked(fetch);

      fetchMock.mockResolvedValueOnce(
        /** @type {any} */ ({
          ok: true,
          json: vi.fn().mockResolvedValue(mockSearchResponse),
        }),
      );

      await unsplashService.search('test', { apiKey: mockApiKey });

      const fetchCall = fetchMock.mock.calls[0];
      const url = new URL(/** @type {string} */ (fetchCall?.[0]));

      expect(url.searchParams.get('lang')).toBe('ja');
    });

    it('should fallback to English for unsupported locales', async () => {
      const { get } = await import('svelte/store');

      vi.mocked(get).mockReturnValue('unsupported-locale');

      const fetchMock = vi.mocked(fetch);

      fetchMock.mockResolvedValueOnce(
        /** @type {any} */ ({
          ok: true,
          json: vi.fn().mockResolvedValue(mockSearchResponse),
        }),
      );

      await unsplashService.search('test', { apiKey: mockApiKey });

      const fetchCall = fetchMock.mock.calls[0];
      const url = new URL(/** @type {string} */ (fetchCall?.[0]));

      expect(url.searchParams.get('lang')).toBe('en');
    });

    it('should handle photos without description', async () => {
      const responseWithoutDesc = {
        results: [
          {
            id: '99999',
            description: null,
            alt_description: null,
            urls: {
              regular: 'https://images.unsplash.com/photo-99999',
              thumb: 'https://images.unsplash.com/photo-99999-thumb',
            },
            user: {
              username: 'noname',
              name: 'No Name',
            },
          },
        ],
        total_pages: 1,
      };

      const fetchMock = vi.mocked(fetch);

      fetchMock.mockResolvedValueOnce(
        /** @type {any} */ ({
          ok: true,
          json: vi.fn().mockResolvedValue(responseWithoutDesc),
        }),
      );

      const results = await unsplashService.search('test', { apiKey: mockApiKey });

      expect(results[0].description).toBe('');
      expect(results[0].fileName).toBe('no-name-99999-unsplash.jpg');
    });

    it('should properly format credit links', async () => {
      const fetchMock = vi.mocked(fetch);

      fetchMock.mockResolvedValueOnce(
        /** @type {any} */ ({
          ok: true,
          json: vi.fn().mockResolvedValue(mockSearchResponse),
        }),
      );

      const results = await unsplashService.search('test', { apiKey: mockApiKey });

      expect(results[0].credit).toContain('utm_source=sveltia-cms&utm_medium=referral');
      expect(results[0].credit).toContain(
        'href="https://unsplash.com/@johndoe?utm_source=sveltia-cms&utm_medium=referral"',
      );
      expect(results[0].credit).toContain(
        'href="https://unsplash.com/?utm_source=sveltia-cms&utm_medium=referral"',
      );
    });

    it('should limit to maximum 5 pages for search results', async () => {
      const { sleep } = await import('@sveltia/utils/misc');
      const sleepMock = vi.mocked(sleep);
      const fetchMock = vi.mocked(fetch);

      // Mock responses for 5 pages
      for (let i = 1; i <= 5; i += 1) {
        fetchMock.mockResolvedValueOnce(
          /** @type {any} */ ({
            ok: true,
            json: vi.fn().mockResolvedValue({
              results: [
                {
                  id: `photo${i}`,
                  description: `Photo ${i}`,
                  alt_description: null,
                  urls: { regular: `url${i}`, thumb: `thumb${i}` },
                  user: { username: `user${i}`, name: `User ${i}` },
                },
              ],
              total_pages: 5, // Set consistent total_pages
            }),
          }),
        );
      }

      await unsplashService.search('nature', { apiKey: mockApiKey });

      expect(fetchMock).toHaveBeenCalledTimes(5);
      expect(sleepMock).toHaveBeenCalledTimes(4); // Called between pages
    });
  });
});
