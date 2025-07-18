import { describe, expect, test } from 'vitest';
import { getFileConfig } from '$lib/services/contents/file/config';

/**
 * @import { InternalI18nOptions } from '$lib/types/private';
 */

describe('Test getFileConfig()', () => {
  const rawFolderCollection = {
    name: 'posts',
    folder: '/content/posts',
  };

  const rawFileCollection = {
    name: 'data',
    files: [],
  };

  const rawFileCollectionFrontMatterFile = {
    name: 'members',
    file: 'data/members.md',
    fields: [],
  };

  const rawFileCollectionYamlFile = {
    name: 'members',
    file: 'data/members.yml',
    fields: [],
  };

  const rawFileCollectionJsonFile = {
    name: 'members',
    file: 'data/members.json',
    fields: [],
  };

  /** @type {InternalI18nOptions} */
  const i18nDisabled = {
    i18nEnabled: false,
    allLocales: ['_default'],
    initialLocales: ['_default'],
    defaultLocale: '_default',
    structure: 'single_file',
    structureMap: {
      i18nSingleFile: false,
      i18nMultiFile: false,
      i18nMultiFolder: false,
      i18nRootMultiFolder: false,
    },
    canonicalSlug: { key: 'translationKey', value: '{{slug}}' },
    omitDefaultLocaleFromFileName: false,
  };

  /** @type {InternalI18nOptions} */
  const i18nSingleFile = {
    i18nEnabled: false,
    allLocales: ['en', 'fr'],
    initialLocales: ['en', 'fr'],
    defaultLocale: 'en',
    structure: 'single_file',
    structureMap: {
      i18nSingleFile: true,
      i18nMultiFile: false,
      i18nMultiFolder: false,
      i18nRootMultiFolder: false,
    },
    canonicalSlug: { key: 'translationKey', value: '{{slug}}' },
    omitDefaultLocaleFromFileName: false,
  };

  /** @type {InternalI18nOptions} */
  const i18nMultiFile = {
    i18nEnabled: true,
    allLocales: ['en', 'fr'],
    initialLocales: ['en', 'fr'],
    defaultLocale: 'en',
    structure: 'multiple_files',
    structureMap: {
      i18nSingleFile: false,
      i18nMultiFile: true,
      i18nMultiFolder: false,
      i18nRootMultiFolder: false,
    },
    canonicalSlug: { key: 'translationKey', value: '{{slug}}' },
    omitDefaultLocaleFromFileName: false,
  };

  /** @type {InternalI18nOptions} */
  const i18nMultiFolder = {
    i18nEnabled: true,
    allLocales: ['en', 'fr'],
    initialLocales: ['en', 'fr'],
    defaultLocale: 'en',
    structure: 'multiple_folders',
    structureMap: {
      i18nSingleFile: false,
      i18nMultiFile: false,
      i18nMultiFolder: true,
      i18nRootMultiFolder: false,
    },
    canonicalSlug: { key: 'translationKey', value: '{{slug}}' },
    omitDefaultLocaleFromFileName: false,
  };

  /** @type {InternalI18nOptions} */
  const i18nRootMultiFolder = {
    i18nEnabled: true,
    allLocales: ['en', 'fr'],
    initialLocales: ['en', 'fr'],
    defaultLocale: 'en',
    structure: 'multiple_folders_i18n_root',
    structureMap: {
      i18nSingleFile: false,
      i18nMultiFile: false,
      i18nMultiFolder: false,
      i18nRootMultiFolder: true,
    },
    canonicalSlug: { key: 'translationKey', value: '{{slug}}' },
    omitDefaultLocaleFromFileName: false,
  };

  test('entry collection without i18n', () => {
    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?)\.md$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          path: '{{slug}}/index',
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: 'content/posts',
      subPath: '{{slug}}/index',
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?\/index)\.md$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          path: '{{slug}}/index',
          format: 'yaml-frontmatter',
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'md',
      format: 'yaml-frontmatter',
      basePath: 'content/posts',
      subPath: '{{slug}}/index',
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?\/index)\.md$/,
      fullPath: undefined,
      fmDelimiters: ['---', '---'],
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          extension: 'yml',
          yaml_quote: true,
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?)\.yml$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: true,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          extension: 'json',
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'json',
      format: 'json',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?)\.json$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });
  });

  test('entry collection with single-file i18n', () => {
    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
        },
        _i18n: i18nSingleFile,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?)\.md$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          path: '{{slug}}/index',
        },
        _i18n: i18nSingleFile,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: 'content/posts',
      subPath: '{{slug}}/index',
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?\/index)\.md$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          path: '{{slug}}/index',
          format: 'yaml-frontmatter',
        },
        _i18n: i18nSingleFile,
      }),
    ).toEqual({
      extension: 'md',
      format: 'yaml-frontmatter',
      basePath: 'content/posts',
      subPath: '{{slug}}/index',
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?\/index)\.md$/,
      fullPath: undefined,
      fmDelimiters: ['---', '---'],
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          extension: 'yml',
          yaml_quote: true,
        },
        _i18n: i18nSingleFile,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?)\.yml$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: true,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          extension: 'json',
        },
        _i18n: i18nSingleFile,
      }),
    ).toEqual({
      extension: 'json',
      format: 'json',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?)\.json$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });
  });

  test('entry collection with multi-file i18n', () => {
    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?)\.(?<locale>en|fr)\.md$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          path: '{{slug}}/index',
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: 'content/posts',
      subPath: '{{slug}}/index',
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?\/index)\.(?<locale>en|fr)\.md$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          path: '{{slug}}/index',
          format: 'yaml-frontmatter',
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'md',
      format: 'yaml-frontmatter',
      basePath: 'content/posts',
      subPath: '{{slug}}/index',
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?\/index)\.(?<locale>en|fr)\.md$/,
      fullPath: undefined,
      fmDelimiters: ['---', '---'],
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          extension: 'yml',
          yaml_quote: true,
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?)\.(?<locale>en|fr)\.yml$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: true,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          extension: 'json',
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'json',
      format: 'json',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<subPath>[^/]+?)\.(?<locale>en|fr)\.json$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });
  });

  test('entry collection with multi-folder i18n', () => {
    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
        },
        _i18n: i18nMultiFolder,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<locale>en|fr)\/(?<subPath>[^/]+?)\.md$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          path: '{{slug}}/index',
        },
        _i18n: i18nMultiFolder,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: 'content/posts',
      subPath: '{{slug}}/index',
      fullPathRegEx: /^content\/posts\/(?<locale>en|fr)\/(?<subPath>[^/]+?\/index)\.md$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          path: '{{slug}}/index',
          format: 'yaml-frontmatter',
        },
        _i18n: i18nMultiFolder,
      }),
    ).toEqual({
      extension: 'md',
      format: 'yaml-frontmatter',
      basePath: 'content/posts',
      subPath: '{{slug}}/index',
      fullPathRegEx: /^content\/posts\/(?<locale>en|fr)\/(?<subPath>[^/]+?\/index)\.md$/,
      fullPath: undefined,
      fmDelimiters: ['---', '---'],
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          extension: 'yml',
          yaml_quote: true,
        },
        _i18n: i18nMultiFolder,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<locale>en|fr)\/(?<subPath>[^/]+?)\.yml$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: true,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          extension: 'json',
        },
        _i18n: i18nMultiFolder,
      }),
    ).toEqual({
      extension: 'json',
      format: 'json',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^content\/posts\/(?<locale>en|fr)\/(?<subPath>[^/]+?)\.json$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });
  });

  test('entry collection with multi-folder-at-root i18n', () => {
    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
        },
        _i18n: i18nRootMultiFolder,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^(?<locale>en|fr)\/content\/posts\/(?<subPath>[^/]+?)\.md$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          path: '{{slug}}/index',
        },
        _i18n: i18nRootMultiFolder,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: 'content/posts',
      subPath: '{{slug}}/index',
      fullPathRegEx: /^(?<locale>en|fr)\/content\/posts\/(?<subPath>[^/]+?\/index)\.md$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          path: '{{slug}}/index',
          format: 'yaml-frontmatter',
        },
        _i18n: i18nRootMultiFolder,
      }),
    ).toEqual({
      extension: 'md',
      format: 'yaml-frontmatter',
      basePath: 'content/posts',
      subPath: '{{slug}}/index',
      fullPathRegEx: /^(?<locale>en|fr)\/content\/posts\/(?<subPath>[^/]+?\/index)\.md$/,
      fullPath: undefined,
      fmDelimiters: ['---', '---'],
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          extension: 'yml',
          yaml_quote: true,
        },
        _i18n: i18nRootMultiFolder,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^(?<locale>en|fr)\/content\/posts\/(?<subPath>[^/]+?)\.yml$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: true,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFolderCollection,
          extension: 'json',
        },
        _i18n: i18nRootMultiFolder,
      }),
    ).toEqual({
      extension: 'json',
      format: 'json',
      basePath: 'content/posts',
      subPath: undefined,
      fullPathRegEx: /^(?<locale>en|fr)\/content\/posts\/(?<subPath>[^/]+?)\.json$/,
      fullPath: undefined,
      fmDelimiters: undefined,
      yamlQuote: false,
    });
  });

  test('file collection without i18n', () => {
    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
        },
        file: {
          ...rawFileCollectionFrontMatterFile,
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.md',
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          format: 'yaml-frontmatter',
        },
        file: {
          ...rawFileCollectionYamlFile,
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml-frontmatter',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.yml',
      fmDelimiters: ['---', '---'],
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          extension: 'yml',
          yaml_quote: true,
        },
        file: {
          ...rawFileCollectionYamlFile,
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.yml',
      fmDelimiters: undefined,
      yamlQuote: true,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          extension: 'json',
        },
        file: {
          ...rawFileCollectionJsonFile,
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'json',
      format: 'json',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.json',
      fmDelimiters: undefined,
      yamlQuote: false,
    });
  });

  test('file collection with single-file i18n', () => {
    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
        },
        file: {
          ...rawFileCollectionFrontMatterFile,
        },
        _i18n: i18nSingleFile,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.md',
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          format: 'yaml-frontmatter',
        },
        file: {
          ...rawFileCollectionYamlFile,
        },
        _i18n: i18nSingleFile,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml-frontmatter',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.yml',
      fmDelimiters: ['---', '---'],
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          extension: 'yml',
          yaml_quote: true,
        },
        file: {
          ...rawFileCollectionYamlFile,
        },
        _i18n: i18nSingleFile,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.yml',
      fmDelimiters: undefined,
      yamlQuote: true,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          extension: 'json',
        },
        file: {
          ...rawFileCollectionJsonFile,
        },
        _i18n: i18nSingleFile,
      }),
    ).toEqual({
      extension: 'json',
      format: 'json',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.json',
      fmDelimiters: undefined,
      yamlQuote: false,
    });
  });

  test('file collection with multi-file i18n', () => {
    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
        },
        file: {
          ...rawFileCollectionFrontMatterFile,
          file: 'data/members.{{locale}}.md',
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.en.md',
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          format: 'yaml-frontmatter',
        },
        file: {
          ...rawFileCollectionYamlFile,
          file: 'data/members.{{locale}}.yml',
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml-frontmatter',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.en.yml',
      fmDelimiters: ['---', '---'],
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          extension: 'yml',
          yaml_quote: true,
        },
        file: {
          ...rawFileCollectionYamlFile,
          file: 'data/members.{{locale}}.yml',
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.en.yml',
      fmDelimiters: undefined,
      yamlQuote: true,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          extension: 'json',
        },
        file: {
          ...rawFileCollectionJsonFile,
          file: 'data/members.{{locale}}.json',
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'json',
      format: 'json',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.en.json',
      fmDelimiters: undefined,
      yamlQuote: false,
    });
  });

  test('file collection with multi-folder i18n', () => {
    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
        },
        file: {
          ...rawFileCollectionFrontMatterFile,
          file: 'data/{{locale}}/members.md',
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'md',
      format: 'frontmatter',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/en/members.md',
      fmDelimiters: undefined,
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          format: 'yaml-frontmatter',
        },
        file: {
          ...rawFileCollectionYamlFile,
          file: 'data/{{locale}}/members.yml',
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml-frontmatter',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/en/members.yml',
      fmDelimiters: ['---', '---'],
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          extension: 'yml',
          yaml_quote: true,
        },
        file: {
          ...rawFileCollectionYamlFile,
          file: 'data/{{locale}}/members.yml',
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'yml',
      format: 'yaml',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/en/members.yml',
      fmDelimiters: undefined,
      yamlQuote: true,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          extension: 'json',
        },
        file: {
          ...rawFileCollectionJsonFile,
          file: 'data/{{locale}}/members.json',
        },
        _i18n: i18nMultiFile,
      }),
    ).toEqual({
      extension: 'json',
      format: 'json',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/en/members.json',
      fmDelimiters: undefined,
      yamlQuote: false,
    });
  });

  test('file collection with format override', () => {
    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
        },
        file: {
          ...rawFileCollectionFrontMatterFile,
          format: 'yaml-frontmatter',
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'md',
      format: 'yaml-frontmatter',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.md',
      fmDelimiters: ['---', '---'],
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          format: 'yaml-frontmatter',
        },
        file: {
          ...rawFileCollectionFrontMatterFile,
          format: 'toml-frontmatter',
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'md',
      format: 'toml-frontmatter',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.md',
      fmDelimiters: ['+++', '+++'],
      yamlQuote: false,
    });

    expect(
      getFileConfig({
        rawCollection: {
          ...rawFileCollection,
          format: 'yaml-frontmatter',
        },
        file: {
          ...rawFileCollectionJsonFile,
          format: 'json',
        },
        _i18n: i18nDisabled,
      }),
    ).toEqual({
      extension: 'json',
      format: 'json',
      basePath: undefined,
      subPath: undefined,
      fullPathRegEx: undefined,
      fullPath: 'data/members.json',
      fmDelimiters: undefined,
      yamlQuote: false,
    });
  });
});
