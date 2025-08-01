<script>
  import { Button, Icon, Menu, MenuItem, PromptDialog, SplitButton } from '@sveltia/ui';
  import DOMPurify from 'isomorphic-dompurify';
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { allBackendServices } from '$lib/services/backends';
  import { siteConfig } from '$lib/services/config';
  import {
    signInAutomatically,
    signInError,
    signInManually,
    unauthenticated,
  } from '$lib/services/user/auth';

  let isLocalHost = $state(false);
  let isLocalBackendSupported = $state(false);
  let isBrave = $state(false);
  let showTokenDialog = $state(false);
  let token = $state('');

  const configuredBackendName = $derived(/** @type {string} */ ($siteConfig?.backend?.name));
  const configuredBackend = $derived(
    configuredBackendName ? allBackendServices[configuredBackendName] : null,
  );
  const repositoryName = $derived($siteConfig?.backend?.repo?.split('/')?.[1]);
  const isTestRepo = $derived(configuredBackendName === 'test-repo');

  /**
   * Show sign-in options for Git-based backends or a single button for the Test backend.
   */
  const ButtonComponent = $derived(isTestRepo ? Button : SplitButton);

  onMount(() => {
    const { hostname } = window.location;

    // Local editing needs a secure context, either `http://localhost` or `http://*.localhost`
    // https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts
    isLocalHost =
      hostname === '127.0.0.1' || hostname === 'localhost' || hostname.endsWith('.localhost');
    isLocalBackendSupported = 'showDirectoryPicker' in window;
    isBrave = navigator.userAgentData?.brands.some(({ brand }) => brand === 'Brave') ?? false;

    signInAutomatically();
  });
</script>

<div role="none" class="buttons">
  {#if !$unauthenticated}
    <div role="alert" class="message">{$_('signing_in')}</div>
  {:else if !configuredBackend}
    <div role="alert">
      {$_('config.error.unsupported_backend', { values: { name: configuredBackendName } })}
    </div>
  {:else}
    <ButtonComponent
      variant="primary"
      popupPosition="bottom-right"
      label={isTestRepo
        ? $_('work_with_test_repo')
        : $_('sign_in_with_x', { values: { service: configuredBackend.label } })}
      onclick={async () => {
        await signInManually(configuredBackendName);
      }}
    >
      {#snippet popup()}
        <Menu>
          <MenuItem
            label={$_('use_regular_authentication_flow')}
            onclick={async () => {
              await signInManually(configuredBackendName);
            }}
          />
          <MenuItem
            label={$_('use_personal_access_token')}
            onclick={async () => {
              showTokenDialog = true;
            }}
          />
        </Menu>
      {/snippet}
    </ButtonComponent>
    {#if isLocalHost && !isTestRepo}
      <Button
        variant="primary"
        label={$_('work_with_local_repo')}
        disabled={!isLocalBackendSupported}
        onclick={async () => {
          await signInManually('local');
        }}
      />
      {#if !isLocalBackendSupported}
        <div role="alert">
          {#if isBrave}
            {@html DOMPurify.sanitize(
              $_('local_backend.disabled').replace(
                '<a>',
                '<a href="https://github.com/sveltia/sveltia-cms#enabling-local-development-in-brave" target="_blank">',
              ),
              { ALLOWED_TAGS: ['a'], ALLOWED_ATTR: ['href', 'target'] },
            )}
          {:else}
            {$_('local_backend.unsupported_browser')}
          {/if}
        </div>
      {:else if !$signInError.message}
        <div role="none">
          {#if repositoryName}
            {$_('work_with_local_repo_description', { values: { repo: repositoryName } })}
          {:else}
            {$_('work_with_local_repo_description_no_repo')}
          {/if}
        </div>
      {/if}
    {/if}
  {/if}
  {#if $signInError.message && $signInError.context === 'authentication'}
    <div role="alert" class="error">
      <Icon name="error" />
      {$signInError.message}
    </div>
  {/if}
</div>

<PromptDialog
  bind:open={showTokenDialog}
  bind:value={token}
  title={$_('sign_in_using_pat_title')}
  textboxAttrs={{ spellcheck: false, 'aria-label': $_('personal_access_token') }}
  okLabel={$_('sign_in')}
  okDisabled={!token.trim()}
  onOk={async () => {
    await signInManually(configuredBackendName, token.trim());
  }}
>
  {$_('sign_in_using_pat_description')}
</PromptDialog>

<style lang="scss">
  .buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    :global {
      .button {
        width: 240px;
      }

      .split-button {
        width: 240px;

        button {
          width: auto;
        }

        & > .button:first-child {
          flex: auto;
        }
      }
    }
  }

  [role='alert'] {
    display: flex;
    align-items: center;
    gap: 8px;

    &.error {
      color: var(--sui-error-foreground-color);
    }
  }
</style>
