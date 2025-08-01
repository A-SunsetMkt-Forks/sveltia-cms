import { getPathInfo } from '@sveltia/utils/file';
import { IndexedDB } from '@sveltia/utils/storage';

import { allAssets } from '$lib/services/assets';
import { parseAssetFiles } from '$lib/services/assets/parser';
import { isLastCommitPublished } from '$lib/services/backends';
import { gitConfigFiles } from '$lib/services/backends/git/shared/config';
import { createFileList } from '$lib/services/backends/process';
import { allEntries, dataLoaded, entryParseErrors } from '$lib/services/contents';
import { prepareEntries } from '$lib/services/contents/file/process';

/**
 * @import {
 * Asset,
 * BaseAssetListItem,
 * BaseConfigListItem,
 * BaseEntryListItem,
 * BaseFileList,
 * BaseFileListItem,
 * BaseFileListItemProps,
 * Entry,
 * RepositoryContentsMap,
 * RepositoryInfo,
 * } from '$lib/types/private';
 */

/**
 * @typedef {(lastHash: string) => Promise<BaseFileListItemProps[]>} FetchFileListFunction
 */

/**
 * Get the file list from the meta database or fetch it if not cached.
 * @param {object} args Arguments.
 * @param {IndexedDB} args.metaDB The meta database instance.
 * @param {string} args.lastHash The latest commit hash.
 * @param {[string, any][]} args.cachedFileEntries Cached file entries.
 * @param {FetchFileListFunction} args.fetchFileList Function to fetch the repository’s complete
 * file list.
 * @returns {Promise<BaseFileList>} The file list.
 */
export const getFileList = async ({ metaDB, lastHash, cachedFileEntries, fetchFileList }) => {
  const cachedHash = await metaDB.get('last_commit_hash');
  const gitConfigFetched = await metaDB.get('git_config_fetched');

  // Skip fetching the file list if the cached hash matches the latest. But don’t skip if the file
  // cache is empty; something probably went wrong the last time the files were fetched.
  if (cachedHash && cachedHash === lastHash && gitConfigFetched && cachedFileEntries.length) {
    return createFileList(
      cachedFileEntries.map(([path, data]) => ({
        path,
        name: getPathInfo(path).basename,
        ...data,
      })),
    );
  }

  // Get a complete file list first, and filter what’s managed in CMS
  const fileList = createFileList(await fetchFileList(lastHash));

  metaDB.set('last_commit_hash', lastHash);
  metaDB.set('git_config_fetched', true);

  return fileList;
};

/**
 * Restore cached text and commit info to `allFiles` array.
 * @param {object} args Arguments.
 * @param {BaseFileListItem[]} args.allFiles The list of all files.
 * @param {RepositoryContentsMap} args.cachedFiles Cached files object.
 */
export const restoreCachedFileData = ({ allFiles, cachedFiles }) => {
  allFiles.forEach(({ sha, path }, index) => {
    if (cachedFiles[path]?.sha === sha) {
      Object.assign(allFiles[index], cachedFiles[path]);
    }
  });
};

/**
 * Parse a file and add additional metadata, such as name, size, and text content.
 * @param {object} args Arguments.
 * @param {BaseFileListItem} args.file File to parse.
 * @param {RepositoryContentsMap} args.fetchedFileMap Map of fetched file metadata and content.
 * @returns {BaseFileListItem} Parsed file with additional metadata.
 */
export const parseFile = ({ file, fetchedFileMap }) => {
  // The `size` and `text` are only available in the 2nd request (`fetchFileContents`) for the
  // GitLab backend, so we need to set them here if they are not already defined
  const { meta, size, text } = fetchedFileMap[file.path] ?? {};

  return {
    ...file,
    size: file.size ?? size,
    text: file.text ?? text,
    meta: file.meta ?? meta,
  };
};

/**
 * Update the stores with the latest entries, assets, config files, and errors.
 * @param {object} args Arguments.
 * @param {Entry[]} args.entries List of entry files.
 * @param {Asset[]} args.assets List of asset files.
 * @param {BaseConfigListItem[]} args.configFiles List of Git config files.
 * @param {Error[]} [args.errors] List of errors encountered while parsing entries.
 */
export const updateStores = ({ entries, assets, configFiles, errors = [] }) => {
  allEntries.set(entries);
  allAssets.set(assets);
  gitConfigFiles.set(configFiles);
  entryParseErrors.set(errors);
  dataLoaded.set(true);
};

