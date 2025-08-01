<script>
  import { Button, Divider, Icon, Spacer, Toolbar } from '@sveltia/ui';
  import { _ } from 'svelte-i18n';

  import FilterMenu from '$lib/components/common/page-toolbar/filter-menu.svelte';
  import ItemSelector from '$lib/components/common/page-toolbar/item-selector.svelte';
  import SortMenu from '$lib/components/common/page-toolbar/sort-menu.svelte';
  import ViewSwitcher from '$lib/components/common/page-toolbar/view-switcher.svelte';
  import { selectedAssets } from '$lib/services/assets';
  import { ASSET_KINDS } from '$lib/services/assets/kinds';
  import { assetGroups, currentView, listedAssets } from '$lib/services/assets/view';
  import { sortKeys } from '$lib/services/assets/view/sort-keys';
  import { isMediumScreen, isSmallScreen } from '$lib/services/user/env';

  const hasListedAssets = $derived(!!$listedAssets.length);
  const hasMultipleAssets = $derived($listedAssets.length > 1);
</script>

<Toolbar variant="secondary" aria-label={$_('asset_list')}>
  {#if !($isSmallScreen || $isMediumScreen)}
    <ItemSelector allItems={Object.values($assetGroups).flat(1)} selectedItems={selectedAssets} />
  {/if}
  <Spacer flex />
  <SortMenu
    disabled={!hasMultipleAssets}
    {currentView}
    sortKeys={$sortKeys}
    aria-controls="asset-list"
  />
  <FilterMenu
    label={$_('type')}
    disabled={!hasMultipleAssets}
    {currentView}
    noneLabel={$_('all')}
    filters={ASSET_KINDS.map((type) => ({ label: $_(type), field: 'fileType', pattern: type }))}
    aria-controls="asset-list"
  />
  <ViewSwitcher disabled={!hasListedAssets} {currentView} aria-controls="asset-list" />
  {#if !($isSmallScreen || $isMediumScreen)}
    <Divider orientation="vertical" />
    <Button
      variant="ghost"
      iconic
      disabled={!hasListedAssets}
      pressed={!!$currentView.showInfo}
      aria-controls="asset-info"
      aria-expanded={!!$currentView.showInfo}
      aria-label={$_($currentView.showInfo ? 'hide_info' : 'show_info')}
      onclick={() => {
        currentView.update((view) => ({
          ...view,
          showInfo: !$currentView.showInfo,
        }));
      }}
    >
      {#snippet startIcon()}
        <Icon name="info" />
      {/snippet}
    </Button>
  {/if}
</Toolbar>
