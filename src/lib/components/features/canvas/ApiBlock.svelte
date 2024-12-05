<script lang="ts">
  import { onMount } from 'svelte';
  import { executeApiCall } from '$lib/services/api';
  import { getApiLogs } from '$lib/services/api';
  import { Button } from '$lib/components/ui/button';
  import { Sheet, SheetHeader } from '$lib/components/ui/sheet';
  import SheetContent from '$lib/components/ui/sheet/sheet-content.svelte';
  import SheetTitle from '$lib/components/ui/sheet/sheet-title.svelte';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
  import { ResizableHandle } from '$lib/components/ui/resizable';
  import { X } from 'lucide-svelte';
  import { Loader2 } from 'lucide-svelte';
  import ApiConfigForm from './ApiConfigForm.svelte';
  import ApiLogsDialog from "./ApiLogsDialog.svelte";
  import { apiStore } from '$lib/stores/api';
  import { setContext } from 'svelte';
  import type { Block } from '$lib/types/block';
  import type { ApiBlockConfig } from '$lib/types/apiBlockConfig';

  let { 
    block, 
    onUpdate, 
    onRemove 
  } = $props<{
    block: Block;
    onUpdate: (block: Block) => void;
    onRemove: () => void;
  }>();

  let showConfigModal = $state(false);
  let showResponseDialog = $state(false);
  let showLogsDialog = $state(false);
  let isExecuting = $state(false);
  let response = $state<any>(null);
  let error = $state<string | null>(null);
  let savedApis = $state<Array<any>>([]);
  let apiLogs = $state<string[]>([]);

  // Subscribe to the API store
  apiStore.subscribe(apis => {
    savedApis = apis;
  });

  setContext('sheet', {
    setOpen: (value: boolean) => showConfigModal = value
  });

  async function handleExecute() {
    isExecuting = true;
    error = null;
    try {
      console.log(`block.config`, block.config);
      // Add blockId to the config
      const configWithId = {
        ...block.config,
        blockId: block.id
      };
      response = await executeApiCall(configWithId);
      console.log(`response`, JSON.stringify(response));
      showResponseDialog = true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      if (errorMessage.toLowerCase().includes('cors') || errorMessage.includes('cross-origin')) {
        error = "CORS Error: Unable to access the API due to browser security restrictions. We're working on fixing this issue. In the meantime, you can try using a CORS-enabled API or contact us for support.";
      } else {
        error = errorMessage;
      }
      showResponseDialog = true;
    } finally {
      isExecuting = false;
    }
  }

  function handleConfigUpdate(newConfig: ApiBlockConfig) {
    // Save to API store if it's a new configuration
    if (newConfig.name) {
      apiStore.add({
        name: newConfig.name,
        endpoint: newConfig.url,
        method: newConfig.method,
        headers: newConfig.headers,
        body: newConfig.body
      });
    }
    
    onUpdate({
      ...block,
      config: newConfig
    });
    showConfigModal = false;
  }

  function handleCloseClick(event: MouseEvent) {
    // Prevent the click from triggering canvas events
    event.preventDefault();
    event.stopPropagation();
    onRemove();
  }
</script>

<div
  class="absolute p-4 bg-white rounded-lg shadow-lg border-2 border-blue-500 w-auto h-auto"
  style="left: {block.x}px; top: {block.y}px;"
>
  <div class="flex flex-col h-full">
    <div class="flex justify-between items-center mb-2">
      <span class="font-bold text-sm">{block.config.method} Request</span>
      <div class="flex gap-2 items-center">
        <Button
          variant="secondary"
          size="sm"
          on:click={() => showConfigModal = true}
        >
          Configure
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={isExecuting}
          on:click={handleExecute}
        >
          {#if isExecuting}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Executing...
          {:else}
            Execute
          {/if}
        </Button>
        <Button
          variant="outline"
          size="sm"
          on:click={() => {
            apiLogs = getApiLogs(block.id);
            showLogsDialog = true;
          }}
        >
          Logs
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6"
          on:click={handleCloseClick}
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div class="text-xs truncate mb-2">
      {block.config.url}
    </div>

    {#if error}
      <div class="text-red-500 text-xs mt-2">
        {error}
      </div>
    {/if}
  </div>
</div>

{#if showConfigModal}
  <Sheet bind:open={showConfigModal}>
    <SheetContent class="!w-[40%] !max-w-[90%]" side="right">
      <SheetHeader>
        <SheetTitle>API Configuration</SheetTitle>
      </SheetHeader>
      <ApiConfigForm
        config={block.config}
        onSubmit={handleConfigUpdate}
      />
    </SheetContent>
  </Sheet>
{/if}

<Dialog bind:open={showResponseDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{error ? 'Error' : 'API Response'}</DialogTitle>
    </DialogHeader>
    {#if error}
      <div class="p-4 bg-destructive/10 text-destructive rounded-md">
        <p class="mb-2 font-semibold">Error Message:</p>
        <p class="text-sm">{error}</p>
      </div>
    {:else if response}
      <div class="p-4 bg-muted rounded-md overflow-auto max-h-[60vh]">
        <pre class="whitespace-pre-wrap break-words">{JSON.stringify(response, null, 2)}</pre>
      </div>
    {/if}
  </DialogContent>
</Dialog>

<ApiLogsDialog bind:open={showLogsDialog} bind:apiLogs={apiLogs} />