/**
 * Update the file cache by saving new entries and deleting unused ones.
 * @param {object} args Arguments.
 * @param {IndexedDB} args.cacheDB The cache database instance.
 * @param {BaseFileListItem[]} args.allFiles List of all files in the repository.
 * @param {RepositoryContentsMap} args.cachedFiles Cached files object.
 * @param {BaseFileListItem[]} args.fetchingFiles List of files being fetched.
 * @param {RepositoryContentsMap} args.fetchedFileMap Map of newly fetched file data.
 */
export const updateCache = async ({
  cacheDB,
  allFiles,
  cachedFiles,
  fetchingFiles,
  fetchedFileMap,
}) => {
  const usedPaths = allFiles.map(({ path }) => path);
  const unusedPaths = Object.keys(cachedFiles).filter((path) => !usedPaths.includes(path));

  // Save new entry caches
  if (fetchingFiles.length) {
    await cacheDB.saveEntries(Object.entries(fetchedFileMap));
  }

  // Delete old entry caches; we don’t need `await` for the deletion to finish, as it’s not critical
  if (unusedPaths.length) {
    cacheDB.deleteEntries(unusedPaths);
  }
};

/**
 * Fetch file list from a backend service, download/parse all the entry files, then cache them in
 * the {@link allEntries} and {@link allAssets} stores.
 * @param {object} args Arguments.
 * @param {RepositoryInfo} args.repository Repository info.
 * @param {() => Promise<string>} args.fetchDefaultBranchName Function to fetch the repository’s
 * default branch name.
 * @param {() => Promise<{ hash: string, message: string }>} args.fetchLastCommit Function to fetch
 * the last commit’s SHA-1 hash and message.
 * @param {FetchFileListFunction} args.fetchFileList Function to fetch the repository’s complete
 * file list.
 * @param {(fetchingFiles: BaseFileListItem[]) => Promise<RepositoryContentsMap>
 * } args.fetchFileContents Function to fetch the metadata of entry/asset files as well as text file
 * contents.
 */
export const fetchAndParseFiles = async ({
  repository,
  fetchDefaultBranchName,
  fetchLastCommit,
  fetchFileList,
  fetchFileContents,
}) => {
  const { databaseName, branch: branchName } = repository;
  const metaDB = new IndexedDB(/** @type {string} */ (databaseName), 'meta');
  const cacheDB = new IndexedDB(/** @type {string} */ (databaseName), 'file-cache');
  const cachedFileEntries = await cacheDB.entries();
  let branch = branchName;

  if (!branch) {
    branch = await fetchDefaultBranchName();
    repository.branch = branch;
  }

  // This has to be done after the branch is determined
  const { hash: lastHash, message } = await fetchLastCommit();
  const fileList = await getFileList({ metaDB, lastHash, cachedFileEntries, fetchFileList });

  // @todo Check if the commit has a workflow run that trigged deployment
  isLastCommitPublished.set(!message.startsWith('[skip ci]'));

  // Skip fetching files if no files found
  if (!fileList.count) {
    updateStores({ entries: [], assets: [], configFiles: [] });

    return;
  }

  const { entryFiles, assetFiles, configFiles, allFiles } = fileList;
  /** @type {RepositoryContentsMap} */
  const cachedFiles = Object.fromEntries(cachedFileEntries);

  restoreCachedFileData({ allFiles, cachedFiles });

  const fetchingFiles = allFiles.filter(({ meta }) => !meta);
  const fetchedFileMap = fetchingFiles.length ? await fetchFileContents(fetchingFiles) : {};

  const { entries, errors } = await prepareEntries(
    entryFiles.map(
      (file) => /** @type {BaseEntryListItem} */ (parseFile({ file, fetchedFileMap })),
    ),
  );

  updateStores({
    entries,
    assets: parseAssetFiles(
      assetFiles.map(
        (file) => /** @type {BaseAssetListItem} */ (parseFile({ file, fetchedFileMap })),
      ),
    ),
    configFiles: configFiles.map(
      (file) => /** @type {BaseConfigListItem} */ (parseFile({ file, fetchedFileMap })),
    ),
    errors,
  });

  await updateCache({ cacheDB, allFiles, cachedFiles, fetchingFiles, fetchedFileMap });
};
