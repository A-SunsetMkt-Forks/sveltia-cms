<script>
  import { _ } from 'svelte-i18n';

  import PrefSwitch from '$lib/components/settings/controls/pref-switch.svelte';

  /**
   * @typedef {object} Props
   * @property {(detail: { message: string }) => void} [onChange] Custom `change` event handler.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const, no-unused-vars */
    onChange = undefined,
    /* eslint-enable prefer-const, no-unused-vars */
  } = $props();
</script>

<section>
  <h4>
    {$_('prefs.accessibility.underline_links.title')}
  </h4>
  <p>
    {$_('prefs.accessibility.underline_links.description')}
  </p>
  <div role="none">
    <PrefSwitch
      key="underlineLinks"
      label={$_('prefs.accessibility.underline_links.switch_label')}
    />
  </div>
</section>
