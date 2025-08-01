<script>
  import { Button, Icon } from '@sveltia/ui';
  import { generateElementId } from '@sveltia/utils/element';
  import { sleep } from '@sveltia/utils/misc';
  import equal from 'fast-deep-equal';
  import { onMount, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { getEditorComponent } from '$lib/services/contents/widgets/markdown/component-helper';

  /**
   * @import { InternalLocaleCode } from '$lib/types/private';
   * @import { Field, FieldKeyPath } from '$lib/types/public';
   */

  /**
   * @typedef {object} Props
   * @property {string} componentId Editor component ID.
   * @property {string} label Field label.
   * @property {Field[]} fields Subfield definitions.
   * @property {Record<string, any>} values Value map.
   * @property {(event: CustomEvent) => void} [onChange] Custom `change` event handler.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    componentId,
    label,
    fields,
    values = {},
    onChange = () => undefined,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {HTMLElement | undefined} */
  let wrapper = $state();
  /** @type {InternalLocaleCode} */
  let locale = $state('');
  /** @type {FieldKeyPath} */
  let keyPath = $state('');
  /** @type {Record<string, any>} */
  const inputValues = $state({});

  /**
   * Get the wrapper element.
   * @returns {HTMLElement | undefined} Wrapper.
   */
  export const getElement = () => wrapper;

  onMount(() => {
    window.requestAnimationFrame(() => {
      locale = /** @type {string} */ (
        /** @type {HTMLElement} */ (wrapper?.closest('[data-locale]'))?.dataset.locale
      );
      keyPath = /** @type {string} */ (
        /** @type {HTMLElement} */ (wrapper?.closest('[data-key-path]'))?.dataset.keyPath
      );
    });
  });

  $effect(() => {
    void [values];

    untrack(() => {
      if (!equal(values, $state.snapshot(inputValues))) {
        Object.assign(inputValues, values);
      }
    });
  });

  $effect(() => {
    onChange(new CustomEvent('update', { detail: $state.snapshot(inputValues) }));
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  role="group"
  class="wrapper"
  bind:this={wrapper}
  contenteditable="false"
  tabindex="0"
  aria-label={label}
  data-component-id={componentId}
  onkeydown={(event) => {
    if (
      !(/** @type {HTMLElement} */ (event.target).matches('button, input, textarea')) &&
      event.key !== 'Tab'
    ) {
      event.preventDefault();
    }

    if (event.target === wrapper && event.key === 'Backspace') {
      onChange(new CustomEvent('remove'));
    }
  }}
>
  <header role="none">
    <h3 role="none">{label}</h3>
    <Button
      size="small"
      iconic
      aria-label={$_('remove')}
      onclick={() => {
        onChange(new CustomEvent('remove'));
      }}
    >
      {#snippet startIcon()}
        <Icon name="close" />
      {/snippet}
    </Button>
  </header>
  {#if locale && keyPath}
    {#each fields as fieldConfig (fieldConfig.name)}
      {#await sleep() then}
        <!-- @todo Support `default` option -->
        {@const { name: fieldName, label: fieldLabel = fieldName, widget = 'string' } = fieldConfig}
        {@const Editor = getEditorComponent(fieldConfig)}
        {#if Editor}
          <section
            role="group"
            class="field"
            aria-label={$_('x_field', { values: { field: fieldLabel } })}
            data-widget={widget}
            data-key-path="{keyPath}:{fieldName}"
            onkeydowncapture={(event) => {
              // Allow to select all in any `TextInput` within the component below using Ctrl+A
              event.stopPropagation();
            }}
          >
            <header role="none">
              <h4 role="none">{fieldLabel}</h4>
            </header>
            <div role="none" class="widget-wrapper">
              <Editor
                {locale}
                keyPath="{keyPath}:{fieldName}"
                fieldId={generateElementId('field')}
                {fieldLabel}
                required={fieldConfig.required ?? true}
                readonly={fieldConfig.readonly ?? false}
                {fieldConfig}
                context="markdown-editor-component"
                bind:currentValue={inputValues[fieldName]}
              />
            </div>
          </section>
        {/if}
      {/await}
    {/each}
  {/if}
</div>

<style lang="scss">
  .wrapper {
    display: inline-block; // Cancel underline if the component is within a link
    border: 1px solid var(--sui-secondary-border-color);
    border-radius: 4px;
    width: 100%;
    color: var(--sui-secondary-foreground-color); // Reset color within a link
    background-color: var(--sui-primary-background-color);
    white-space: normal;
    -webkit-user-select: none;
    user-select: none;

    &:focus {
      outline-color: var(--sui-primary-accent-color-translucent);
    }

    & > header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--sui-secondary-foreground-color);
      background-color: var(--sui-selected-background-color);

      h3 {
        padding: 0 8px;
        font-size: var(--sui-font-size-small);
        font-weight: 600;
      }

      :global(button) {
        padding: 0;
        height: 16px;
      }
    }
  }

  section {
    margin: 0;
    border-top: 1px solid var(--sui-secondary-border-color);
    padding: var(--field-editor-padding);

    h4 {
      margin-bottom: 8px !important;
      font-size: var(--sui-font-size-small);
      font-weight: 600;
      color: var(--sui-secondary-foreground-color);
    }

    &[data-widget='string'] {
      @media (768px <= width) {
        display: flex;
        align-items: center;
        gap: 8px;

        :is([data-component-id='image'], [data-component-id='linked-image']) & {
          border-width: 0;
          padding-block: 0 16px;
        }

        h4 {
          margin-bottom: 0 !important;
        }

        .widget-wrapper {
          flex: auto;
        }
      }
    }
  }
</style>
