<!-- AuthenticationForm.svelte -->
<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import type { ApiBlockConfig } from '$lib/types/apiBlockConfig';

  let { formData, authType, updateCurlCommand } = $props<{
    formData: ApiBlockConfig;
    authType: string;
    updateCurlCommand: () => void;
  }>();

  $effect(() => {
    if (!formData.authentication) {
      formData.authentication = { type: 'none' };
    }
  });
</script>

<div class="space-y-2 px-2">
  <label class="block text-sm font-medium">Authentication</label>
  <select
    bind:value={authType}
    class="w-full p-2 border rounded"
    on:change={updateCurlCommand}
  >
    <option value="none">None</option>
    <option value="basic">Basic Auth</option>
    <option value="bearer">Bearer Token</option>
    <option value="api-key">API Key</option>
  </select>

  {#if authType === 'basic'}
    <div class="space-y-2 px-2">
      <Input
        type="text"
        placeholder="Username"
        bind:value={formData.authentication.username}
        on:input={updateCurlCommand}
      />
      <Input
        type="password"
        placeholder="Password"
        bind:value={formData.authentication.password}
        on:input={updateCurlCommand}
      />
    </div>
  {:else if authType === 'bearer'}
    <Input
      type="text"
      placeholder="Bearer Token"
      bind:value={formData.authentication.token}
      on:input={updateCurlCommand}
    />
  {:else if authType === 'api-key'}
    <div class="space-y-2 px-2">
      <Input
        type="text"
        placeholder="API Key Name"
        class="px-4"
        bind:value={formData.authentication.key}
        on:input={updateCurlCommand}
      />
      <Input
        type="text"
        placeholder="API Key Value"
        bind:value={formData.authentication.value}
        on:input={updateCurlCommand}
      />
      <select
        bind:value={formData.authentication.in}
        class="w-full p-2 border rounded"
        on:change={updateCurlCommand}
      >
        <option value="header">Header</option>
        <option value="query">Query Parameter</option>
      </select>
    </div>
  {/if}
</div>
