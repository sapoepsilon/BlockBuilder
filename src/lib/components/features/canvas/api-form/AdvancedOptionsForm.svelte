<!-- AdvancedOptionsForm.svelte -->
<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import type { ApiBlockConfig } from '$lib/types/apiBlockConfig';

  let { formData, updateCurlCommand } = $props<{
    formData: ApiBlockConfig;
    updateCurlCommand: () => void;
  }>();
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <label class="block text-sm font-medium">Response Type</label>
    <select
      bind:value={formData.responseType}
      class="w-full p-2 border rounded"
    >
      <option value="json">JSON</option>
      <option value="text">Text</option>
      <option value="blob">Blob</option>
      <option value="arraybuffer">Array Buffer</option>
    </select>
  </div>

  <div class="space-y-2">
    <label class="block text-sm font-medium">Timeout (ms)</label>
    <Input
      type="number"
      bind:value={formData.timeout}
      placeholder="30000"
    />
  </div>

  <div class="space-y-2 px-2">
    <label class="block text-sm font-medium">Retry Configuration</label>
    <div class="flex gap-2">
      <Input
        type="number"
        bind:value={formData.retryConfig.maxRetries}
        placeholder="Max Retries"
      />
      <Input
        type="number"
        bind:value={formData.retryConfig.retryDelay}
        placeholder="Retry Delay (ms)"
      />
    </div>
  </div>

  {#if formData.method !== 'GET'}
    <div class="space-y-2">
      <label class="block text-sm font-medium">Request Body</label>
      <textarea
        class="w-full p-2 border rounded"
        rows="4"
        bind:value={formData.body}
        on:input={updateCurlCommand}
        placeholder="Request body (JSON)"
      />
    </div>
  {/if}
</div>
