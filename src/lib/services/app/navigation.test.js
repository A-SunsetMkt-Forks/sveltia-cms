import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  goBack,
  goto,
  openProductionSite,
  parseLocation,
  updateContentFromHashChange,
} from './navigation';

/**
 * Mock HashChangeEvent class for testing.
 */
class MockHashChangeEvent extends Event {
  /**
   * Create a mock HashChangeEvent.
   * @param {string} type Event type.
   * @param {object} [eventInit] Event initialization object.
   * @param {string} [eventInit.oldURL] Old URL.
   * @param {string} [eventInit.newURL] New URL.
   */
  constructor(type, eventInit = {}) {
    super(type);
    this.oldURL = eventInit.oldURL || '';
    this.newURL = eventInit.newURL || '';

    // Define isTrusted as a configurable property
    Object.defineProperty(this, 'isTrusted', {
      value: true,
      writable: true,
      configurable: true,
    });
  }
}

// Mock browser globals
Object.defineProperty(globalThis, 'window', {
  value: {
    location: {
      href: 'https://example.com/#/collections',
      origin: 'https://example.com',
      pathname: '/',
      hash: '#/collections',
    },
    history: {
      pushState: vi.fn(),
      replaceState: vi.fn(),
      back: vi.fn(),
      state: null,
    },
    open: vi.fn(),
    dispatchEvent: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(globalThis, 'document', {
  value: {
    startViewTransition: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(globalThis, 'HashChangeEvent', {
  value: MockHashChangeEvent,
  writable: true,
});

// Mock dependencies
vi.mock('$lib/services/assets/view', () => ({
  showAssetOverlay: { subscribe: vi.fn() },
}));

vi.mock('$lib/services/config', () => ({
  siteConfig: { subscribe: vi.fn() },
}));

vi.mock('$lib/services/contents/editor', () => ({
  showContentOverlay: { subscribe: vi.fn() },
}));

vi.mock('$lib/services/user/env', () => ({
  isSmallScreen: { subscribe: vi.fn() },
}));

vi.mock('svelte/store', () => ({
  derived: vi.fn(),
  get: vi.fn(),
  writable: vi.fn(),
}));

vi.mock('@sveltia/utils/misc', () => ({
  sleep: vi.fn(),
}));

vi.mock('svelte', () => ({
  flushSync: vi.fn(),
}));

describe('navigation', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/#/collections',
        origin: 'https://example.com',
        pathname: '/',
        hash: '#/collections',
      },
      writable: true,
    });

    // Mock window.history
    Object.defineProperty(window, 'history', {
      value: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
        back: vi.fn(),
        state: null,
      },
      writable: true,
      configurable: true,
    });

    // Mock document
    Object.defineProperty(document, 'startViewTransition', {
      value: vi.fn(),
      writable: true,
    });

    // Mock window.open
    Object.defineProperty(window, 'open', {
      value: vi.fn(),
      writable: true,
    });

    // Mock event dispatching
    Object.defineProperty(window, 'dispatchEvent', {
      value: vi.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseLocation', () => {
    it('should parse current location when no href provided', () => {
      window.location.href = 'https://example.com/#/collections?filter=all';

      const result = parseLocation();

      expect(result).toEqual({
        path: '/collections',
        params: { filter: 'all' },
      });
    });

    it('should parse provided href', () => {
      const result = parseLocation('https://example.com/#/assets?view=grid&page=2');

      expect(result).toEqual({
        path: '/assets',
        params: { view: 'grid', page: '2' },
      });
    });

    it('should handle encoded characters in path', () => {
      const result = parseLocation('https://example.com/#/collections/my%20collection');

      expect(result).toEqual({
        path: '/collections/my collection',
        params: {},
      });
    });

    it('should handle empty hash', () => {
      const result = parseLocation('https://example.com/#');

      expect(result).toEqual({
        path: '/',
        params: {},
      });
    });

    it('should handle complex query parameters', () => {
      const result = parseLocation('https://example.com/#/search?q=test&sort=date&tags=tag1,tag2');

      expect(result).toEqual({
        path: '/search',
        params: { q: 'test', sort: 'date', tags: 'tag1,tag2' },
      });
    });
  });

  describe('updateContentFromHashChange', () => {
    it('should call updateContent immediately for non-trusted events', () => {
      const updateContent = vi.fn();

      const event = new HashChangeEvent('hashchange', {
        oldURL: 'https://example.com/#/old',
        newURL: 'https://example.com/#/new',
      });

      // Make event non-trusted
      Object.defineProperty(event, 'isTrusted', { value: false });

      updateContentFromHashChange(event, updateContent, /^\/collections/);

      expect(updateContent).toHaveBeenCalledTimes(1);
    });

    it('should handle trusted navigation events with transition', () => {
      const updateContent = vi.fn();

      const event = new HashChangeEvent('hashchange', {
        oldURL: 'https://example.com/#/collections',
        newURL: 'https://example.com/#/collections/posts',
      });

      Object.defineProperty(event, 'isTrusted', { value: true });

      vi.mocked(get).mockReturnValue(false); // Not small screen

      updateContentFromHashChange(event, updateContent, /^\/collections/);

      expect(updateContent).toHaveBeenCalledTimes(1);
    });

    it('should detect forward navigation', () => {
      const updateContent = vi.fn();
      const startViewTransition = vi.fn();

      document.startViewTransition = startViewTransition;

      const event = new HashChangeEvent('hashchange', {
        oldURL: 'https://example.com/#/collections',
        newURL: 'https://example.com/#/collections/posts/new',
      });

      Object.defineProperty(event, 'isTrusted', { value: true });
      vi.mocked(get).mockReturnValue(true); // Small screen

      updateContentFromHashChange(event, updateContent, /^\/collections/);

      expect(startViewTransition).toHaveBeenCalledWith({
        types: ['forwards'],
        update: expect.any(Function),
      });
    });

    it('should detect backward navigation', () => {
      const updateContent = vi.fn();
      const startViewTransition = vi.fn();

      document.startViewTransition = startViewTransition;

      const event = new HashChangeEvent('hashchange', {
        oldURL: 'https://example.com/#/collections/posts/new',
        newURL: 'https://example.com/#/collections',
      });

      Object.defineProperty(event, 'isTrusted', { value: true });
      vi.mocked(get).mockReturnValue(true); // Small screen

      updateContentFromHashChange(event, updateContent, /^\/collections/);

      expect(startViewTransition).toHaveBeenCalledWith({
        types: ['backwards'],
        update: expect.any(Function),
      });
    });

    it('should detect unknown navigation when not in same section', () => {
      const updateContent = vi.fn();
      const startViewTransition = vi.fn();

      document.startViewTransition = startViewTransition;

      const event = new HashChangeEvent('hashchange', {
        oldURL: 'https://example.com/#/collections',
        newURL: 'https://example.com/#/assets',
      });

      Object.defineProperty(event, 'isTrusted', { value: true });
      vi.mocked(get).mockReturnValue(true); // Small screen

      updateContentFromHashChange(event, updateContent, /^\/collections/);

      expect(startViewTransition).toHaveBeenCalledWith({
        types: ['unknown'],
        update: expect.any(Function),
      });
    });
  });

  describe('goto', () => {
    it('should navigate to new path with default options', async () => {
      await goto('/collections/posts');

      expect(window.history.pushState).toHaveBeenCalledWith(
        { from: 'https://example.com/#/collections' },
        '',
        'https://example.com/#/collections/posts',
      );
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(HashChangeEvent));
    });

    it('should replace state when replaceState is true', async () => {
      await goto('/assets', { replaceState: true });

      expect(window.history.replaceState).toHaveBeenCalledWith(
        { from: 'https://example.com/#/collections' },
        '',
        'https://example.com/#/assets',
      );
    });

    it('should include custom state', async () => {
      const customState = { filter: 'images' };

      await goto('/assets', { state: customState });

      expect(window.history.pushState).toHaveBeenCalledWith(
        { filter: 'images', from: 'https://example.com/#/collections' },
        '',
        'https://example.com/#/assets',
      );
    });

    it('should not notify change when notifyChange is false', async () => {
      await goto('/assets', { notifyChange: false });

      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });

    it('should use view transition when supported and on small screen', async () => {
      const startViewTransition = vi.fn();

      document.startViewTransition = startViewTransition;
      vi.mocked(get).mockReturnValue(true); // Small screen

      await goto('/assets', { transitionType: 'forwards' });

      expect(startViewTransition).toHaveBeenCalledWith({
        types: ['forwards'],
        update: expect.any(Function),
      });
    });
  });

  describe('goBack', () => {
    it('should use history.back() when history state has from property', () => {
      // Mock history with state
      Object.defineProperty(window, 'history', {
        value: {
          pushState: vi.fn(),
          replaceState: vi.fn(),
          back: vi.fn(),
          state: { from: 'https://example.com/#/collections' },
        },
        writable: true,
        configurable: true,
      });

      const startViewTransition = vi.fn();

      document.startViewTransition = startViewTransition;
      vi.mocked(get).mockReturnValue(true); // Small screen

      goBack('/default');

      expect(startViewTransition).toHaveBeenCalledWith({
        types: ['backwards'],
        update: expect.any(Function),
      });
    });

    it('should navigate to fallback path when no history state', async () => {
      // Mock history without state
      Object.defineProperty(window, 'history', {
        value: {
          pushState: vi.fn(),
          replaceState: vi.fn(),
          back: vi.fn(),
          state: null,
        },
        writable: true,
        configurable: true,
      });

      goBack('/default');

      expect(window.history.pushState).toHaveBeenCalledWith(
        { from: 'https://example.com/#/collections' },
        '',
        'https://example.com/#/default',
      );
    });

    it('should pass options to goto when using fallback', async () => {
      // Mock history without state
      Object.defineProperty(window, 'history', {
        value: {
          pushState: vi.fn(),
          replaceState: vi.fn(),
          back: vi.fn(),
          state: null,
        },
        writable: true,
        configurable: true,
      });

      const options = { replaceState: true, state: { test: true } };

      goBack('/default', options);

      expect(window.history.replaceState).toHaveBeenCalledWith(
        { test: true, from: 'https://example.com/#/collections' },
        '',
        'https://example.com/#/default',
      );
    });
  });

  describe('openProductionSite', () => {
    it('should open display_url when available', () => {
      vi.mocked(get).mockReturnValue({
        display_url: 'https://my-site.com',
        _siteURL: 'https://fallback.com',
      });

      openProductionSite();

      expect(window.open).toHaveBeenCalledWith('https://my-site.com', '_blank');
    });

    it('should fall back to _siteURL when no display_url', () => {
      vi.mocked(get).mockReturnValue({
        _siteURL: 'https://fallback.com',
      });

      openProductionSite();

      expect(window.open).toHaveBeenCalledWith('https://fallback.com', '_blank');
    });

    it('should use root path when no URLs available', () => {
      vi.mocked(get).mockReturnValue({});

      openProductionSite();

      expect(window.open).toHaveBeenCalledWith('/', '_blank');
    });
  });
});
