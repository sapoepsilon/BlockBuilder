<!-- HeadersForm.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import type { ApiBlockConfig } from '$lib/types/apiBlockConfig';

  let { formData, updateCurlCommand } = $props<{
    formData: ApiBlockConfig;
    updateCurlCommand: () => void;
  }>();

  function addHeader() {
    formData = {
      ...formData,
      headers: {
        ...formData.headers,
        '': ''
      }
    };
    updateCurlCommand();
  }

  function removeHeader(key: string) {
    const { [key]: _, ...rest } = formData.headers;
    formData = {
      ...formData,
      headers: rest
    };
    updateCurlCommand();
  }
</script>

<div class="space-y-2 px-2">
  <label class="block text-sm font-medium">Headers</label>
  {#each Object.entries(formData.headers || {}) as [key, value]}
    <div class="flex gap-2">
      <Input
        type="text"
        placeholder="Header name"
        value={key}
        on:input={(e) => {
          const newHeaders = { ...formData.headers };
          delete newHeaders[key];
          newHeaders[e.currentTarget.value] = value;
          formData = { ...formData, headers: newHeaders };
          updateCurlCommand();
        }}
      />
      <Input
        type="text"
        placeholder="Header value"
        value={value}
        on:input={(e) => {
          formData = {
            ...formData,
            headers: {
              ...formData.headers,
              [key]: e.currentTarget.value
            }
          };
          updateCurlCommand();
        }}
      />
      <Button
        variant="destructive"
        size="sm"
        on:click={() => removeHeader(key)}
        type="button"
      >
        Remove
      </Button>
    </div>
  {/each}
  <Button
    variant="secondary"
    size="sm"
    on:click={addHeader}
    type="button"
  >
    Add Header
  </Button>
</div>
