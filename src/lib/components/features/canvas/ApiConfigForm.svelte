<!-- lib/components/features/canvas/ApiConfigForm.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Loader2 } from 'lucide-svelte';
  import type { ApiBlockConfig } from '$lib/types/canvas';
  
  let { config, onSubmit } = $props<{
    config: ApiBlockConfig;
    onSubmit: (config: ApiBlockConfig) => void;
  }>();
  
  let formData = $state<ApiBlockConfig>({ ...config });
  let isSubmitting = $state(false);
  
  function addHeader() {
    formData = {
      ...formData,
      headers: {
        ...formData.headers,
        '': ''
      }
    };
  }
  
  function removeHeader(key: string) {
    const { [key]: _, ...rest } = formData.headers;
    formData = {
      ...formData,
      headers: rest
    };
  }
  
  async function handleSubmit(event: Event) {
    event.preventDefault();
    isSubmitting = true;
    try {
      await onSubmit(formData);
    } finally {
      isSubmitting = false;
    }
  }
</script>
  
<form 
  class="space-y-4 p-4"
  on:submit|preventDefault={handleSubmit}
>
  <div class="space-y-2">
    <label class="block text-sm font-medium">Method</label>
    <select
      bind:value={formData.method}
      class="w-full p-2 border rounded"
    >
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="DELETE">DELETE</option>
      <option value="PATCH">PATCH</option>
    </select>
  </div>

  <div class="space-y-2">
    <label class="block text-sm font-medium">URL</label>
    <Input
      type="text"
      bind:value={formData.url}
      placeholder="https://api.example.com/endpoint"
    />
  </div>

  <div class="space-y-2">
    <label class="block text-sm font-medium">Headers</label>
    {#each Object.entries(formData.headers) as [key, value]}
      <div class="flex gap-2">
        <Input
          type="text"
          placeholder="Header name"
          value={key}
        />
        <Input
          type="text"
          placeholder="Header value"
          value={value}
        />
        <Button
          variant="destructive"
          size="sm"
          onclick={() => removeHeader(key)}
          type="button"
        >
          Remove
        </Button>
      </div>
    {/each}
    <Button
      variant="secondary"
      size="sm"
      onclick={addHeader}
      type="button"
    >
      Add Header
    </Button>
  </div>

  {#if formData.method !== 'GET'}
    <div class="space-y-2">
      <label class="block text-sm font-medium">Body</label>
      <textarea
        class="w-full p-2 border rounded font-mono text-sm"
        rows="4"
        bind:value={formData.bodyParams}
      />
    </div>
  {/if}

  <div class="flex justify-end gap-2">
    <Button type="submit" disabled={isSubmitting}>
      {#if isSubmitting}
        <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        Saving...
      {:else}
        Save
      {/if}
    </Button>
  </div>
</form>