<!-- CurlCommandDisplay.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Copy } from 'lucide-svelte';

  let { curlCommand } = $props<{
    curlCommand: string;
  }>();

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(curlCommand);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
</script>

{#if curlCommand}
  <div class="space-y-2 bg-gray-100 p-4 rounded">
    <div class="flex justify-between items-center mb-2">
      <label class="block text-sm font-medium">cURL Command</label>
      <Button
        variant="ghost"
        size="sm"
        on:click={copyToClipboard}
        class="hover:bg-gray-200"
      >
        <Copy class="w-4 h-4 mr-1" />
        Copy
      </Button>
    </div>
    <div class="bg-white p-3 rounded border">
      <pre class="text-sm overflow-x-auto whitespace-pre-wrap break-all">{curlCommand}</pre>
    </div>
  </div>
{/if}
