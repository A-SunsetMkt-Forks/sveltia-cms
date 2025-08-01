<script>
  import { Dialog, TextInput } from '@sveltia/ui';
  import { getPathInfo } from '@sveltia/utils/file';
  import { _ } from 'svelte-i18n';

  import { goto, parseLocation } from '$lib/services/app/navigation';
  import { getAssetsByDirName, renamingAsset } from '$lib/services/assets';
  import { moveAssets } from '$lib/services/assets/data/move';
  import { getAssetDetails } from '$lib/services/assets/info';
  import { showAssetOverlay } from '$lib/services/assets/view';

  /**
   * @import { Entry } from '$lib/types/private';
   */

  const componentId = $props.id();

  let open = $state(false);
  /** @type {{ dirname?: string, filename: string, extension?: string }} */
  let pathInfo = $state({ filename: '' });
  let newName = $state('');
  /** @type {string[]} */
  let otherNames = $state([]);
  /** @type {Entry[]} */
  let usedEntries = $state([]);

  const asset = $derived($renamingAsset);
  const { dirname, filename, extension } = $derived(pathInfo);

  const error = $derived.by(() => {
    if (!newName.trim()) return 'empty';
    if (newName.includes('/')) return 'character';
    if (otherNames.includes(`${newName}${extension ? `.${extension}` : ''}`)) return 'duplicate';
    return undefined;
  });

  const invalid = $derived(!!error);

  /**
   * Initialize the state.
   */
  const initState = async () => {
    if (asset) {
      pathInfo = getPathInfo(asset.path);
      newName = filename;
      otherNames = getAssetsByDirName(/** @type {string} */ (dirname))
        .map((a) => a.name)
        .filter((n) => n !== asset.name);
      ({ usedEntries } = await getAssetDetails(asset));
      open = true;
    }
  };

  /**
   * Rename the asset by moving it to a new path. Also, update the URL hash silently to reflect the
   * new asset name if the rename dialog was opened in the asset details view.
   */
  const renameAsset = async () => {
    if (!asset) {
      return;
    }

    const oldPath = asset.path;
    const newPath = `${dirname}/${newName}${extension ? `.${extension}` : ''}`;

    await moveAssets('rename', [{ asset, path: newPath }]);

    if (parseLocation().path === `/assets/${oldPath}`) {
      await goto(`/assets/${newPath}`, { replaceState: true, notifyChange: false });
    }
  };

  $effect(() => {
    if (asset) {
      initState();
    }
  });

  $effect(() => {
    if (!$showAssetOverlay) {
      open = false;
      $renamingAsset = undefined;
    }
  });
</script>

<Dialog
  title={$_('rename_x', { values: { name: asset?.name } })}
  bind:open
  okLabel={$_('rename')}
  okDisabled={newName === filename || invalid}
  onOk={() => {
    renameAsset();
  }}
  onClose={() => {
    $renamingAsset = undefined;
  }}
>
  <p>
    {$_(
      usedEntries.length === 0
        ? 'enter_new_name_for_asset'
        : usedEntries.length === 1
          ? 'enter_new_name_for_asset_with_one_entry'
          : 'enter_new_name_for_asset_with_many_entries',
      { values: { count: usedEntries.length } },
    )}
  </p>
  <div role="none">
    <TextInput bind:value={newName} flex {invalid} aria-errormessage="{componentId}-error" />
    {#if extension}
      <span role="none">.{extension}</span>
    {/if}
  </div>
  <div role="none" class="error" id="{componentId}-error">
    {#if invalid}
      {$_(`enter_new_name_for_asset_error.${error}`)}
    {/if}
  </div>
</Dialog>

<style lang="scss">
  p {
    margin: 0 0 8px;
  }

  div {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .error {
    margin: 0;
    color: var(--sui-error-foreground-color);
    font-size: var(--sui-font-size-small);
  }
</style>
