<script>
  import { Toolbar } from '@sveltia/ui';
  import { _ } from 'svelte-i18n';
  import PageSwitcher from '$lib/components/global/toolbar/items/page-switcher.svelte';
  import { hasOverlay } from '$lib/services/app/navigation';
</script>

<div role="none" class="toolbar-wrapper" inert={$hasOverlay}>
  <Toolbar variant="primary" aria-label={$_('global')}>
    <div role="none" class="buttons">
      <PageSwitcher />
    </div>
  </Toolbar>
</div>

<style lang="scss">
  .toolbar-wrapper {
    border-top: 1px solid var(--sui-secondary-border-color);

    &[inert] {
      // Disable the keyboard shortcut for the search bar
      display: none;
    }
  }

  .buttons {
    flex: auto;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
  }
</style>
