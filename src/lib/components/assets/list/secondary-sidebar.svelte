<script>
  import { EmptyState, Group } from '@sveltia/ui';
  import { _ } from 'svelte-i18n';

  import InfoPanel from '$lib/components/assets/shared/info-panel.svelte';
  import { focusedAsset } from '$lib/services/assets';
  import { currentView } from '$lib/services/assets/view';
  import { isLargeScreen } from '$lib/services/user/env';
</script>

{#if $isLargeScreen && $currentView.showInfo}
  <Group id="asset-info" class="secondary-sidebar" aria-label={$_('asset_info')}>
    {#if $focusedAsset}
      <InfoPanel asset={$focusedAsset} showPreview={true} />
    {:else}
      <EmptyState>
        <span role="none">{$_('select_asset_show_info')}</span>
      </EmptyState>
    {/if}
  </Group>
{/if}
